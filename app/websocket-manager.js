/**
 * WebSocket 连接管理器
 * 提供实时状态推送、自动重连、心跳检测
 */

const WebSocketManager = {
    ws: null,
    url: null,
    token: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    heartbeatInterval: 30000,
    heartbeatTimer: null,
    isConnected: false,
    messageId: 1,
    pendingMessages: new Map(),
    subscriptions: new Set(),

    /**
     * 初始化 WebSocket 连接
     */
    init(url, token) {
        this.url = url.replace(/^http/, 'ws') + '/api/websocket';
        this.token = token;
        this.connect();
    },

    /**
     * 建立连接
     */
    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[WebSocket] 连接已建立');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // 发送认证
                this.authenticate();
                
                // 启动心跳
                this.startHeartbeat();
                
                // 重新订阅
                this.resubscribeAll();
                
                // 派发连接事件
                window.dispatchEvent(new CustomEvent('ha-websocket-connected'));
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };

            this.ws.onclose = () => {
                console.log('[WebSocket] 连接已关闭');
                this.handleDisconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[WebSocket] 连接错误:', error);
            };

        } catch (error) {
            console.error('[WebSocket] 创建连接失败:', error);
            this.handleDisconnect();
        }
    },

    /**
     * 发送认证
     */
    authenticate() {
        this.send({
            type: 'auth',
            access_token: this.token
        });
    },

    /**
     * 处理消息
     */
    handleMessage(data) {
        switch (data.type) {
            case 'auth_required':
                // 服务器要求认证，已发送
                break;
                
            case 'auth_ok':
                console.log('[WebSocket] 认证成功');
                break;
                
            case 'auth_invalid':
                console.error('[WebSocket] 认证失败');
                this.disconnect();
                break;
                
            case 'event':
                this.handleEvent(data.event);
                break;
                
            case 'result':
                this.handleResult(data);
                break;
                
            case 'pong':
                // 心跳响应
                break;
                
            default:
                console.log('[WebSocket] 收到消息:', data);
        }
    },

    /**
     * 处理事件
     */
    handleEvent(event) {
        if (event.event_type === 'state_changed') {
            const { entity_id, new_state } = event.data;
            
            // 更新状态管理器
            if (window.DeviceStateManager) {
                window.DeviceStateManager.updateCache(entity_id, new_state.state, true);
            }
            
            // 派发全局事件
            window.dispatchEvent(new CustomEvent('device-state-update', {
                detail: {
                    entityId: entity_id,
                    state: new_state.state,
                    attributes: new_state.attributes
                }
            }));
        }
    },

    /**
     * 处理命令结果
     */
    handleResult(data) {
        const pending = this.pendingMessages.get(data.id);
        if (pending) {
            if (data.success) {
                pending.resolve(data.result);
            } else {
                pending.reject(new Error(data.error?.message || '命令失败'));
            }
            this.pendingMessages.delete(data.id);
        }
    },

    /**
     * 订阅实体状态变化
     */
    subscribeEntities(entityIds) {
        entityIds.forEach(id => this.subscriptions.add(id));
        
        if (!this.isConnected) return;
        
        this.send({
            id: this.getMessageId(),
            type: 'subscribe_entities',
            entity_ids: Array.from(this.subscriptions)
        });
    },

    /**
     * 重新订阅所有实体
     */
    resubscribeAll() {
        if (this.subscriptions.size === 0) return;
        
        this.send({
            id: this.getMessageId(),
            type: 'subscribe_entities',
            entity_ids: Array.from(this.subscriptions)
        });
    },

    /**
     * 发送消息
     */
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    },

    /**
     * 发送命令并等待响应
     */
    async sendCommand(type, data = {}) {
        return new Promise((resolve, reject) => {
            const id = this.getMessageId();
            
            this.pendingMessages.set(id, { resolve, reject });
            
            const sent = this.send({
                id,
                type,
                ...data
            });
            
            if (!sent) {
                reject(new Error('WebSocket 未连接'));
                return;
            }
            
            // 超时处理
            setTimeout(() => {
                if (this.pendingMessages.has(id)) {
                    this.pendingMessages.delete(id);
                    reject(new Error('命令超时'));
                }
            }, 10000);
        });
    },

    /**
     * 获取消息ID
     */
    getMessageId() {
        return this.messageId++;
    },

    /**
     * 启动心跳
     */
    startHeartbeat() {
        this.stopHeartbeat();
        
        this.heartbeatTimer = setInterval(() => {
            this.send({ type: 'ping' });
        }, this.heartbeatInterval);
    },

    /**
     * 停止心跳
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    },

    /**
     * 处理断开连接
     */
    handleDisconnect() {
        this.isConnected = false;
        this.stopHeartbeat();
        
        // 派发断开事件
        window.dispatchEvent(new CustomEvent('ha-websocket-disconnected'));
        
        // 自动重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            
            console.log(`[WebSocket] ${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连...`);
            
            setTimeout(() => this.connect(), delay);
        } else {
            console.error('[WebSocket] 达到最大重连次数，放弃重连');
        }
    },

    /**
     * 断开连接
     */
    disconnect() {
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnected = false;
    },

    /**
     * 获取连接状态
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: this.subscriptions.size,
            pendingMessages: this.pendingMessages.size
        };
    }
};

// 导出到全局
window.WebSocketManager = WebSocketManager;

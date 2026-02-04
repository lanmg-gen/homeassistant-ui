/**
 * Home Assistant 连接管理
 * 使用 WebSocket API 实时获取设备状态
 */

class HAConnection {
    constructor() {
        this.ws = null;
        this.url = null;
        this.token = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = [];
        this.states = {}; // 存储所有设备状态
        this.messageId = 1; // 消息 ID 计数器
    }

    /**
     * 初始化连接
     * @param {string} url - HA 服务器地址
     * @param {string} token - 访问令牌
     */
    init(url, token) {
        this.url = url;
        this.token = token;
        this.connect();
    }

    /**
     * 生成唯一 ID
     */
    generateId() {
        return this.messageId++;
    }

    /**
     * 连接 WebSocket
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        // 将 http:// 替换为 ws://,https:// 替换为 wss://
        const protocol = this.url.includes('https://') ? 'wss://' : 'ws://';
        const wsUrl = this.url.replace(/^https?:\/\//, protocol);
        this.ws = new WebSocket(`${wsUrl}/api/websocket`);

        this.ws.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;
            this.sendAuth();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 错误:', error);
            this.connected = false;
        };

        this.ws.onclose = () => {
            this.connected = false;
            this.attemptReconnect();
        };
    }

    /**
     * 发送认证信息
     */
    sendAuth() {
        if (!this.ws) {
            console.error('WebSocket 未创建');
            return;
        }

        if (this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket 未准备好,当前状态:', this.ws.readyState);
            return;
        }

        const authMessage = {
            type: 'auth',
            access_token: this.token
        };

        try {
            this.ws.send(JSON.stringify(authMessage));
        } catch (error) {
            console.error('发送认证消息失败:', error);
        }
    }

    /**
     * 处理 WebSocket 消息
     * @param {string} data - 消息内容
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'auth_ok':
                    // 认证成功后订阅状态变更事件
                    this.subscribeEvents();
                    break;

                case 'auth_invalid':
                    console.error('认证失败: Token 无效');
                    this.notifyListeners('error', { message: 'Token 无效,请检查配置' });
                    break;

                case 'event':
                    // 处理事件消息
                    if (message.event) {
                        this.handleEvent(message.event);
                    }
                    break;

                case 'result':
                    // 处理订阅/调用服务的响应
                    if (message.success === false) {
                        console.error('操作失败:', message.error);
                        // 检查是否有待处理的调用
                        if (this.pendingCalls && this.pendingCalls[message.id]) {
                            this.pendingCalls[message.id].reject(new Error(message.error.message));
                            delete this.pendingCalls[message.id];
                        }
                    } else {
                        // 订阅成功后,获取所有设备状态
                        if (message.result && (message.result.event_type === 'state_changed' || typeof message.result === 'boolean' && message.result)) {
                            this.fetchAllStates();
                        }
                        // 检查是否有待处理的调用
                        if (this.pendingCalls && this.pendingCalls[message.id]) {
                            this.pendingCalls[message.id].resolve(message.result);
                            delete this.pendingCalls[message.id];
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('解析消息失败:', error);
        }
    }

    /**
     * 订阅所有状态事件
     */
    subscribeEvents() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        // 订阅事件
        const subscribeMessage = {
            id: this.generateId(),
            type: 'subscribe_events',
            event_type: 'state_changed'
        };

        try {
            this.ws.send(JSON.stringify(subscribeMessage));
        } catch (error) {
            console.error('发送订阅消息失败:', error);
        }
    }

    /**
     * 获取所有设备状态
     */
    fetchAllStates() {
        if (!this.url || !this.token) {
            return;
        }

        const apiUrl = `${this.url}/api/states`;
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };

        fetch(apiUrl, { headers })
            .then(response => {
                if (!response.ok) {
                    console.error('获取状态失败:', response.status, response.statusText);
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(states => {
                // 缓存所有状态
                states.forEach(state => {
                    this.states[state.entity_id] = state.state;
                    // 通知监听器
                    this.notifyListeners('stateUpdate', {
                        entityId: state.entity_id,
                        state: state.state,
                        attributes: state.attributes
                    });
                });

                // 派发HA就绪事件,通知应用所有状态已加载
                window.dispatchEvent(new CustomEvent('ha-ready'));
            })
            .catch(error => {
                console.error('获取设备状态失败:', error);
            });
    }

    /**
     * 处理 HA 事件
     * @param {Object} event - 事件对象
     */
    handleEvent(event) {
        if (!event) {
            return;
        }

        if (event.event_type === 'state_changed') {
            const { entity_id, new_state } = event.data || {};

            if (!entity_id) {
                return;
            }

            // 更新本地状态缓存
            this.states[entity_id] = new_state ? new_state.state : null;

            // 通知监听器
            this.notifyListeners('stateUpdate', {
                entityId: entity_id,
                state: new_state ? new_state.state : null,
                attributes: new_state ? new_state.attributes : {}
            });
        }
    }

    /**
     * 尝试重连
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('达到最大重连次数');
            this.notifyListeners('error', { message: '无法连接到 HA 服务器' });
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * 调用 HA 服务
     * @param {string} domain - 设备域 (如 light, switch)
     * @param {string} service - 服务名称 (如 turn_on, turn_off)
     * @param {Object} data - 服务数据
     * @returns {Promise}
     */
    async callService(domain, service, data) {
        // 优先使用 WebSocket 调用
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return this.callServiceWebSocket(domain, service, data);
        }

        // 回退到 REST API
        return this.callServiceREST(domain, service, data);
    }

    /**
     * 通过 WebSocket 调用 HA 服务
     * @param {string} domain - 设备域
     * @param {string} service - 服务名称
     * @param {Object} data - 服务数据
     * @returns {Promise}
     */
    async callServiceWebSocket(domain, service, data) {
        const messageId = this.generateId();

        return new Promise((resolve, reject) => {
            // 临时存储回调
            this.pendingCalls = this.pendingCalls || {};
            this.pendingCalls[messageId] = { resolve, reject };

            const message = {
                id: messageId,
                type: 'call_service',
                domain: domain,
                service: service,
                service_data: data
            };

            this.ws.send(JSON.stringify(message));
        });
    }

    /**
     * 通过 REST API 调用 HA 服务
     * @param {string} domain - 设备域
     * @param {string} service - 服务名称
     * @param {Object} data - 服务数据
     * @returns {Promise}
     */
    async callServiceREST(domain, service, data) {
        return new Promise((resolve, reject) => {
            if (!this.url || !this.token) {
                reject(new Error('HA 未连接'));
                return;
            }

            const apiUrl = `${this.url}/api/services/${domain}/${service}`;
            const headers = {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };

            const body = JSON.stringify(data);

            fetch(apiUrl, {
                method: 'POST',
                headers,
                body: body
            })
            .then(response => {
                if (response.ok) {
                    resolve(response.json());
                } else {
                    response.text().then(text => console.error('服务调用失败:', text));
                    reject(new Error(`服务调用失败: ${response.status}`));
                }
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * 获取设备状态
     * @param {string} entityId - 实体 ID
     * @returns {Promise<string>}
     */
    async getDeviceState(entityId) {
        // 防御性检查：确保 entityId 有效且不是 "Error" 字符串
        if (!entityId || typeof entityId !== 'string' || entityId === 'Error' || !entityId.includes('.')) {
            console.warn(`[ha-connection] 无效的实体ID: ${entityId}`, new Error().stack);
            return 'unavailable';
        }

        return new Promise((resolve) => {
            // 从缓存中获取
            if (this.states[entityId] !== undefined) {
                resolve(this.states[entityId]);
                return;
            }

            // 从 HA API 获取
            if (!this.url || !this.token) {
                resolve('unavailable');
                return;
            }

            const apiUrl = `${this.url}/api/states/${entityId}`;
            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            fetch(apiUrl, { headers })
                .then(response => response.json())
                .then(data => {
                    const stateToReturn = data.state;
                    this.states[entityId] = stateToReturn;
                    resolve(stateToReturn);
                })
                .catch(() => {
                    resolve('unavailable');
                });
        });
    }

    /**
     * 添加事件监听器
     */
    addListener(eventType, callback) {
        this.listeners.push({ eventType, callback });
    }

    /**
     * 移除事件监听器
     */
    removeListener(eventType, callback) {
        const index = this.listeners.findIndex(l => l.eventType === eventType && l.callback === callback);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * 通知所有监听器
     */
    notifyListeners(eventType, data) {
        this.listeners.forEach(listener => {
            if (listener.eventType === eventType) {
                try {
                    listener.callback(data);
                } catch (error) {
                    console.error('监听器执行错误:', error);
                }
            }
        });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }

    /**
     * 获取连接状态
     */
    isConnected() {
        return this.connected;
    }
}

// 创建全局实例
window.haConnection = new HAConnection();

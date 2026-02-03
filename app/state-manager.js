/**
 * 设备状态管理器 - 增强版
 * 功能：批量请求、智能缓存、订阅更新、本地存储、增量更新、智能轮询
 */

const DeviceStateManager = {
    // 内存缓存
    cache: new Map(),
    
    // 订阅者列表
    subscribers: new Map(),
    
    // 请求队列
    pendingRequests: new Set(),
    batchTimer: null,
    
    // 配置
    config: {
        cacheTTL: 30000,        // 缓存有效期30秒
        batchDelay: 50,         // 批量请求延迟
        maxCacheSize: 200,      // 最大缓存条目
        storageKey: 'ha_device_states',  // localStorage键名
        enableStorage: true     // 启用本地存储
    },
    
    // 轮询相关
    pollingTimer: null,
    pollingInterval: 5000,    // 默认轮询间隔5秒
    isWebSocketConnected: false,

    /**
     * 初始化
     */
    init() {
        // 从本地存储恢复缓存
        this.loadFromStorage();
        
        // 监听HA状态更新
        window.addEventListener('device-state-update', (event) => {
            if (event.detail) {
                this.updateCache(event.detail.entityId, event.detail.state, true);
            }
        });
        
        // 监听HA就绪
        window.addEventListener('ha-ready', () => {
            this.refreshAll();
        });
        
        // 监听WebSocket状态
        window.addEventListener('ha-websocket-connected', () => {
            this.isWebSocketConnected = true;
            this.stopPolling();
        });
        
        window.addEventListener('ha-websocket-disconnected', () => {
            this.isWebSocketConnected = false;
            this.startPolling();
        });
        
        // 页面可见性变化时调整策略
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopPolling();
            } else {
                this.refreshAll();
                if (!this.isWebSocketConnected) {
                    this.startPolling();
                }
            }
        });
        
        // 定期清理过期缓存
        setInterval(() => this.cleanExpiredCache(), 60000);
    },

    /**
     * 获取状态（优先缓存）
     */
    async getState(entityId) {
        // 1. 检查内存缓存
        const cached = this.getCachedState(entityId);
        if (cached !== null) {
            return cached;
        }
        
        // 2. 检查本地存储
        if (this.config.enableStorage) {
            const stored = this.getStoredState(entityId);
            if (stored !== null) {
                this.cache.set(entityId, { state: stored, timestamp: Date.now() });
                return stored;
            }
        }
        
        // 3. 加入批量请求队列
        this.pendingRequests.add(entityId);
        this.scheduleBatchRequest();
        
        // 4. 等待请求完成
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const state = this.getCachedState(entityId);
                if (state !== null) {
                    clearInterval(checkInterval);
                    resolve(state);
                }
            }, 10);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve('unavailable');
            }, 3000);
        });
    },

    /**
     * 从内存缓存获取
     */
    getCachedState(entityId) {
        const cached = this.cache.get(entityId);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.config.cacheTTL) {
            this.cache.delete(entityId);
            return null;
        }
        
        return cached.state;
    },

    /**
     * 从本地存储获取
     */
    getStoredState(entityId) {
        try {
            const data = localStorage.getItem(this.config.storageKey);
            if (!data) return null;
            
            const states = JSON.parse(data);
            const state = states[entityId];
            
            // 检查存储时间（24小时过期）
            if (state && Date.now() - state.timestamp < 86400000) {
                return state.value;
            }
        } catch (e) {
            console.warn('[StateManager] 读取本地存储失败:', e);
        }
        return null;
    },

    /**
     * 更新缓存并通知
     */
    updateCache(entityId, state, fromWebSocket = false) {
        const oldState = this.cache.get(entityId)?.state;
        
        this.cache.set(entityId, {
            state: state,
            timestamp: Date.now(),
            fromWebSocket: fromWebSocket
        });
        
        // 只有状态变化才通知
        if (oldState !== state) {
            this.notifySubscribers(entityId, state);
            
            // 保存到本地存储
            if (this.config.enableStorage) {
                this.saveToStorage(entityId, state);
            }
        }
        
        // 限制缓存大小
        if (this.cache.size > this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    },

    /**
     * 保存到本地存储
     */
    saveToStorage(entityId, state) {
        try {
            let states = {};
            const data = localStorage.getItem(this.config.storageKey);
            if (data) {
                states = JSON.parse(data);
            }
            
            states[entityId] = {
                value: state,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.config.storageKey, JSON.stringify(states));
        } catch (e) {
            // 存储空间不足时清理旧数据
            if (e.name === 'QuotaExceededError') {
                this.clearOldStorage();
            }
        }
    },

    /**
     * 从本地存储加载
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.config.storageKey);
            if (!data) return;
            
            const states = JSON.parse(data);
            Object.entries(states).forEach(([entityId, stateData]) => {
                if (Date.now() - stateData.timestamp < 86400000) {
                    this.cache.set(entityId, {
                        state: stateData.value,
                        timestamp: stateData.timestamp
                    });
                }
            });
        } catch (e) {
            console.warn('[StateManager] 加载本地存储失败:', e);
        }
    },

    /**
     * 清理旧存储数据
     */
    clearOldStorage() {
        try {
            const data = localStorage.getItem(this.config.storageKey);
            if (!data) return;
            
            const states = JSON.parse(data);
            const now = Date.now();
            
            // 只保留12小时内的数据
            Object.keys(states).forEach(key => {
                if (now - states[key].timestamp > 43200000) {
                    delete states[key];
                }
            });
            
            localStorage.setItem(this.config.storageKey, JSON.stringify(states));
        } catch (e) {
            // 清理失败则清空
            localStorage.removeItem(this.config.storageKey);
        }
    },

    /**
     * 调度批量请求（请求去重）
     */
    scheduleBatchRequest() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }
        
        this.batchTimer = setTimeout(() => {
            this.executeBatchRequest();
        }, this.config.batchDelay);
    },

    /**
     * 执行批量请求（增量更新）
     */
    async executeBatchRequest() {
        if (this.pendingRequests.size === 0) return;
        
        const entityIds = Array.from(this.pendingRequests);
        this.pendingRequests.clear();
        
        try {
            // 增量更新：只请求需要的实体
            const states = await this.fetchStatesIncremental(entityIds);
            
            states.forEach((state, entityId) => {
                this.updateCache(entityId, state);
            });
        } catch (error) {
            console.error('[StateManager] 批量请求失败:', error);
            entityIds.forEach(id => {
                this.updateCache(id, 'unavailable');
            });
        }
    },

    /**
     * 增量获取状态（只查询需要的实体）
     */
    async fetchStatesIncremental(entityIds) {
        const results = new Map();
        
        if (!window.haConnection) {
            entityIds.forEach(id => results.set(id, 'unavailable'));
            return results;
        }
        
        try {
            const haUrl = window.haConnection.url || 'http://192.168.4.5:8123';
            const accessToken = window.haConnection.token;
            
            // 方法1：使用过滤参数（如果HA支持）
            const filterParam = entityIds.map(id => `filter_entity_id=${encodeURIComponent(id)}`).join('&');
            
            let response = await fetch(`${haUrl}/api/states?${filterParam}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // 如果过滤参数不支持，回退到获取全部
            if (!response.ok && response.status === 400) {
                response = await fetch(`${haUrl}/api/states`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const allStates = await response.json();
            
            // 只提取需要的实体
            entityIds.forEach(entityId => {
                const stateObj = allStates.find(s => s.entity_id === entityId);
                results.set(entityId, stateObj ? stateObj.state : 'unavailable');
            });
        } catch (error) {
            console.error('[StateManager] 获取状态失败:', error);
            entityIds.forEach(id => results.set(id, 'unavailable'));
        }
        
        return results;
    },

    /**
     * 订阅状态更新
     */
    subscribe(entityId, callback, options = {}) {
        const { immediate = true, priority = 'normal' } = options;
        
        if (!this.subscribers.has(entityId)) {
            this.subscribers.set(entityId, new Map());
        }
        
        const callbackId = Date.now() + Math.random();
        this.subscribers.get(entityId).set(callbackId, { callback, priority });
        
        // 立即返回缓存值
        if (immediate) {
            const cached = this.getCachedState(entityId);
            if (cached !== null) {
                callback(cached);
            } else {
                this.getState(entityId);
            }
        }
        
        // 返回取消订阅函数
        return () => {
            const subs = this.subscribers.get(entityId);
            if (subs) {
                subs.delete(callbackId);
                if (subs.size === 0) {
                    this.subscribers.delete(entityId);
                }
            }
        };
    },

    /**
     * 通知订阅者（按优先级）
     */
    notifySubscribers(entityId, state) {
        const subs = this.subscribers.get(entityId);
        if (!subs) return;
        
        // 按优先级排序：high > normal > low
        const sortedSubs = Array.from(subs.values()).sort((a, b) => {
            const priorityMap = { high: 3, normal: 2, low: 1 };
            return priorityMap[b.priority] - priorityMap[a.priority];
        });
        
        sortedSubs.forEach(({ callback }) => {
            try {
                callback(state);
            } catch (error) {
                console.error('[StateManager] 订阅者回调错误:', error);
            }
        });
    },

    /**
     * 启动智能轮询
     */
    startPolling() {
        if (this.pollingTimer || this.isWebSocketConnected) return;
        
        // 根据订阅数量动态调整轮询间隔
        const subscriberCount = this.subscribers.size;
        const interval = subscriberCount > 20 ? 10000 : 
                        subscriberCount > 10 ? 7000 : 5000;
        
        this.pollingTimer = setInterval(() => {
            this.refreshAll();
        }, interval);
        
        console.log(`[StateManager] 启动轮询，间隔 ${interval}ms`);
    },

    /**
     * 停止轮询
     */
    stopPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
            console.log('[StateManager] 停止轮询');
        }
    },

    /**
     * 刷新所有状态
     */
    async refreshAll() {
        const entityIds = Array.from(this.subscribers.keys());
        if (entityIds.length === 0) return;
        
        // 智能刷新：只刷新即将过期的缓存
        const staleIds = entityIds.filter(id => {
            const cached = this.cache.get(id);
            return !cached || Date.now() - cached.timestamp > this.config.cacheTTL * 0.8;
        });
        
        if (staleIds.length === 0) return;
        
        const states = await this.fetchStatesIncremental(staleIds);
        states.forEach((state, entityId) => {
            this.updateCache(entityId, state);
        });
    },

    /**
     * 清理过期缓存
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [entityId, data] of this.cache.entries()) {
            if (now - data.timestamp > this.config.cacheTTL) {
                this.cache.delete(entityId);
            }
        }
    },

    /**
     * 清除所有缓存
     */
    clearCache() {
        this.cache.clear();
        if (this.config.enableStorage) {
            localStorage.removeItem(this.config.storageKey);
        }
    },

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            subscriberCount: this.subscribers.size,
            pendingRequests: this.pendingRequests.size,
            isWebSocketConnected: this.isWebSocketConnected,
            isPolling: this.pollingTimer !== null
        };
    }
};

// 导出到全局
window.DeviceStateManager = DeviceStateManager;

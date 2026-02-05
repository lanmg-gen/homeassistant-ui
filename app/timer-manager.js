/**
 * 全局定时器管理器
 * 用于统一管理多个计时器组件，避免创建多个setInterval导致的性能问题
 */

const TimerManager = {
    // 存储所有注册的计时器回调
    timers: new Set(),
    
    // 全局定时器ID
    intervalId: null,
    
    // 定时器间隔（毫秒）
    interval: 1000,

    /**
     * 启动全局定时器
     */
    start() {
        if (this.intervalId) {
            return; // 已经启动
        }

        this.intervalId = setInterval(() => {
            this.timers.forEach(timer => {
                try {
                    timer();
                } catch (error) {
                    console.error('[TimerManager] 计时器回调执行错误:', error);
                }
            });
        }, this.interval);

        console.log('[TimerManager] 全局定时器已启动');
    },

    /**
     * 停止全局定时器
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('[TimerManager] 全局定时器已停止');
        }
    },

    /**
     * 注册计时器回调
     * @param {Function} callback - 每秒执行的回调函数
     * @returns {Function} - 返回取消注册的函数
     */
    register(callback) {
        if (typeof callback !== 'function') {
            console.error('[TimerManager] 注册失败：回调必须是函数');
            return () => {};
        }

        this.timers.add(callback);

        // 如果这是第一个计时器，启动全局定时器
        if (this.timers.size === 1) {
            this.start();
        }

        console.log(`[TimerManager] 注册计时器，当前数量: ${this.timers.size}`);

        // 返回取消注册的函数
        return () => this.unregister(callback);
    },

    /**
     * 取消注册计时器回调
     * @param {Function} callback - 要取消的回调函数
     */
    unregister(callback) {
        this.timers.delete(callback);

        console.log(`[TimerManager] 取消注册计时器，当前数量: ${this.timers.size}`);

        // 如果没有计时器了，停止全局定时器
        if (this.timers.size === 0) {
            this.stop();
        }
    },

    /**
     * 获取当前注册的计时器数量
     * @returns {number}
     */
    getTimerCount() {
        return this.timers.size;
    }
};

// 导出到全局
window.TimerManager = TimerManager;

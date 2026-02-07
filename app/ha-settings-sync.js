/**
 * HA 设置同步模块
 * 用于将设置同步到 Home Assistant 的 input_text 实体，实现跨设备同步
 */

const HASettingsSync = {
    // HA 实体 ID（从配置中获取）
    get ENTITY_ID() {
        return window.getHASettingsEntityId?.() || 'input_text.webui_settings';
    },

    // 自动同步延迟（毫秒）
    SYNC_DELAY: 1000,

    // 同步定时器
    syncTimer: null,

    // 当前缓存的设置
    cachedSettings: {},

    // 是否正在应用外部设置（防止循环同步）
    applyingExternalSettings: false,

    // 主题 ID 映射（主题名称 -> 数字ID）
    themeIdMap: {
        'default': 0,
        'aurora-borealis': 1,
        'blue-gradient-waves': 2,
        'particle-network': 3,
        'starfield': 4
    },

    // 数字 ID -> 主题名称 反向映射
    themeIdReverseMap: {
        0: 'default',
        1: 'aurora-borealis',
        2: 'blue-gradient-waves',
        3: 'particle-network',
        4: 'starfield'
    },

    // 天气城市ID映射（常见城市名 -> 数字ID）
    weatherCityMap: {
        '北京': 1,
        '上海': 2,
        '广州': 3,
        '深圳': 4,
        '达拉特旗': 5,
        '包头': 6,
        '呼和浩特': 7
    },

    // 数字ID -> 天气城市名 反向映射
    weatherCityReverseMap: {
        1: '北京',
        2: '上海',
        3: '广州',
        4: '深圳',
        5: '达拉特旗',
        6: '包头',
        7: '呼和浩特'
    },

    // 连接状态
    connectionStatus: {
        isConnected: false,
        lastCheck: null,
        error: null
    },

    /**
     * 初始化设置同步
     * 在应用启动时调用，自动从 HA 加载设置
     */
    async initialize() {
        console.log('[HA 设置同步] 初始化...');

        // 从 HA 加载设置
        const settings = await this.loadFromHA();

        if (settings) {
            // 应用加载的设置
            this.applySettings(settings);
            this.cachedSettings = settings;
            console.log('[HA 设置同步] 已应用 HA 设置:', settings);
        } else {
            // 如果 HA 没有设置，从 localStorage 加载
            this.loadFromLocalStorage();
        }

        // 监听 HA 状态变化，自动同步外部修改
        this.startWatching();
    },

    /**
     * 开始监听 HA 状态变化
     */
    startWatching() {
        if (!window.haConnection) {
            console.warn('[HA 设置同步] HA 连接不可用，无法监听状态变化');
            return;
        }

        // 先移除旧的监听器（避免重复添加）
        window.haConnection.removeListener('stateUpdate', this.handleRemoteSettingsUpdate.bind(this));

        // 添加状态更新监听器
        window.haConnection.addListener('stateUpdate', (data) => {
            if (data.entityId === this.ENTITY_ID) {
                console.log('[HA 设置同步] 检测到实体状态更新:', this.ENTITY_ID, data.state);
                this.handleRemoteSettingsUpdate(data);
            }
        });

        console.log('[HA 设置同步] 已开始监听实体状态变化:', this.ENTITY_ID);
    },

    /**
     * 处理远程设置更新
     * @param {object} data - 状态更新数据
     */
    async handleRemoteSettingsUpdate(data) {
        // 如果正在应用外部设置，跳过（防止循环同步）
        if (this.applyingExternalSettings) {
            return;
        }

        try {
            // 解析新设置
            const newSettings = JSON.parse(data.state || '{}');

            // 检查设置是否有变化
            const oldSettings = this.cachedSettings;
            const settingsJson = JSON.stringify(oldSettings);
            const newSettingsJson = JSON.stringify(newSettings);

            if (settingsJson === newSettingsJson) {
                return; // 设置没有变化，跳过
            }

            console.log('[HA 设置同步] 检测到远程设置变化:', {
                旧设置: oldSettings,
                新设置: newSettings
            });

            // 标记为正在应用外部设置
            this.applyingExternalSettings = true;

            // 应用新设置
            this.applySettings(newSettings);
            this.cachedSettings = newSettings;

            // 显示提示
            this.showToast('设置已从其他设备同步', 'success');

            // 标记应用完成
            setTimeout(() => {
                this.applyingExternalSettings = false;
            }, 1000);

        } catch (error) {
            console.error('[HA 设置同步] 处理远程更新失败:', error);
            this.applyingExternalSettings = false;
        }
    },

    /**
     * 应用设置到应用
     * @param {object} settings - 设置对象
     */
    applySettings(settings) {
        try {
            // 应用主题（将数字ID转换为主题名称）
            if (settings.th !== undefined && window.setBackgroundTheme) {
                const themeId = this.themeIdReverseMap[settings.th] ?? 'default';
                window.setBackgroundTheme(themeId);
                window.loadBackgroundTheme();
                localStorage.setItem('selectedTheme', themeId);
            }

            // 应用页眉标题
            if (settings.t !== undefined && window.setHeaderbarTitle) {
                window.setHeaderbarTitle(settings.t);
                // 更新页眉标题显示
                const titleCells = document.querySelectorAll('.headerbar-title-cell');
                if (titleCells && titleCells.length > 0) {
                    titleCells.forEach(cell => {
                        cell.textContent = settings.t;
                    });
                }
            }

            // 应用天气城市（将数字ID转换为城市名）
            if (settings.c !== undefined && window.setWeatherConfig) {
                const cityName = this.weatherCityReverseMap[settings.c];
                if (cityName) {
                    window.setWeatherConfig({ city: cityName });
                    // 重新加载页眉配置
                    if (window.MobileHeaderbar) {
                        window.MobileHeaderbar.loadConfig();
                        window.MobileHeaderbar.fetchWeather();
                    }
                }
            }
        } catch (error) {
            console.error('[HA 设置同步] 应用设置失败:', error);
        }
    },

    /**
     * 从 localStorage 加载设置
     */
    loadFromLocalStorage() {
        try {
            // 加载主题
            const savedTheme = localStorage.getItem('selectedTheme');
            if (savedTheme) {
                this.cachedSettings.th = this.themeIdMap[savedTheme] ?? 0;
                if (window.setBackgroundTheme) {
                    window.setBackgroundTheme(savedTheme);
                    window.loadBackgroundTheme();
                }
            }

            // 加载页眉标题
            const savedTitle = localStorage.getItem('headerbarTitle');
            if (savedTitle && window.setHeaderbarTitle) {
                this.cachedSettings.t = savedTitle;
                window.setHeaderbarTitle(savedTitle);
            }

            // 加载天气城市
            const savedCity = localStorage.getItem('weatherCity');
            if (savedCity && window.setWeatherConfig) {
                const cityId = this.weatherCityMap[savedCity];
                if (cityId !== undefined) {
                    this.cachedSettings.c = cityId;
                    window.setWeatherConfig({ city: savedCity });
                }
            }
        } catch (error) {
            console.error('[HA 设置同步] 从 localStorage 加载设置失败:', error);
        }
    },

    /**
     * 收集当前设置
     * @returns {object} 当前设置对象
     */
    collectCurrentSettings() {
        const settings = {};

        // 收集主题（使用数字ID）
        if (window.getCurrentBackgroundTheme) {
            const theme = window.getCurrentBackgroundTheme();
            if (theme && theme.id) {
                settings.th = this.themeIdMap[theme.id] ?? 0;
            }
        }

        // 收集页眉标题
        if (window.getHeaderbarTitle) {
            const title = window.getHeaderbarTitle();
            if (title && title !== '智能家庭控制中心') { // 不同步默认标题
                settings.t = title;
            }
        }

        // 收集天气城市（使用数字ID）
        if (window.getWeatherConfig) {
            const weatherConfig = window.getWeatherConfig();
            if (weatherConfig && weatherConfig.city) {
                const cityId = this.weatherCityMap[weatherConfig.city];
                if (cityId !== undefined) {
                    settings.c = cityId;
                }
            }
        }

        return settings;
    },

    /**
     * 同步设置到 HA（带自动合并）
     * @param {object} newSettings - 新的设置对象（可选）
     */
    async syncToHA(newSettings = null) {
        try {
            const haConfig = window.getHAConfig?.();
            if (!haConfig || !haConfig.url || !haConfig.token) {
                console.warn('[HA 设置同步] 未配置 HA 连接，跳过同步');
                throw new Error('未配置 HA 连接，请在网络设置中配置服务器地址和访问令牌');
            }

            // 收集当前设置，合并新设置
            const settings = {
                ...this.cachedSettings,
                ...this.collectCurrentSettings(),
                ...newSettings
            };

            // 不添加时间戳，节省空间
            // settings.timestamp = new Date().toISOString();

            // 转换为 JSON 字符串（压缩格式）
            let finalValue = JSON.stringify(settings);

            // 检查字符限制（默认 255）
            if (finalValue.length > 255) {
                console.warn('[HA 设置同步] 数据超过 255 字符限制，当前长度:', finalValue.length);
                throw new Error(`设置数据过大 (${finalValue.length} 字符)，请减少保存的设置项`);
            }

            console.log('[HA 设置同步] 准备发送数据:', finalValue);
            console.log('[HA 设置同步] 数据长度:', finalValue.length);

            // 标记为正在同步（避免监听器误触发）
            this.applyingExternalSettings = true;

            // 使用 POST 直接更新实体状态
            const stateUrl = `${haConfig.url}/api/states/${this.ENTITY_ID}`;
            const headers = {
                'Authorization': `Bearer ${haConfig.token}`,
                'Content-Type': 'application/json'
            };

            const stateBody = {
                state: finalValue
            };

            console.log('[HA 设置同步] 请求URL:', stateUrl);
            console.log('[HA 设置同步] 请求体:', JSON.stringify(stateBody));

            const response = await fetch(stateUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(stateBody)
            });

            console.log('[HA 设置同步] API 响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`同步失败: HTTP ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('[HA 设置同步] 成功:', result);

            // 等待一下，让 HA 更新状态
            await new Promise(resolve => setTimeout(resolve, 500));

            // 验证是否真的更新了
            const currentState = await this.loadFromHA();
            console.log('[HA 设置同步] 验证 - HA 中的当前值:', currentState);

            // 更新缓存
            this.cachedSettings = settings;

            // 标记同步完成
            setTimeout(() => {
                this.applyingExternalSettings = false;
            }, 1000);

            console.log('[HA 设置同步] 成功:', settings);
            
            // 显示同步成功提示
            this.showToast('设置已同步到 Home Assistant', 'success');
            
            return { success: true, data: settings };

        } catch (error) {
            console.error('[HA 设置同步] 失败:', error);
            this.applyingExternalSettings = false;
            
            // 显示同步失败提示
            this.showToast(`同步失败: ${error.message}`, 'fail');
            
            throw error;
        }
    },

    /**
     * 自动同步设置（带防抖）
     * @param {object} newSettings - 新的设置对象（可选）
     */
    autoSync(newSettings = null) {
        // 清除之前的定时器
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }

        // 设置新的定时器
        this.syncTimer = setTimeout(async () => {
            try {
                await this.syncToHA(newSettings);
            } catch (error) {
                console.error('[HA 设置同步] 自动同步失败:', error);
            }
        }, this.SYNC_DELAY);
    },

    /**
     * 从 HA 加载设置
     * @returns {Promise<object|null>} 设置对象，失败返回 null
     */
    async loadFromHA() {
        try {
            const haConfig = window.getHAConfig?.();
            if (!haConfig || !haConfig.url || !haConfig.token) {
                console.warn('[HA 设置加载] 未配置 HA 连接，跳过加载');
                return null;
            }

            console.log('[HA 设置加载] 正在获取实体:', this.ENTITY_ID);

            // 获取 input_text 状态
            const response = await fetch(`${haConfig.url}/api/states/${this.ENTITY_ID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${haConfig.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('[HA 设置加载] 响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[HA 设置加载] 错误响应:', errorText);
                if (errorText.includes('not found') || errorText.includes('Unknown entity')) {
                    console.warn('[HA 设置加载] 实体不存在，请先在 HA 中配置:', this.ENTITY_ID);
                    return null;
                }
                throw new Error(`加载失败: HTTP ${response.status}`);
            }

            const state = await response.json();
            console.log('[HA 设置加载] 完整实体状态:', state);
            console.log('[HA 设置加载] 实体的 state 属性:', state.state);

            const settings = JSON.parse(state.state || '{}');

            console.log('[HA 设置加载] 解析后的设置:', settings);
            return settings;

        } catch (error) {
            console.error('[HA 设置加载] 失败:', error);
            return null;
        }
    },

    /**
     * 检查设置数据大小
     * @param {object} settings - 设置对象
     * @returns {object} { size: number, exceeded: boolean }
     */
    checkSize(settings) {
        const jsonSize = JSON.stringify(settings).length;
        return {
            size: jsonSize,
            exceeded: jsonSize > 255,
            remaining: 255 - jsonSize
        };
    },

    /**
     * 显示同步状态提示
     * @param {string} message - 提示消息
     * @param {string} type - 类型: success | fail | loading
     */
    showToast(message, type = 'success') {
        if (window.vant && window.vant.Toast) {
            switch (type) {
                case 'loading':
                    window.vant.Toast.loading(message);
                    break;
                case 'fail':
                    window.vant.Toast.fail(message);
                    break;
                default:
                    window.vant.Toast.success(message);
            }
        }
    },

    /**
     * 清除本地存储的设置缓存
     */
    clearCache() {
        console.log('[HA 设置同步] 开始清除本地缓存...');
        
        // 要清除的键列表
        const keysToClear = [
            'ha_general_settings',
            'ha_network_settings', 
            'ha_scene_settings',
            'ha_shortcut_settings'
        ];
        
        let clearedCount = 0;
        keysToClear.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`[HA 设置同步] 已清除缓存: ${key}`);
                clearedCount++;
            }
        });
        
        // 也清除可能的备份键
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('ha_') || key.includes('settings') || key.includes('backup'))) {
                localStorage.removeItem(key);
                console.log(`[HA 设置同步] 已清除相关缓存: ${key}`);
                clearedCount++;
            }
        }
        
        console.log(`[HA 设置同步] 缓存清除完成，共清除 ${clearedCount} 项`);
        
        // 显示清除成功提示
        this.showToast(`缓存清除成功，已清理 ${clearedCount} 项数据`, 'success');
        
        // 触发页面刷新以应用更改
        setTimeout(() => {
            if (confirm('缓存已清除，是否立即刷新页面以应用更改？')) {
                window.location.reload();
            }
        }, 1000);
    },
    
    /**
     * 测试 HA 连接状态
     * @returns {Promise<object>} 连接测试结果
     */
    async testConnection() {
        const config = window.getHAConfig?.();
        
        if (!config) {
            this.connectionStatus = {
                isConnected: false,
                lastCheck: new Date(),
                error: 'HA 配置未找到'
            };
            return this.connectionStatus;
        }

        if (!config.enabled) {
            this.connectionStatus = {
                isConnected: false,
                lastCheck: new Date(),
                error: 'HA 同步已禁用'
            };
            return this.connectionStatus;
        }

        if (!config.url || !config.token) {
            this.connectionStatus = {
                isConnected: false,
                lastCheck: new Date(),
                error: 'HA URL 或 Token 未配置'
            };
            return this.connectionStatus;
        }

        try {
            // 构建测试 URL
            const testUrl = `${config.url}/api/states/${this.ENTITY_ID}`;
            
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: config.connectionTimeout || 10000
            });

            if (response.ok) {
                this.connectionStatus = {
                    isConnected: true,
                    lastCheck: new Date(),
                    error: null
                };
            } else {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}`;
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                
                this.connectionStatus = {
                    isConnected: false,
                    lastCheck: new Date(),
                    error: `连接失败: ${errorMessage}`
                };
            }
        } catch (error) {
            let errorMessage = '网络连接失败';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = '无法连接到 HA 服务器（可能是网络问题或 URL 错误）';
            } else if (error.name === 'AbortError') {
                errorMessage = '连接超时';
            } else {
                errorMessage = error.message;
            }
            
            this.connectionStatus = {
                isConnected: false,
                lastCheck: new Date(),
                error: errorMessage
            };
        }
        
        return this.connectionStatus;
    },

    /**
     * 获取连接状态文本
     * @returns {string} 状态文本
     */
    getConnectionStatusText() {
        if (!this.connectionStatus.lastCheck) {
            return '未检测';
        }
        
        if (this.connectionStatus.isConnected) {
            return `已连接 (${this.formatTime(this.connectionStatus.lastCheck)})`;
        } else {
            return `连接失败 (${this.formatTime(this.connectionStatus.lastCheck)})`;
        }
    },

    /**
     * 获取连接状态类型（用于 UI 样式）
     * @returns {string} 状态类型：'success', 'error', 'warning', 'info'
     */
    getConnectionStatusType() {
        if (!this.connectionStatus.lastCheck) {
            return 'info';
        }
        
        return this.connectionStatus.isConnected ? 'success' : 'error';
    },

    /**
     * 格式化时间显示
     * @param {Date} date 
     * @returns {string}
     */
    formatTime(date) {
        if (!date) return '';
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    },

    /**
     * 获取详细错误信息
     * @returns {string|null} 错误信息
     */
    getConnectionError() {
        return this.connectionStatus.error;
    }
};

// 导出到全局

// 导出到全局
window.HASettingsSync = HASettingsSync;


/**
 * 设置 - 移动端逻辑
 */

// 避免重复声明
if (!window.SettingsPage) {
    window.SettingsPage = {
        vueApp: null,

        // 初始化
        init() {
            // 不再自动调用 createVueApp，由 PageManager.loadPage 统一调用
        },

        // 创建 Vue 应用
        createVueApp() {
            // 如果已经存在 Vue 应用,先卸载
            if (this.vueApp) {
                this.vueApp.unmount();
                this.vueApp = null;
            }

            const container = document.getElementById('deviceCardsContainer');
            if (!container) {
                return;
            }

            // 创建一个新的 Vue 应用实例专门用于 settings 页面
            const settingsApp = Vue.createApp({
                data() {
                    return {
                        // 设置卡片数据
                        settingsCards: [
                            { name: '通用设置', icon: '⚙️', description: '语言、主题等', type: 'general' },
                            { name: '通知设置', icon: '🔔', description: '推送通知管理', type: 'notification' },
                            { name: '隐私安全', icon: '🔒', description: '权限和隐私设置', type: 'privacy' },
                            { name: '网络设置', icon: '🌐', description: '连接和服务器配置', type: 'network' },
                            { name: '配置管理', icon: '⚙️', description: '管理系统配置项', type: 'backendTest' },
                            { name: 'HA 设置同步', icon: '☁️', description: '同步设置到 HA', type: 'haSettingsSync' },
                            { name: '关于', icon: 'ℹ️', description: '版本信息和帮助', type: 'about' }
                        ],
                        // 弹出卡片状态
                        showPopup: false,
                        popupTitle: '',
                        popupDescription: '',
                        popupIcon: '',
                        currentPopupType: '',
                        // 主题选择
                        selectedTheme: 'default',
                        // 主题下拉框状态
                        showThemeDropdown: false,
                        // 字符使用情况
                        charUsage: {
                            used: 0,
                            remaining: 255,
                            percentage: 0
                        },
                        // 页眉标题
                        headerTitle: '',
                        // 天气城市选择
                        selectedWeatherCity: '',
                        // 天气城市下拉框状态
                        showCityDropdown: false,
                        // HA 连接状态（实时）
                        haConnectionStatus: null,
                        // 配置管理相关
                        configManager: {
                            showList: true, // 显示列表视图
                            editing: false, // 编辑模式
                            editingKey: '', // 当前编辑的键名
                            key: '', // 输入的键名
                            value: '', // 输入的值
                            configs: [], // 配置列表
                            searchQuery: '' // 搜索查询
                        },
                        // 导航栏配置
                        navbarItems: [],
                        // 日志开关
                        logEnabled: false
                    };
                },
                computed: {
                    // 可用主题列表
                    themeOptions() {
                        if (window.getBackgroundThemes) {
                            return window.getBackgroundThemes().available;
                        }
                        return [];
                    },
                    // 当前主题对象
                    currentTheme() {
                        if (window.getCurrentBackgroundTheme) {
                            return window.getCurrentBackgroundTheme();
                        }
                        return { id: 'default', name: '默认渐变' };
                    },
                    // 天气城市选项
                    weatherCityOptions() {
                        return [
                            { id: '达拉特旗', name: '达拉特旗' },
                            { id: '北京', name: '北京' },
                            { id: '上海', name: '上海' },
                            { id: '广州', name: '广州' },
                            { id: '深圳', name: '深圳' },
                            { id: '包头', name: '包头' },
                            { id: '呼和浩特', name: '呼和浩特' }
                        ];
                    },
                    // 配置管理 - 过滤后的配置列表
                    filteredConfigs() {
                        if (!this.configManager) {
                            return [];
                        }
                        const query = (this.configManager.searchQuery || '').toLowerCase();
                        return (this.configManager.configs || []).filter(config =>
                            config.key.toLowerCase().includes(query)
                        );
                    }
                },
                mounted() {
                    // 初始化选中主题为当前主题
                    this.selectedTheme = this.currentTheme.id;

                    // 初始化页眉标题
                    this.headerTitle = window.getHeaderbarTitle?.() || '智能家庭控制中心';

                    // 初始化天气城市
                    const weatherConfig = window.getWeatherConfig?.();
                    this.selectedWeatherCity = weatherConfig?.city || '达拉特旗';

                    // 初始化导航栏配置
                    this.navbarItems = window.getBottomNavConfig?.() || [];

                    // 初始化日志开关状态
                    this.logEnabled = localStorage.getItem('logEnabled') === 'true';

                    // 添加外部点击监听
                    document.addEventListener('click', this.handleClickOutside);

                    // 更新字符使用情况
                    this.updateCharUsage();
                },
                beforeUnmount() {
                    // 移除外部点击监听
                    document.removeEventListener('click', this.handleClickOutside);
                },
                methods: {
                    // 处理设置卡片点击
                    handleSettingsClick(card) {
                        this.popupTitle = card.name;
                        this.popupIcon = card.icon;
                        this.popupDescription = card.description;
                        this.currentPopupType = card.type;
                        this.showPopup = true;

                        // 根据类型初始化数据
                        if (card.type === 'general') {
                            this.selectedTheme = this.currentTheme.id;
                        } else if (card.type === 'haSettingsSync') {
                            // 更新字符使用情况
                            this.updateCharUsage();
                        } else if (card.type === 'backendTest') {
                            // 加载配置列表
                            this.loadConfigList();
                        }
                    },

                    // 关闭弹出卡片
                    closePopup() {
                        this.showPopup = false;
                        this.currentPopupType = '';
                    },
                    
                    // HA 设置同步弹窗确定按钮点击处理
                    onHaSettingsSyncConfirm() {
                        // 给用户一个提示，表示已了解 HA 设置同步功能
                        if (window.vant && window.vant.Toast) {
                            window.vant.Toast.success('HA 设置同步功能已就绪');
                        }
                        this.closePopup();
                    },

                    // 处理弹出卡片按钮点击
                    handlePopupAction(action) {
                        if (action === 'cancel') {
                            // 取消操作，直接关闭
                            this.closePopup();
                            return;
                        }
                        
                        // 应用主题设置
                        if (action === 'apply') {
                            this.applyTheme(this.selectedTheme);
                        }
                        
                        this.closePopup();
                    },
                    
                    // 应用主题（仅更新状态，不自动同步）
                    applyTheme(themeId) {
                        this.selectedTheme = themeId;
                        if (window.setBackgroundTheme) {
                            window.setBackgroundTheme(themeId);
                            // 立即加载并应用背景主题
                            if (window.loadBackgroundTheme) {
                                window.loadBackgroundTheme();
                            }
                            // 保存主题设置
                            localStorage.setItem('selectedTheme', themeId);
                        }
                    },
                    
                    // 获取当前主题名称
                    getCurrentThemeName() {
                        const theme = this.themeOptions.find(t => t.id === this.selectedTheme);
                        return theme ? theme.name : '默认渐变';
                    },
                    
                    // 选择主题（仅更新选中状态）
                    selectTheme(themeId) {
                        this.selectedTheme = themeId;
                        this.showThemeDropdown = false;
                    },
                    
                    // 检查下拉框是否需要向上展开
                    checkDropdownPosition(element) {
                        if (!element) return false;
                        const rect = element.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const spaceBelow = viewportHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        const dropdownHeight = 200; // 预估下拉框高度
                        
                        return spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
                    },
                    
                    // 获取下拉框样式
                    getDropdownStyle(element) {
                        if (!this.checkDropdownPosition(element)) {
                            return {};
                        }
                        
                        return {
                            top: 'auto',
                            bottom: '100%',
                            marginTop: '0',
                            marginBottom: '8px'
                        };
                    },
                    
                    // 处理下拉框外部点击
                    handleClickOutside(event) {
                        if (this.showThemeDropdown && !event.target.closest('.custom-theme-selector')) {
                            this.showThemeDropdown = false;
                        }
                        if (this.showCityDropdown && !event.target.closest('.custom-theme-selector')) {
                            this.showCityDropdown = false;
                        }
                    },
                    
                    // 切换主题下拉框
                    toggleThemeDropdown() {
                        this.showThemeDropdown = !this.showThemeDropdown;
                    },

                    // 切换天气城市下拉框
                    toggleCityDropdown() {
                        this.showCityDropdown = !this.showCityDropdown;
                    },

                    // 应用页眉标题（仅更新状态，不自动同步）
                    applyHeaderTitle() {
                        if (window.setHeaderbarTitle && this.headerTitle.trim()) {
                            window.setHeaderbarTitle(this.headerTitle.trim());
                            localStorage.setItem('headerbarTitle', this.headerTitle.trim());

                            // 更新页眉显示
                            const titleCells = document.querySelectorAll('.headerbar-title-cell');
                            if (titleCells && titleCells.length > 0) {
                                titleCells.forEach(cell => {
                                    cell.textContent = this.headerTitle.trim();
                                });
                            }
                        }
                    },

                    // 选择天气城市（仅更新选中状态）
                    selectWeatherCity(cityId) {
                        this.selectedWeatherCity = cityId;
                        this.showCityDropdown = false;
                    },

                    // 获取HA配置信息
                    getHAConfigInfo() {
                        if (window.getHAConfig) {
                            const config = window.getHAConfig();
                            return {
                                url: config.url,
                                token: config.token ? '***' + config.token.slice(-8) : '未设置',
                                enabled: config.enabled ? '已启用' : '已禁用',
                                connectionTimeout: config.connectionTimeout,
                                reconnectInterval: config.reconnectInterval
                            };
                        }
                        return null;
                    },
                    
                    // 获取HA实时连接状态信息
                    getHARealTimeStatus() {
                        return this.haConnectionStatus;
                    },
                    
                    // 测试HA连接
                    async testHAConnection() {
                        if (window.HASettingsSync) {
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.loading('正在测试 HA 连接...');
                            }
                            
                            try {
                                const result = await window.HASettingsSync.testConnection();
                                
                                // 直接更新页面状态
                                this.haConnectionStatus = result;

                                if (result.isConnected) {
                                    if (window.vant && window.vant.Toast) {
                                        window.vant.Toast.success('HA 连接测试成功');
                                    }
                                } else {
                                    if (window.vant && window.vant.Toast) {
                                        window.vant.Toast.fail(`连接失败: ${result.error}`);
                                    }
                                }
                            } catch (error) {
                                if (window.vant && window.vant.Toast) {
                                    window.vant.Toast.fail(`测试出错: ${error.message}`);
                                }
                            }
                        } else {
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.fail('HA 设置同步模块未加载');
                            }
                        }
                    },
                    
                    // 显示用户协议
                    showTerms() {
                        if (window.showToast) {
                            window.showToast('用户协议页面正在开发中');
                        }
                        // 这里可以跳转到用户协议页面
                    },
                    
                    // 显示隐私政策
                    showPrivacy() {
                        if (window.showToast) {
                            window.showToast('隐私政策页面正在开发中');
                        }
                        // 这里可以跳转到隐私政策页面
                    },

                    // 同步设置到 HA
                    async syncSettingsToHA() {
                        try {
                            window.HASettingsSync?.showToast('正在同步设置到 HA...', 'loading');
                            await window.HASettingsSync?.syncToHA();
                            window.HASettingsSync?.showToast('设置已同步到 HA');
                        } catch (error) {
                            window.HASettingsSync?.showToast(`同步失败: ${error.message}`, 'fail');
                        }
                    },

                    // 从 HA 加载设置
                    async loadSettingsFromHA() {
                        try {
            window.HASettingsSync?.showToast('正在从 HA 加载设置...', 'loading');

            const settings = await window.HASettingsSync?.loadFromHA();
            if (!settings) {
                throw new Error('未找到保存的设置');
            }

            // 应用加载的设置
            window.HASettingsSync?.applySettings(settings);

            // 更新本地状态
            if (settings.th) {
                this.selectedTheme = settings.th;
            }

            // 更新字符使用情况
            this.updateCharUsage();

            window.HASettingsSync?.showToast('设置已从 HA 加载');
        } catch (error) {
            window.HASettingsSync?.showToast(`加载失败: ${error.message}`, 'fail');
        }
    },

    // 更新字符使用情况
    updateCharUsage() {
        if (window.HASettingsSync) {
            const settings = window.HASettingsSync.collectCurrentSettings();
            const sizeInfo = window.HASettingsSync.checkSize(settings);
            this.charUsage = {
                used: sizeInfo.size,
                remaining: Math.max(0, sizeInfo.remaining),
                percentage: Math.min(100, Math.round((sizeInfo.size / 255) * 100))
            };
        }
    },

                    // 拖拽开始
                    onDragStart(event, index) {
                        event.dataTransfer.setData('text/plain', index);
                    },

                    // 拖拽经过
                    onDragOver(event) {
                        event.preventDefault();
                    },

                    // 拖拽放置
                    onDrop(event, index) {
                        event.preventDefault();
                        const draggedIndex = parseInt(event.dataTransfer.getData('text/plain'));
                        if (draggedIndex !== index) {
                            const [draggedItem] = this.navbarItems.splice(draggedIndex, 1);
                            this.navbarItems.splice(index, 0, draggedItem);
                        }
                    },

                    // 添加导航栏按钮
                    addNavbarItem() {
                        this.navbarItems.push({ id: '', name: '', icon: '' });
                    },

                    // 删除导航栏按钮
                    removeNavbarItem(index) {
                        if (this.navbarItems.length > 1) {
                            this.navbarItems.splice(index, 1);
                        } else {
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.fail('至少需要保留一个导航按钮');
                            }
                        }
                    },

                    // 导出HA配置
                    exportHAConfig() {
                        // 创建完整的配置对象，包括所有必要的信息
                        const config = {
                            homeAssistant: window.getHAConfig?.() || {
                                url: 'http://192.168.4.5:8123',
                                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhYTZlOTM3MWFjZDg0NTlkYTJkM2ZlMWQ5MDg1N2IwMCIsImlhdCI6MTc2ODcwODc1MiwiZXhwIjoyMDg0MDY4NzUyfQ.o911fMvo6C4DoIG3vwbRH_7IiL55SWigB3RgDX-ZPgE',
                                enabled: true,
                                connectionTimeout: 5000,
                                reconnectInterval: 3000,
                                settingsEntityId: 'input_text.webui_settings',
                                appDaemonUrl: 'http://192.168.4.5:5050'
                            },
                            headerbar: {
                                title: window.getHeaderbarTitle?.() || '智能家庭控制中心',
                                showTitle: true,
                                height: 112,
                                weather: window.getWeatherConfig?.() || {
                                    enabled: true,
                                    position: {
                                        gridStart: 4,
                                        span: 3
                                    },
                                    city: '达拉特旗',
                                    iconSize: 28,
                                    tempSize: 22,
                                    citySize: 12,
                                    gap: 8,
                                    alignRight: true
                                }
                            },
                            bottomNav: {
                                items: this.navbarItems
                            },
                            debug: {
                                showGrid: true,
                                gridColor: 'rgba(255, 0, 0, 0.2)',
                                mobileGridSize: 20,
                                desktopGridSize: 24
                            },
                            pages: {
                                available: ['home', 'scenes', 'settings'],
                                paths: {
                                    mobile: {
                                        home: 'pages/mobile/home.html',
                                        scenes: 'pages/mobile/scenes.html',
                                        settings: 'pages/mobile/settings.html',
                                        headerbar: 'pages/mobile/headerbar/headerbar.html'
                                    },
                                    desktop: {
                                        home: 'pages/desktop/home.html',
                                        scenes: 'pages/desktop/scenes.html',
                                        settings: 'pages/desktop/settings.html'
                                    }
                                }
                            },
                            theme: {
                                backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                cardBackgroundOpacity: 0.15,
                                textColor: '#ffffff',
                                textSecondaryColor: 'rgba(255, 255, 255, 0.7)'
                            },
                            backgroundThemes: window.getBackgroundThemes?.() || {
                                available: [
                                    { id: 'default', name: '默认渐变', file: null },
                                    { id: 'aurora-borealis', name: '极光效果', file: 'aurora-borealis.html' },
                                    { id: 'blue-gradient-waves', name: '蓝色波浪', file: 'blue-gradient-waves.html' },
                                    { id: 'particle-network', name: '粒子网络', file: 'particle-network.html' },
                                    { id: 'starfield', name: '星空', file: 'starfield.html' }
                                ],
                                current: 'default'
                            },
                            cards: [
                                { id: '1x1', name: 'Card1x1Component', tag: 'card-1x1' },
                                { id: '1x2', name: 'Card1x2Component', tag: 'card-1x2' },
                                { id: 'popup', name: 'CardPopupComponent', tag: 'card-popup' }
                            ]
                        };

                        // 转换为JSON字符串
                        const configStr = JSON.stringify(config, null, 2);

                        // 创建完整的config.js文件内容，包括所有必要的函数
                        const fullConfigContent = `/**
 * 应用配置文件
 * 用于存储可配置的参数
 */

const AppConfig = ${configStr};

// ==================== 工具函数 ====================

/**
 * 获取 HA 配置
 */
function getHAConfig() {
    return AppConfig.homeAssistant;
}

/**
 * 更新 HA 配置
 * @param {object} config - HA 配置对象
 */
function setHAConfig(config) {
    Object.assign(AppConfig.homeAssistant, config);
    return AppConfig.homeAssistant;
}

/**
 * 获取 HA 设置存储实体 ID
 */
function getHASettingsEntityId() {
    return AppConfig.homeAssistant.settingsEntityId || 'input_text.webui_settings';
}

/**
 * 设置 HA 设置存储实体 ID
 * @param {string} entityId - 实体 ID
 */
function setHASettingsEntityId(entityId) {
    AppConfig.homeAssistant.settingsEntityId = entityId;
    return entityId;
}

/**
 * 获取页眉标题
 */
function getHeaderbarTitle() {
    return AppConfig.headerbar.title;
}

/**
 * 更新页眉标题
 * @param {string} title - 新的标题
 */
function setHeaderbarTitle(title) {
    AppConfig.headerbar.title = title;
    return title;
}

/**
 * 获取天气配置
 */
function getWeatherConfig() {
    return AppConfig.headerbar.weather;
}

/**
 * 更新天气配置
 * @param {object} config - 天气配置对象
 */
function setWeatherConfig(config) {
    Object.assign(AppConfig.headerbar.weather, config);
    return AppConfig.headerbar.weather;
}

/**
 * 获取底部导航栏配置
 */
function getBottomNavConfig() {
    return AppConfig.bottomNav.items;
}

/**
 * 更新底部导航栏配置
 * @param {array} items - 导航栏项数组
 */
function setBottomNavConfig(items) {
    AppConfig.bottomNav.items = items;
    return items;
}

/**
 * 获取调试网格颜色
 */
function getDebugGridColor() {
    return AppConfig.debug.gridColor;
}

/**
 * 设置调试网格颜色
 * @param {string} color - 网格线颜色
 */
function setDebugGridColor(color) {
    AppConfig.debug.gridColor = color;
    return color;
}

/**
 * 切换调试网格显示
 */
function toggleDebugGrid() {
    AppConfig.debug.showGrid = !AppConfig.debug.showGrid;
    return AppConfig.debug.showGrid;
}

/**
 * 获取网格背景样式
 * @param {boolean} isMobile - 是否移动端（保留参数以保持API兼容性）
 */
function getGridBackground() {
    if (!AppConfig.debug.showGrid) {
        return 'none';
    }

    const color = AppConfig.debug.gridColor;

    return '\n        linear-gradient(to right, ' + color + ' 1px, transparent 1px),\n        linear-gradient(to bottom, ' + color + ' 1px, transparent 1px)\n    ';
}

/**
 * 获取背景主题配置
 */
function getBackgroundThemes() {
    return AppConfig.backgroundThemes;
}

/**
 * 获取当前背景主题
 */
function getCurrentBackgroundTheme() {
    const themes = AppConfig.backgroundThemes;
    return themes.available.find(theme => theme.id === themes.current) || themes.available[0];
}

/**
 * 切换背景主题
 * @param {string} themeId - 主题ID
 */
function setBackgroundTheme(themeId) {
    const theme = AppConfig.backgroundThemes.available.find(t => t.id === themeId);
    if (theme) {
        AppConfig.backgroundThemes.current = themeId;
        // 保存到本地存储
        try {
            localStorage.setItem('appBackgroundTheme', themeId);
        } catch (error) {
            // console.error('Failed to save theme to localStorage:', error);
        }
        return theme;
    }
    return null;
}

/**
 * 加载背景主题
 * 将背景HTML文件加载到页面中
 */
function loadBackgroundTheme() {
    const theme = getCurrentBackgroundTheme();
    const container = document.getElementById('background-container');
    
    if (!container) {
        // 背景容器未找到
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    if (theme.id === 'default' || !theme.file) {
        // 使用默认CSS渐变背景
        container.style.background = AppConfig.theme.backgroundGradient;
        container.style.backgroundAttachment = 'fixed';
        container.style.backgroundSize = 'cover';
    } else {
        // 加载HTML背景文件
        const iframe = document.createElement('iframe');
        iframe.src = 'backgrounds/' + theme.file;
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.pointerEvents = 'none'; // 防止交互干扰
        iframe.style.zIndex = '-1';
        
        container.appendChild(iframe);
        // 设置容器背景为透明，让iframe显示
        container.style.background = 'transparent';
    }
}

/**
 * 从本地存储加载保存的主题
 */
function loadSavedTheme() {
    try {
        const savedTheme = localStorage.getItem('appBackgroundTheme');
        if (savedTheme) {
            setBackgroundTheme(savedTheme);
        }
    } catch (error) {
        // console.error('Failed to load theme from localStorage:', error);
    }
}

/**
 * 获取 AppDaemon URL（返回完整可访问的 URL）
 * 规则：
 *  - 若配置项为绝对 URL（以 http/https 开头），直接返回
 *  - 若以 / 开头，基于 HA 的 origin 拼接（使用 getHAConfig().url 的 origin）
 *  - 否则直接返回配置值（保留原样）
 */
function getAppDaemonUrl() {
    try {
        const cfg = AppConfig.homeAssistant || {};
        const raw = cfg.appDaemonUrl || '';
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        // 若以 / 开头，基于 HA 的 origin 拼接
        if (raw.startsWith('/')) {
            try {
                const haUrl = new URL(cfg.url);
                return haUrl.origin + raw;
            } catch (e) {
                // 如果 HA url 无法解析，回退到基于当前 location 的 origin
                return location.origin + raw;
            }
        }
        return raw;
    } catch (e) {
        return AppConfig.homeAssistant?.appDaemonUrl || '';
    }
}

// ==================== 初始化 ====================

// 导出到全局对象
window.AppConfig = AppConfig;
window.getHAConfig = getHAConfig;
window.setHAConfig = setHAConfig;

window.getHASettingsEntityId = getHASettingsEntityId;
window.setHASettingsEntityId = setHASettingsEntityId;
window.getHeaderbarTitle = getHeaderbarTitle;
window.setHeaderbarTitle = setHeaderbarTitle;
window.getWeatherConfig = getWeatherConfig;
window.setWeatherConfig = setWeatherConfig;
window.getBottomNavConfig = getBottomNavConfig;
window.setBottomNavConfig = setBottomNavConfig;
window.getDebugGridColor = getDebugGridColor;
window.setDebugGridColor = setDebugGridColor;
window.toggleDebugGrid = toggleDebugGrid;
window.getGridBackground = getGridBackground;
// 背景主题相关函数
window.getBackgroundThemes = getBackgroundThemes;
window.getCurrentBackgroundTheme = getCurrentBackgroundTheme;
window.setBackgroundTheme = setBackgroundTheme;
window.loadBackgroundTheme = loadBackgroundTheme;
window.loadSavedTheme = loadSavedTheme;

// 导出 AppDaemon 辅助函数（恢复缺失的接口）
window.getAppDaemonUrl = getAppDaemonUrl;
`;

                        // 创建Blob对象
                        const blob = new Blob([fullConfigContent], { type: 'application/javascript' });

                        // 创建下载链接
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'config.js';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);

                        // 显示成功提示
                        if (window.vant && window.vant.Toast) {
                            window.vant.Toast.success('配置已导出');
                        }
                    },

                    // 应用通用设置（点击确定按钮时调用）
                    applyGeneralSettings() {
                        const settings = {};

                        // 1. 应用主题
                        if (window.setBackgroundTheme && this.selectedTheme) {
                            window.setBackgroundTheme(this.selectedTheme);
                            if (window.loadBackgroundTheme) {
                                window.loadBackgroundTheme();
                            }
                            localStorage.setItem('selectedTheme', this.selectedTheme);

                            // 添加到同步设置
                            if (window.HASettingsSync) {
                                settings.th = window.HASettingsSync.themeIdMap[this.selectedTheme] ?? 0;
                            }
                        }

                        // 2. 应用页眉标题
                        if (window.setHeaderbarTitle && this.headerTitle.trim()) {
                            const title = this.headerTitle.trim();
                            window.setHeaderbarTitle(title);
                            localStorage.setItem('headerbarTitle', title);

                            // 更新页眉显示
                            const titleCells = document.querySelectorAll('.headerbar-title-cell');
                            if (titleCells && titleCells.length > 0) {
                                titleCells.forEach(cell => {
                                    cell.textContent = title;
                                });
                            }

                            // 添加到同步设置
                            settings.t = title;
                        }

                        // 3. 应用天气城市
                        if (window.setWeatherConfig && this.selectedWeatherCity) {
                            window.setWeatherConfig({ city: this.selectedWeatherCity });
                            localStorage.setItem('weatherCity', this.selectedWeatherCity);

                            // 刷新天气数据
                            if (window.MobileHeaderbar) {
                                window.MobileHeaderbar.loadConfig();
                                window.MobileHeaderbar.fetchWeather();
                            }

                            // 添加到同步设置
                            if (window.HASettingsSync) {
                                const cityNumericId = window.HASettingsSync.weatherCityMap[this.selectedWeatherCity];
                                if (cityNumericId !== undefined) {
                                    settings.c = cityNumericId;
                                }
                            }
                        }

                        // 4. 应用导航栏配置
                        if (window.setBottomNavConfig && this.navbarItems.length > 0) {
                            window.setBottomNavConfig(this.navbarItems);
                            // 更新导航栏显示
                            if (window.NavigationManager) {
                                window.NavigationManager.generateNavItems();
                                window.NavigationManager.navItems = document.querySelectorAll('.nav-item');
                                window.NavigationManager.bindEvents();
                                window.NavigationManager.updateActiveState();
                            }
                        }
                        
                        // 5. 应用日志开关设置
                        localStorage.setItem('logEnabled', this.logEnabled);
                        // 更新移动调试日志按钮显示
                        if (this.logEnabled) {
                            // 如果开启日志，检查是否需要安装移动调试面板
                            if (!window.__mobileConsoleInstalled) {
                                const isMobileUA = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent || '');
                                const forced = location.search.includes('mobileDebug=1') || location.search.includes('mobileDebug=true');
                                if (isMobileUA || forced) {
                                    // 重新执行安装函数
                                    (function installMobileConsole(){
                                        try {
                                            if (window.__mobileConsoleInstalled) return;
                                            window.__mobileConsoleInstalled = true;

                                            window._mobileConsoleLogs = [];
                                            const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };

                                            function pushLog(level, args){
                                                try {
                                                    const text = args.map(a => {
                                                        try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
                                                    }).join(' ');
                                                    window._mobileConsoleLogs.push({ level, text, ts: Date.now() });
                                                    if (window._mobileConsoleLogs.length > 500) window._mobileConsoleLogs.shift();
                                                    if (panelOpen && logPre) {
                                                        logPre.textContent += `[${level}] ${text}\n`;
                                                        logPre.scrollTop = logPre.scrollHeight;
                                                    }
                                                } catch (e){}
                                            }

                                            ['log','info','warn','error'].forEach(l => {
                                                console[l] = function(...args){ pushLog(l, args); orig[l].apply(console, args); };
                                            });

                                            // 创建浮动按钮和面板
                                            const btn = document.createElement('button');
                                            btn.textContent = '日志';
                                            btn.title = '打开移动调试日志';
                                            btn.className = 'mobile-debug-button';
                                            Object.assign(btn.style, {
                                                position: 'fixed', right: '10px', bottom: '10px', zIndex: 2147483647,
                                                padding: '8px 10px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px'
                                            });

                                            const panel = document.createElement('div');
                                            panel.className = 'mobile-debug-panel';
                                            Object.assign(panel.style, {
                                                position: 'fixed', right: '10px', bottom: '50px', zIndex: 2147483647,
                                                width: '92%', maxWidth: '560px', height: '40%', background: 'rgba(0,0,0,0.9)', color: '#fff', borderRadius: '8px', padding: '8px', display: 'none', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden'
                                            });
                                            panel.style.display = 'none';

                                            const header = document.createElement('div');
                                            Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' });
                                            const title = document.createElement('div'); title.textContent = '移动调试日志';
                                            const actions = document.createElement('div');
                                            const clearBtn = document.createElement('button'); clearBtn.textContent = '清空';
                                            const closeBtn = document.createElement('button'); closeBtn.textContent = '关闭';
                                            [clearBtn, closeBtn].forEach(b=>Object.assign(b.style,{marginLeft:'8px',padding:'4px 8px',fontSize:'12px'}));
                                            actions.appendChild(clearBtn); actions.appendChild(closeBtn);
                                            header.appendChild(title); header.appendChild(actions);

                                            const logPre = document.createElement('pre');
                                            Object.assign(logPre.style, { flex: '1 1 auto', margin: '0', padding: '6px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', background: 'transparent' });

                                            panel.appendChild(header); panel.appendChild(logPre);
                                            document.body.appendChild(panel); document.body.appendChild(btn);

                                            let panelOpen = false;
                                            btn.addEventListener('click', ()=>{
                                                panelOpen = !panelOpen;
                                                panel.style.display = panelOpen ? 'flex' : 'none';
                                                if (panelOpen) {
                                                    // reload existing logs
                                                    logPre.textContent = window._mobileConsoleLogs.map(it=>`[${it.level}] ${new Date(it.ts).toISOString()} ${it.text}`).join('\n') + '\n';
                                                    logPre.scrollTop = logPre.scrollHeight;
                                                }
                                            });

                                            clearBtn.addEventListener('click', ()=>{
                                                window._mobileConsoleLogs = [];
                                                logPre.textContent = '';
                                            });

                                            closeBtn.addEventListener('click', ()=>{
                                                panelOpen = false;
                                                panel.style.display = 'none';
                                            });

                                        } catch (e) {}
                                    })();
                                }
                            }
                        } else {
                            // 如果关闭日志，移除移动调试日志按钮
                            const logButtons = document.querySelectorAll('button[title="打开移动调试日志"], .mobile-debug-button');
                            logButtons.forEach(btn => {
                                btn.remove();
                            });
                            // 移除日志面板
                            const logPanels = document.querySelectorAll('.mobile-debug-panel');
                            logPanels.forEach(panel => {
                                panel.remove();
                            });
                            // 额外检查并移除可能的面板元素
                            const fixedElements = document.querySelectorAll('div[style*="position: fixed"]');
                            fixedElements.forEach(element => {
                                if (element.style.background === 'rgba(0, 0, 0, 0.9)') {
                                    const header = element.querySelector('div > div');
                                    if (header && header.textContent.includes('移动调试日志')) {
                                        element.remove();
                                    }
                                }
                            });
                            // 重置安装标志
                            window.__mobileConsoleInstalled = false;
                        }

                        // 5. 同步到 HA
                        if (window.HASettingsSync && Object.keys(settings).length > 0) {
                            window.HASettingsSync.autoSync(settings);
                        }

                        // 6. 显示成功提示并关闭弹窗
                        if (window.vant && window.vant.Toast) {
                            window.vant.Toast.success('设置已保存');
                        }
                        this.closePopup();
                    },

                    // 配置管理 - 加载配置列表（使用 getHAConnection，增加 postMessage 回退）
                    async loadConfigList() {
                        try {
                            console.log('[配置管理] 开始加载配置列表...');

                            // 1) 先尝试直接获取 haConnection
                            const ha = await this.getHAConnection();
                            let result = null;

                            if (ha && typeof ha.callAppDaemonService === 'function') {
                                try {
                                    result = await ha.callAppDaemonService('default', 'panel', 'get_all_configs', {});
                                } catch (err) {
                                    console.warn('[配置管理] 直接调用 ha.callAppDaemonService 失败，尝试 postMessage 回退', err);
                                    result = null;
                                }
                            }

                            // 2) 如直接调用失败，尝试通过 postMessage 向父窗口请求（跨 iframe 回退）
                            if (!result) {
                                try {
                                    result = await this.callServiceViaPostMessage('callAppDaemonService', {
                                        domain: 'panel',
                                        service: 'get_all_configs',
                                        args: {}
                                    }, 8000);
                                    console.log('[配置管理] postMessage 回退返回:', result);
                                } catch (pmErr) {
                                    console.error('[配置管理] postMessage 回退失败:', pmErr);
                                    window.vant?.Toast?.fail?.('无法连接到后端服务（haConnection 未就绪）');
                                    return;
                                }
                            }

                            // 解析返回（兼容多种结构）
                            const configsObj = result?.configs || result?.response?.configs || result?.data?.configs || {};
                            this.configManager.configs = Object.entries(configsObj || {}).map(([key, data]) => ({
                                key,
                                value: data && data.hasOwnProperty('value') ? data.value : (data || ''),
                                updated_at: data && data.updated_at ? data.updated_at : ''
                            }));

                            console.log('[配置管理] 转换后的数组:', this.configManager.configs);
                            window.vant?.Toast?.success?.(`已加载 ${this.configManager.configs.length} 个配置`);
                        } catch (error) {
                            console.error('[配置管理] 加载失败:', error);
                            window.vant?.Toast?.fail?.('加载失败: ' + (error?.message || error));
                        }
                    },

                    // 通过 postMessage 请求父窗口执行服务并等待回复（回退方案）
                    callServiceViaPostMessage(action, payload = {}, timeout = 7000) {
                        return new Promise((resolve, reject) => {
                            try {
                                // 如果当前是顶级窗口且 haConnection 可用，直接调用以避免 postMessage 无效的场景
                                try {
                                    if ((window === window.parent || window === window.top) && window.haConnection && typeof window.haConnection.callAppDaemonService === 'function') {
                                        window.haConnection.callAppDaemonService(payload.namespace || 'default', payload.domain || payload.app || payload.serviceDomain || payload.app || payload.domain, payload.service || payload.serviceName || payload.action || payload.service, payload.args || payload.data || {})
                                            .then(r => resolve(r))
                                            .catch(e => reject(e));
                                        return;
                                    }
                                } catch (e) {
                                    // 忽略环境检测错误，继续走 postMessage 路径
                                }
                                const id = 'webui_msg_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                                const listener = (ev) => {
                                    if (!ev.data || ev.data.__webui_id !== id) return;
                                    window.removeEventListener('message', listener);
                                    if (ev.data.__webui_error) {
                                        reject(new Error(ev.data.__webui_error));
                                    } else {
                                        resolve(ev.data.__webui_result);
                                    }
                                };

                                window.addEventListener('message', listener);

                                // 向 parent/top 广播请求（父窗口应有相应的处理逻辑）
                                const message = {
                                    __webui_action: action,
                                    __webui_payload: payload,
                                    __webui_id: id
                                };
                                try { window.parent.postMessage(message, '*'); } catch (e) {}
                                try { window.top.postMessage(message, '*'); } catch (e) {}

                                // 超时处理
                                const to = setTimeout(() => {
                                    window.removeEventListener('message', listener);
                                    reject(new Error('postMessage 请求超时'));
                                }, timeout);

                                // 当 resolve/reject 被调用时清理超时
                                const wrapResolve = (v) => { clearTimeout(to); return v; };
                                const wrapReject = (e) => { clearTimeout(to); throw e; };
                                // 修正 listener 调用时清理已在 listener 中处理
                            } catch (ex) {
                                reject(ex);
                            }
                        });
                    },
                    
                    // 配置管理 - 保存配置
                    async saveConfig() {
                        if (!this.configManager.key.trim()) {
                            window.vant?.Toast?.fail?.('请输入配置键名');
                            return;
                        }
                        try {
                            JSON.parse(this.configManager.value);
                        } catch (e) {
                            window.vant?.Toast?.fail?.('JSON 格式错误: ' + e.message);
                            return;
                        }
                        try {
                            const ha = await this.getHAConnection();
                            if (!ha) {
                                window.vant?.Toast?.fail?.('无法连接到后端服务（haConnection 未就绪）');
                                return;
                            }
                            await ha.callAppDaemonService('default', 'panel', 'save_config', {
                                key: this.configManager.key,
                                value: this.configManager.value
                            });
                            window.vant?.Toast?.success?.('配置已保存');
                            this.configManager.editing = false;
                            this.loadConfigList();
                        } catch (error) {
                            window.vant?.Toast?.fail?.('保存失败: ' + (error?.message || error));
                        }
                    },

                    // 配置管理 - 删除配置
                    async deleteConfig(key) {
                        if (!confirm(`确定要删除配置 "${key}" 吗？`)) return;
                        try {
                            const ha = await this.getHAConnection();
                            if (!ha) {
                                window.vant?.Toast?.fail?.('无法连接到后端服务（haConnection 未就绪）');
                                return;
                            }
                            await ha.callAppDaemonService('default', 'panel', 'delete_config', { key });
                            window.vant?.Toast?.success?.('配置已删除');
                            this.loadConfigList();
                        } catch (error) {
                            window.vant?.Toast?.fail?.('删除失败: ' + (error?.message || error));
                        }
                    },

                    // 配置管理 - 取消编辑
                    cancelEdit() {
                        this.configManager.editing = false;
                        this.configManager.key = '';
                        this.configManager.value = '';
                    },

                    // 配置管理 - 获取值预览
                    getValuePreview(value) {
                        try {
                            const parsed = JSON.parse(value);
                            if (typeof parsed === 'object') {
                                return JSON.stringify(parsed).substring(0, 50) + '...';
                            }
                            return String(value).substring(0, 50) + '...';
                        } catch (e) {
                            return String(value).substring(0, 50) + '...';
                        }
                    },

                    // 导出当前配置为 JSON 文件（桌面上使用，手机可接收文件后导入）
                    async exportConfigsToFile() {
                        try {
                            // 确保已加载最新列表
                            await this.loadConfigList();
                        } catch (e) {
                            // 忽略，继续尝试导出当前缓存
                        }

                        const data = this.configManager.configs || [];
                        const out = {};
                        data.forEach(item => { out[item.key] = { value: item.value, updated_at: item.updated_at || '' }; });
                        const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'webui_configs.json';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                        window.vant?.Toast?.success?.('配置已导出');
                    },

                    // 触发隐藏文件输入用于导入
                    triggerImportFile() {
                        let input = document.getElementById('importConfigsInput');
                        if (!input) {
                            input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json,application/json';
                            input.id = 'importConfigsInput';
                            input.style.display = 'none';
                            input.addEventListener('change', (e) => this.importConfigsFromFile(e));
                            document.body.appendChild(input);
                        }
                        input.value = null;
                        input.click();
                    },

                    // 从文件导入配置（手机端使用）
                    importConfigsFromFile(event) {
                        try {
                            const file = event.target.files && event.target.files[0];
                            if (!file) {
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                try {
                                    const text = ev.target.result;
                                    const obj = JSON.parse(text);
                                    // 转换为内部数组格式
                                    const arr = Object.entries(obj || {}).map(([key, data]) => ({
                                        key,
                                        value: data && data.value !== undefined ? (typeof data.value === 'string' ? data.value : JSON.stringify(data.value)) : (data || ''),
                                        updated_at: data && data.updated_at ? data.updated_at : ''
                                    }));
                                    this.configManager.configs = arr;
                                    window.vant?.Toast?.success?.('已从文件导入配置，显示为本地数据');
                                } catch (ex) {
                                    window.vant?.Toast?.fail?.('导入失败：文件解析错误');
                                }
                            };
                            reader.readAsText(file, 'utf-8');
                        } catch (e) {
                            window.vant?.Toast?.fail?.('导入失败');
                        }
                    },

                    // 打开配置编辑器（点击列表或添加按钮调用）
                    openConfigEditor(key) {
                        // 如果传入 key，进入编辑已有配置模式
                        if (key) {
                            const cfg = (this.configManager.configs || []).find(c => c.key === key);
                            this.configManager.editing = true;
                            this.configManager.editingKey = key;
                            this.configManager.key = key;
                            try {
                                this.configManager.value = cfg && cfg.value !== undefined ? (typeof cfg.value === 'string' ? cfg.value : JSON.stringify(cfg.value, null, 2)) : '';
                            } catch (e) {
                                this.configManager.value = '';
                            }
                        } else {
                            // 新建配置
                            this.configManager.editing = true;
                            this.configManager.editingKey = '';
                            this.configManager.key = '';
                            this.configManager.value = '{}';
                        }
                    },

                    // 配置管理 - 格式化 JSON
                    formatJSON() {
                        try {
                            const parsed = JSON.parse(this.configManager.value);
                            this.configManager.value = JSON.stringify(parsed, null, 2);
                        } catch (e) {
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.fail('JSON 格式错误');
                            }
                        }
                    },

                    // 后端测试 - 保存配置
                    async saveTestConfig() {
                        if (!this.testKey?.trim()) {
                            window.vant?.Toast?.fail?.('请输入配置键名');
                            return;
                        }
                        try {
                            const ha = await this.getHAConnection();
                            if (!ha) {
                                window.vant?.Toast?.fail?.('无法连接到后端服务（haConnection 未就绪）');
                                return;
                            }
                            const result = await ha.callAppDaemonService('default', 'panel', 'save_config', {
                                key: this.testKey,
                                value: this.testValue
                            });
                            this.testResult = `保存成功: ${JSON.stringify(result)}`;
                            window.vant?.Toast?.success?.('配置已保存');
                        } catch (error) {
                            this.testResult = `保存失败: ${error?.message || error}`;
                            window.vant?.Toast?.fail?.('保存失败');
                        }
                    },

                    // 后端测试 - 加载配置
                    async loadTestConfig() {
                        if (!this.testKey?.trim()) {
                            window.vant?.Toast?.fail?.('请输入配置键名');
                            return;
                        }
                        try {
                            const ha = await this.getHAConnection();
                            if (!ha) {
                                window.vant?.Toast?.fail?.('无法连接到后端服务（haConnection 未就绪）');
                                return;
                            }
                            const result = await ha.callAppDaemonService('default', 'panel', 'load_config', { key: this.testKey });
                            this.testResult = `加载成功: ${JSON.stringify(result)}`;
                            this.testValue = result?.value || '';
                            window.vant?.Toast?.success?.('配置已加载');
                        } catch (error) {
                            this.testResult = `加载失败: ${error?.message || error}`;
                            window.vant?.Toast?.fail?.('加载失败');
                        }
                    },

                    // 后端测试 - 删除配置
                    async deleteTestConfig() {
                        if (!this.testKey?.trim()) {
                            window.vant?.Toast?.fail?.('请输入配置键名');
                            return;
                        }
                        try {
                            const ha = await this.getHAConnection();
                            if (!ha) {
                                window.vant?.Toast?.fail?.('无法连接到后端服务（haConnection 未就绪）');
                                return;
                            }
                            const result = await ha.callAppDaemonService('default', 'panel', 'delete_config', { key: this.testKey });
                            this.testResult = `删除成功: ${JSON.stringify(result)}`;
                            this.testValue = '';
                            window.vant?.Toast?.success?.('配置已删除');
                        } catch (error) {
                            this.testResult = `删除失败: ${error?.message || error}`;
                            window.vant?.Toast?.fail?.('删除失败');
                        }
                    },

                    // 后端测试 - 获取所有配置
                    async getAllConfigs() {
                        try {
                            const ha = await this.getHAConnection();
                            if (!ha) {
                                window.vant?.Toast?.fail?.('无法连接到后端服务（haConnection 未就绪）');
                                return;
                            }
                            const result = await ha.callAppDaemonService('default', 'panel', 'get_all_configs', {});
                            this.allConfigs = result?.configs || result?.response?.configs || {};
                            this.testResult = `所有配置: ${JSON.stringify(result, null, 2)}`;
                            window.vant?.Toast?.success?.('已获取所有配置');
                        } catch (error) {
                            this.testResult = `获取失败: ${error?.message || error}`;
                            window.vant?.Toast?.fail?.('获取失败');
                        }
                    },

                    // 获取可用的 haConnection（支持 window/parent/top，并做更长重试等待）
                    async getHAConnection(retries = 12, interval = 500) {
                        const resolveHA = () => {
                            try {
                                // 多路径尝试
                                return window.haConnection
                                    || (window.parent && window.parent.haConnection)
                                    || (window.top && window.top.haConnection)
                                    || (window.parent && window.parent.window && window.parent.window.haConnection)
                                    || null;
                            } catch (e) {
                                return null;
                            }
                        };

                        let ha = resolveHA();
                        let attempt = 0;
                        while (!ha && attempt < retries) {
                            await new Promise(r => setTimeout(r, interval));
                            ha = resolveHA();
                            attempt++;
                        }
                        return ha;
                    }
                },
                template: `
                    <div class="device-grid">
                        <card-1x1
                            v-for="(card, index) in settingsCards"
                            :key="index"
                            :name="card.name"
                            :icon="card.icon"
                            stateentity=""
                            devicetype="settings"
                            layouttype="default"
                            :hasdetailpage="false"
                            @settings-click="(payload) => handleSettingsClick(card)"
                            @click.native.stop
                        ></card-1x1>
                    </div>
                    
                    <!-- 弹出卡片 -->
                    <card-popup
                        v-model="showPopup"
                        :title="popupTitle"
                        :show-close="true"
                        :show-confirm="currentPopupType === 'haSettingsSync' || currentPopupType === 'general'"
                        :on-confirm="currentPopupType === 'haSettingsSync' ? onHaSettingsSyncConfirm : applyGeneralSettings"
                        @close="closePopup"
                    >
                        <div class="settings-popup">
                            <div style="font-size: 48px; margin-bottom: 16px;">{{ popupIcon }}</div>
                            <h3>{{ popupTitle }}</h3>
                            <p>{{ popupDescription }}</p>
                            
                            <!-- 根据弹出类型显示不同内容 -->
                            <div v-if="currentPopupType === 'general'" class="popup-content">
                                <div class="setting-item">
                                    <label>页眉标题</label>
                                    <input 
                                        type="text" 
                                        v-model="headerTitle" 
                                        class="header-title-input"
                                        placeholder="输入页眉标题"
                                    />
                                </div>
                                <div class="setting-item">
                                    <label>背景主题</label>
                                    <div ref="themeSelector" class="custom-theme-selector" @click="toggleThemeDropdown">
                                        <span class="selected-theme">{{ getCurrentThemeName() }}</span>
                                        <span class="dropdown-arrow" :style="{ transform: showThemeDropdown ? 'rotate(180deg)' : 'none' }">▼</span>
                                        <div v-if="showThemeDropdown" 
                                             class="theme-dropdown" 
                                             @click.stop
                                             :style="getDropdownStyle($refs.themeSelector)">
                                            <div v-for="theme in themeOptions" 
                                                 :key="theme.id" 
                                                 class="theme-option" 
                                                 :class="{ active: selectedTheme === theme.id }"
                                                 @click="selectTheme(theme.id)">
                                                {{ theme.name }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="setting-item">
                                    <label>天气城市</label>
                                    <div ref="citySelector" class="custom-theme-selector" @click="toggleCityDropdown">
                                        <span class="selected-theme">{{ selectedWeatherCity }}</span>
                                        <span class="dropdown-arrow" :style="{ transform: showCityDropdown ? 'rotate(180deg)' : 'none' }">▼</span>
                                        <div v-if="showCityDropdown" 
                                             class="theme-dropdown" 
                                             @click.stop
                                             :style="getDropdownStyle($refs.citySelector)">
                                            <div v-for="city in weatherCityOptions" 
                                                 :key="city.id" 
                                                 class="theme-option" 
                                                 :class="{ active: selectedWeatherCity === city.id }"
                                                 @click="selectWeatherCity(city.id)">
                                                {{ city.name }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="setting-item">
                                    <label>导航栏配置</label>
                                    <div class="navbar-config">
                                        <div v-for="(item, index) in navbarItems" :key="index" class="navbar-item" draggable="true" @dragstart="onDragStart($event, index)" @dragover="onDragOver($event)" @drop="onDrop($event, index)">
                                            <div class="drag-handle">☰</div>
                                            <input type="text" v-model="item.name" placeholder="按钮名称" class="navbar-input" />
                                            <input type="text" v-model="item.icon" placeholder="图标" class="navbar-input" />
                                            <input type="text" v-model="item.id" placeholder="页面ID" class="navbar-input" />
                                            <button class="remove-btn" @click="removeNavbarItem(index)">删除</button>
                                        </div>
                                        <button class="add-btn" @click="addNavbarItem">添加按钮</button>
                                    </div>
                                </div>
                                <div class="setting-item">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label>日志开关</label>
                                        <label class="switch">
                                            <input type="checkbox" v-model="logEnabled">
                                            <span class="slider round"></span>
                                        </label>
                                    </div>
                                    <p style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 8px;">开启后将显示底部日志按钮</p>
                                </div>
                                <div class="setting-item">
                                    <button class="export-config-btn" @click="exportHAConfig">导出HA配置</button>
                                </div>
                            </div>
                            
                            <div v-else-if="currentPopupType === 'network'" class="popup-content">
                                <div class="info-display">
                                    <div class="info-item">
                                        <span class="info-label">HA服务器地址：</span>
                                        <span class="info-value">{{ getHAConfigInfo()?.url || '未设置' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">访问令牌：</span>
                                        <span class="info-value">{{ getHAConfigInfo()?.token || '未设置' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">连接状态：</span>
                                    <span class="info-value" :style="{ 
                                        color: haConnectionStatus?.isConnected ? '#4CAF50' : 
                                               haConnectionStatus && !haConnectionStatus.isConnected ? '#f44336' : '#FF9800'
                                    }">
                                        {{ haConnectionStatus?.statusText || getHAConfigInfo()?.enabled || '未检测' }}
                                    </span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">连接超时：</span>
                                        <span class="info-value">{{ getHAConfigInfo()?.connectionTimeout }}ms</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">重连间隔：</span>
                                        <span class="info-value">{{ getHAConfigInfo()?.reconnectInterval }}ms</span>
                                    </div>
                                
                                <!-- 连接测试按钮 -->
                                <div class="info-item" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px;">
                                    <button class="ha-sync-btn" @click="testHAConnection" style="width: 100%; justify-content: center;">
                                        <span class="btn-icon">🔍</span>
                                        <span class="btn-text">测试 HA 连接</span>
                                    </button>
                                    <div v-if="haConnectionStatus && !haConnectionStatus.isConnected" style="margin-top: 8px; padding: 8px; background: rgba(244, 67, 54, 0.1); border-radius: 6px; font-size: 12px; color: #ff6b6b;">
                                        <strong>错误详情:</strong> {{ haConnectionStatus.error }}
                                    </div>
                                </div>
                            </div>
                            </div>
                            
                            <div v-else-if="currentPopupType === 'about'" class="popup-content">
                                <div class="info-display">
                                    <div class="info-item">
                                        <span class="info-label">应用名称：</span>
                                        <span class="info-value">智能家庭控制中心</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">版本号：</span>
                                        <span class="info-value">2.0.0</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">开发者：</span>
                                        <span class="info-value">智能家居团队</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">用户协议：</span>
                                        <a href="javascript:void(0)" @click="showTerms" class="info-link">查看用户协议</a>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">隐私政策：</span>
                                        <a href="javascript:void(0)" @click="showPrivacy" class="info-link">查看隐私政策</a>
                                    </div>
                                </div>
                            </div>

                            <div v-else-if="currentPopupType === 'haSettingsSync'" class="popup-content">
                                <div class="ha-settings-sync-content">
                                    <p style="text-align: center; color: rgba(255, 255, 255, 0.8); margin-bottom: 24px;">
                                        将设置同步到 Home Assistant 的 input_text 实体，实现跨设备同步。
                                    </p>
                                    <button class="ha-sync-btn" @click="syncSettingsToHA">
                                        <span class="btn-icon">☁️</span>
                                        <span class="btn-text">同步设置到 HA</span>
                                    </button>
                                    <button class="ha-sync-btn" @click="loadSettingsFromHA" style="margin-top: 12px;">
                                        <span class="btn-icon">📥</span>
                                        <span class="btn-text">从 HA 加载设置</span>
                                    </button>
                                    
                                    <!-- 字符使用情况 -->
                                    <div class="char-usage-display" style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                            <span style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">字符使用情况</span>
                                            <span :style="{
                                                color: charUsage.percentage > 90 ? '#ff6b6b' : 'rgba(255,255,255,0.9)',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }">
                                                {{ charUsage.used }} / 255 字符
                                            </span>
                                        </div>
                                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden;">
                                            <div :style="{
                                                width: charUsage.percentage + '%',
                                                height: '100%',
                                                background: charUsage.percentage > 90 ? '#ff6b6b' : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease, background 0.3s ease'
                                            }"></div>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                                            <span style="color: rgba(255,255,255,0.6); font-size: 12px;">已使用 {{ charUsage.percentage }}%</span>
                                            <span :style="{
                                                color: charUsage.remaining > 50 ? 'rgba(255,255,255,0.7)' : '#ff6b6b',
                                                fontSize: '12px'
                                            }">
                                                剩余 {{ charUsage.remaining }} 字符
                                            </span>
                                        </div>
                                    </div>

                                    <div style="margin-top: 20px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                                        <p style="color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.6;">
                                            <strong>HA 配置示例：</strong><br>
                                            在 configuration.yaml 中添加：<br>
                                            <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
                                                input_text:<br>
                                                &nbsp;&nbsp;webui_settings:<br>
                                                &nbsp;&nbsp;&nbsp;&nbsp;name: WebUI 设置
                                            </code>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div v-else-if="currentPopupType === 'backendTest'" class="popup-content">
                                <!-- 配置管理界面 -->
                                <div v-if="!configManager.editing" class="config-manager-list">
                                    <div class="config-manager-header">
                                        <h3>配置管理</h3>
                                        <button @click="openConfigEditor()" class="add-config-btn">
                                            <span>➕</span> 添加
                                        </button>
                                    </div>
                                    <div class="config-search">
                                        <input
                                            type="text"
                                            v-model="configManager.searchQuery"
                                            placeholder="搜索配置..."
                                            class="search-input"
                                        />
                                    </div>
                                    <div v-if="filteredConfigs.length === 0" class="empty-state">
                                        <p>暂无配置</p>
                                        <button @click="openConfigEditor()" class="empty-add-btn">
                                            添加第一个配置
                                        </button>
                                    </div>
                                    <div v-else class="config-list">
                                        <div
                                            v-for="config in filteredConfigs"
                                            :key="config.key"
                                            class="config-item"
                                            @click="openConfigEditor(config.key)"
                                        >
                                            <div class="config-item-info">
                                                <div class="config-key">{{ config.key }}</div>
                                                <div class="config-value-preview">
                                                    {{ getValuePreview(config.value) }}
                                                </div>
                                            </div>
                                            <div class="config-item-actions">
                                                <button
                                                    @click.stop="deleteConfig(config.key)"
                                                    class="delete-btn"
                                                    title="删除"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="config-footer">
                                        <button @click="loadConfigList()" class="refresh-btn">
                                            🔄 刷新列表
                                        </button>
                                        <button @click="exportConfigsToFile()" class="refresh-btn" style="margin-left:8px;">
                                            ⤓ 导出配置
                                        </button>
                                        <button @click.prevent="triggerImportFile()" class="refresh-btn" style="margin-left:8px;">
                                            ⤒ 从文件导入
                                        </button>
                                    </div>
                                </div>

                                <!-- 配置编辑界面 -->
                                <div v-else class="config-editor">
                                    <div class="config-editor-header">
                                        <h3>{{ configManager.editingKey ? '编辑配置' : '添加配置' }}</h3>
                                        <button @click="cancelEdit()" class="close-editor-btn">
                                            ✕
                                        </button>
                                    </div>
                                    <div class="config-input-group">
                                        <label>配置键名</label>
                                        <input
                                            type="text"
                                            v-model="configManager.key"
                                            placeholder="例如: theme_settings"
                                            :disabled="!!configManager.editingKey"
                                            class="config-key-input"
                                        />
                                    </div>
                                    <div class="config-input-group">
                                        <div class="config-value-header">
                                            <label>配置值 (JSON)</label>
                                            <button @click="formatJSON" class="format-btn">
                                                🎨 格式化
                                            </button>
                                        </div>
                                        <textarea
                                            v-model="configManager.value"
                                            placeholder='{"color": "blue", "size": 16}'
                                            rows="8"
                                            class="config-value-input"
                                        ></textarea>
                                    </div>
                                    <div class="config-editor-actions">
                                        <button @click="saveConfig()" class="save-config-btn">
                                            💾 保存
                                        </button>
                                        <button @click="cancelEdit()" class="cancel-config-btn">
                                            取消
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="popup-content">
                                <!-- 其他设置类型的默认内容 -->
                                <p style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 20px;">{{ popupDescription }}</p>
                            </div>
                        </div>
                    </card-popup>
                `
            });

            // 添加自定义主题选择器样式
            const style = document.createElement('style');
            style.textContent = `
                .custom-theme-selector {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                
                .custom-theme-selector:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                
                .selected-theme {
                    flex: 1;
                }
                
                .dropdown-arrow {
                    margin-left: 12px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    transition: transform 0.3s ease;
                }
                
                .theme-dropdown {
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    margin-bottom: 8px;
                    background: rgba(50, 50, 70, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    backdrop-filter: blur(15px);
                    overflow: hidden;
                    animation: dropdownFadeIn 0.2s ease;
                    max-height: 200px;
                    overflow-y: auto;
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
                }
                
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .theme-option {
                    padding: 12px 16px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .theme-option:last-child {
                    border-bottom: none;
                }
                
                .theme-option:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .theme-option.active {
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }
                
                .setting-item {
                    margin-bottom: 24px;
                }

                .setting-item:last-child {
                    margin-bottom: 0;
                }

                .setting-item label {
                    display: block;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                .cache-clear-content {
                    padding: 20px 0;
                }

                .clear-cache-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(238, 90, 90, 0.3);
                }

                .clear-cache-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(238, 90, 90, 0.4);
                }

                .clear-cache-btn:active {
                    transform: translateY(0);
                }

                .clear-cache-btn .btn-icon {
                    font-size: 20px;
                    margin-right: 8px;
                }

                .clear-cache-btn .btn-text {
                    font-weight: 600;
                }

                .ha-settings-sync-content {
                    padding: 20px 0;
                }

                .ha-sync-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
                }

                .ha-sync-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(118, 75, 162, 0.4);
                }

                .ha-sync-btn:active {
                    transform: translateY(0);
                }

                .ha-sync-btn .btn-icon {
                    font-size: 20px;
                    margin-right: 8px;
                }

                .ha-sync-btn .btn-text {
                    font-weight: 600;
                }

                .backend-test-content {
                    padding: 20px 0;
                }

                .test-input-group {
                    margin-bottom: 20px;
                }

                .test-input-group label {
                    display: block;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                .test-input-group input,
                .test-input-group textarea {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    font-family: monospace;
                    resize: vertical;
                }

                .test-input-group input::placeholder,
                .test-input-group textarea::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }

                .test-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .test-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
                }

                .test-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(118, 75, 162, 0.4);
                }

                .test-btn.danger {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                    box-shadow: 0 4px 15px rgba(238, 90, 90, 0.3);
                }

                .test-btn.danger:hover {
                    box-shadow: 0 6px 20px rgba(238, 90, 90, 0.4);
                }

                .test-btn span {
                    margin-right: 8px;
                    font-size: 16px;
                }

                .test-result {
                    margin-top: 20px;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                }

                .test-result label {
                    display: block;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                .test-result pre {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 12px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    margin: 0;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                }

                /* 配置管理样式 */
                .config-manager-list {
                    padding: 20px 0;
                }

                .config-manager-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .config-manager-header h3 {
                    margin: 0;
                    color: rgba(255,255,255,0.9);
                    font-size: 18px;
                }

                .add-config-btn {
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .add-config-btn span {
                    margin-right: 4px;
                    font-size: 14px;
                }

                .add-config-btn:hover {
                    transform: translateY(-2px);
                }

                .config-search {
                    margin-bottom: 20px;
                }

                .search-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                }

                .search-input::placeholder {
                    color: rgba(255,255,255,0.4);
                }

                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(255,255,255,0.6);
                }

                .empty-state p {
                    margin: 0 0 20px 0;
                    font-size: 14px;
                }

                .empty-add-btn {
                    padding: 10px 24px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    font-size: 13px;
                    cursor: pointer;
                }

                .empty-add-btn:hover {
                    background: rgba(255,255,255,0.15);
                }

                .config-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding-right: 4px;
                }

                .config-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .config-item:hover {
                    background: rgba(255,255,255,0.12);
                    border-color: rgba(255,255,255,0.25);
                }

                .config-item-info {
                    flex: 1;
                    min-width: 0;
                }

                .config-key {
                    font-size: 15px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.95);
                    margin-bottom: 6px;
                }

                .config-value-preview {
                    font-size: 12px;
                    color: rgba(255,255,255,0.6);
                    font-family: monospace;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .config-item-actions {
                    display: flex;
                    gap: 8px;
                    margin-left: 12px;
                }

                .delete-btn {
                    padding: 8px 12px;
                    background: rgba(238, 90, 90, 0.2);
                    border:1px solid rgba(238, 90, 90, 0.3);
                    border-radius: 8px;
                    color: #ee5a5a;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .delete-btn:hover {
                    background: rgba(238, 90, 90, 0.3);
                }

                .config-footer {
                    margin-top: 20px;
                    text-align: center;
                }

                .refresh-btn {
                    padding: 10px 20px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    font-size: 13px;
                    cursor: pointer;
                }

                /* 配置编辑器样式 */
                .config-editor {
                    padding: 20px 0;
                }

                .config-editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .config-editor-header h3 {
                    margin: 0;
                    color: rgba(255,255,255,0.9);
                    font-size: 18px;
                }

                .close-editor-btn {
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    font-size: 20px;
                    cursor: pointer;
                }

                .close-editor-btn:hover {
                    color: rgba(255,255,255,0.9);
                }

                .config-input-group {
                    margin-bottom: 20px;
                }

                .config-input-group label {
                    display: block;
                    color: rgba(255,255,255,0.9);
                    font-weight: 500;
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                .config-value-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .config-value-header label {
                    margin-bottom: 0;
                }

                .format-btn {
                    padding: 6px 12px;
                    background: rgba(102, 126, 234, 0.2);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-radius: 6px;
                    color: #667eea;
                    font-size: 12px;
                    cursor: pointer;
                }

                .format-btn:hover {
                    background: rgba(102, 126, 234, 0.3);
                }

                .config-key-input,
                .config-value-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    font-family: monospace;
                    resize: vertical;
                }

                .config-key-input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .config-key-input::placeholder,
                .config-value-input::placeholder {
                    color: rgba(255,255,255,0.4);
                }

                .config-editor-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .save-config-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .save-config-btn span {
                    margin-right: 6px;
                    font-size: 16px;
                }

                .save-config-btn:hover {
                    transform: translateY(-2px);
                }

                .cancel-config-btn {
                    padding: 12px 20px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                }

                .cancel-config-btn:hover {
                    background: rgba(255,255,255,0.15);
                }



            `;
            document.head.appendChild(style);
            
            // 根据 config.js 的 cards 配置自动注册卡片组件
            const cardConfig = window.AppConfig && window.AppConfig.cards;
            if (Array.isArray(cardConfig)) {
                cardConfig.forEach(card => {
                    const Component = card.name && window[card.name];
                    if (Component && card.tag) {
                        settingsApp.component(card.tag, Component);
                    }
                });
            } else {
                // 后备方案：直接注册
                if (window.Card1x1Component) {
                    settingsApp.component('card-1x1', window.Card1x1Component);
                }
                if (window.CardPopupComponent) {
                    settingsApp.component('card-popup', window.CardPopupComponent);
                }
            }

            // 挂载应用
            settingsApp.mount(container);
            this.vueApp = settingsApp;
            // 可选：在移动设备或通过 URL 参数开启内置调试面板，方便在无法用远程调试时查看 console
            (function installMobileConsole(){
                try {
                    // 检查日志开关状态
                    const logEnabled = localStorage.getItem('logEnabled') === 'true';
                    if (!logEnabled) return;
                    
                    const isMobileUA = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent || '');
                    const forced = location.search.includes('mobileDebug=1') || location.search.includes('mobileDebug=true');
                    if (!isMobileUA && !forced) return;
                    if (window.__mobileConsoleInstalled) return;
                    window.__mobileConsoleInstalled = true;

                    window._mobileConsoleLogs = [];
                    const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };

                    function pushLog(level, args){
                        try {
                            const text = args.map(a => {
                                try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
                            }).join(' ');
                            window._mobileConsoleLogs.push({ level, text, ts: Date.now() });
                            if (window._mobileConsoleLogs.length > 500) window._mobileConsoleLogs.shift();
                            if (panelOpen && logPre) {
                                logPre.textContent += `[${level}] ${text}\n`;
                                logPre.scrollTop = logPre.scrollHeight;
                            }
                        } catch (e){}
                    }

                    ['log','info','warn','error'].forEach(l => {
                        console[l] = function(...args){ pushLog(l, args); orig[l].apply(console, args); };
                    });

                    // 创建浮动按钮和面板
                    const btn = document.createElement('button');
                    btn.textContent = '日志';
                    btn.title = '打开移动调试日志';
                    Object.assign(btn.style, {
                        position: 'fixed', right: '10px', bottom: '10px', zIndex: 2147483647,
                        padding: '8px 10px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px'
                    });

                    const panel = document.createElement('div');
                    Object.assign(panel.style, {
                        position: 'fixed', right: '10px', bottom: '50px', zIndex: 2147483647,
                        width: '92%', maxWidth: '560px', height: '40%', background: 'rgba(0,0,0,0.9)', color: '#fff', borderRadius: '8px', padding: '8px', display: 'none', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden'
                    });
                    panel.style.display = 'none';

                    const header = document.createElement('div');
                    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' });
                    const title = document.createElement('div'); title.textContent = '移动调试日志';
                    const actions = document.createElement('div');
                    const clearBtn = document.createElement('button'); clearBtn.textContent = '清空';
                    const closeBtn = document.createElement('button'); closeBtn.textContent = '关闭';
                    [clearBtn, closeBtn].forEach(b=>Object.assign(b.style,{marginLeft:'8px',padding:'4px 8px',fontSize:'12px'}));
                    actions.appendChild(clearBtn); actions.appendChild(closeBtn);
                    header.appendChild(title); header.appendChild(actions);

                    const logPre = document.createElement('pre');
                    Object.assign(logPre.style, { flex: '1 1 auto', margin: '0', padding: '6px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', background: 'transparent' });

                    panel.appendChild(header); panel.appendChild(logPre);
                    document.body.appendChild(panel); document.body.appendChild(btn);

                    let panelOpen = false;
                    btn.addEventListener('click', ()=>{
                        panelOpen = !panelOpen;
                        panel.style.display = panelOpen ? 'flex' : 'none';
                        if (panelOpen) {
                            // reload existing logs
                            logPre.textContent = window._mobileConsoleLogs.map(it=>`[${it.level}] ${new Date(it.ts).toISOString()} ${it.text}`).join('\n') + '\n';
                            logPre.scrollTop = logPre.scrollHeight;
                        }
                    });
                    closeBtn.addEventListener('click', ()=>{ panelOpen=false; panel.style.display='none'; });
                    clearBtn.addEventListener('click', ()=>{ window._mobileConsoleLogs = []; logPre.textContent=''; });

                    // 轻量的复制全部日志支持
                    const copyBtn = document.createElement('button'); copyBtn.textContent='复制';
                    Object.assign(copyBtn.style, { marginLeft: '8px', padding:'4px 8px', fontSize:'12px' });
                    actions.appendChild(copyBtn);
                    copyBtn.addEventListener('click', async ()=>{
                        try { await navigator.clipboard.writeText(window._mobileConsoleLogs.map(it=>`[${it.level}] ${new Date(it.ts).toISOString()} ${it.text}`).join('\n')); window.vant?.Toast?.success?.('已复制到剪贴板'); } catch(e){ window.vant?.Toast?.fail?.('复制失败'); }
                    });
                } catch (e) { console.error('installMobileConsole error', e); }
            })();
        }
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SettingsPage.init();
        });
    } else {
        window.SettingsPage.init();
    }
}

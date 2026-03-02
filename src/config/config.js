/**
 * 应用配置文件
 * 用于存储可配置的参数
 */

const AppConfig = {
    // Home Assistant 配置
    homeAssistant: {
        // HA 服务器地址
        url: 'http://192.168.4.5:8123',

        // HA 访问令牌
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhYTZlOTM3MWFjZDg0NTlkYTJkM2ZlMWQ5MDg1N2IwMCIsImlhdCI6MTc2ODcwODc1MiwiZXhwIjoyMDg0MDY4NzUyfQ.o911fMvo6C4DoIG3vwbRH_7IiL55SWigB3RgDX-ZPgE',
        // 是否启用 HA 连接
        enabled: true,

        // WebSocket 连接超时时间（毫秒）
        connectionTimeout: 5000,

        // 重连间隔（毫秒）
        reconnectInterval: 3000,

        // 设置同步存储实体 ID（input_text 辅助元素）
        settingsEntityId: 'input_text.webui_settings',

        // AppDaemon 服务器地址（如果与 HA 端口不同）
        // 建议：在不能直接跨域访问时，可将此项改为代理路径（例如 '/appdaemon'）,
        // 然后在前端或反向代理上将该路径转发到实际 AppDaemon 地址。
        // AppDaemon 通常运行在独立端口（例如 5050），使用绝对地址以避免与 HA（8123）混淆
        appDaemonUrl: 'http://192.168.4.5:5050'
        //appDaemonUrl: '/appdaemon'
    },

    // 页眉标题
    headerbar: {
        // 页眉显示的标题
        title: '智能家庭控制中心',

        // 是否显示页眉标题（移动端）
        showTitle: true,

        // 页眉高度
        height: 112,

        // 天气配置
        weather: {
            // 是否显示天气
            enabled: true,

            // 天气位置：grid-start（起始列）, span（占据列数）
            position: {
                gridStart: 4,
                span: 3
            },

            // 城市名称
            city: '达拉特旗',

            // 天气图标大小
            iconSize: 28,

            // 温度字体大小
            tempSize: 22,

            // 城市名字体大小
            citySize: 12,

            // 元素间距
            gap: 8,

            // 是否右对齐
            alignRight: true
        }
    },
    
    // 底部导航栏
    bottomNav: {
        // 导航项配置
        items: [
            { id: 'home', name: '首页', icon: '🏠' },
            { id: 'scenes', name: '场景', icon: '🎬' },
            { id: 'apps', name: '应用', icon: '📱' },
            { id: 'settings', name: '设置', icon: '⚙️' }
        ]
    },
    
    // 网格调试
    debug: {
        // 是否显示调试网格线
        showGrid: true,
        
        // 网格线颜色
        gridColor: 'rgba(255, 0, 0, 0.2)',
        
        // 移动端网格大小
        mobileGridSize: 20,
        
        // 桌面端网格大小
        desktopGridSize: 24
    },
    
    // 页面配置
    pages: {
        // 可用页面列表
        available: ['home', 'scenes', 'apps', 'settings'],
        
        // 页面路径配置
        paths: {
            mobile: {
                home: 'src/pages/mobile/home.html',
                scenes: 'src/pages/mobile/scenes.html',
                apps: 'src/pages/mobile/apps.html',
                settings: 'src/pages/mobile/settings.html',
                headerbar: 'src/pages/mobile/headerbar/headerbar.html'
            },
            desktop: {
                home: 'src/pages/desktop/home.html',
                scenes: 'src/pages/desktop/scenes.html',
                apps: 'src/pages/desktop/apps.html',
                settings: 'src/pages/desktop/settings.html'
            }
        }
    },
    
    // 主题配置
    theme: {
        // 主背景渐变
        backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        
        // 卡片背景透明度
        cardBackgroundOpacity: 0.15,
        
        // 文字颜色
        textColor: '#ffffff',
        
        // 次要文字颜色
        textSecondaryColor: 'rgba(255, 255, 255, 0.7)'
    },

    // 背景主题配置
    backgroundThemes: {
        // 可用背景主题列表（对应 backgrounds/ 文件夹中的 HTML 文件）
        available: [
            { id: 'default', name: '默认渐变', file: null }, // 使用 CSS 渐变背景
            { id: 'aurora-borealis', name: '极光效果', file: 'aurora-borealis.html' },
            { id: 'blue-gradient-waves', name: '蓝色波浪', file: 'blue-gradient-waves.html' },
            { id: 'particle-network', name: '粒子网络', file: 'particle-network.html' },
            { id: 'starfield', name: '星空', file: 'starfield.html' }
        ],
        // 当前选中的背景主题 ID
        current: 'default'
    },

    // -------------------------------------------------------------------------// 卡片组件统一配置（新增卡片只需在此添加一项，无需改 index.html 或 home.js）    // -------------------------------------------------------------------------    // 说明：    //   - id：卡片文件夹名，用于自动拼出路径 src/cards/{id}/css/{id}-card.css、src/cards/{id}/js/{id}-component.js    //   - name：该卡片脚本挂到 window 上的全局变量名（如 Card1x1Component）    //   - tag：在模板中使用的 Vue 自定义标签名（如 card-1x1）    // 约定：每个卡片目录下需有 css/{id}-card.css、js/{id}-component.js，且脚本内赋值 window[name] = 组件    // -------------------------------------------------------------------------
    cards: [
        { id: '1x1', name: 'Card1x1Component', tag: 'card-1x1' },
        { id: '1x2', name: 'Card1x2Component', tag: 'card-1x2' },
        { id: 'popup', name: 'CardPopupComponent', tag: 'card-popup' }
    ]
};

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

    return `
        linear-gradient(to right, ${color} 1px, transparent 1px),
        linear-gradient(to bottom, ${color} 1px, transparent 1px)
    `;
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
        iframe.src = `src/assets/backgrounds/${theme.file}`;
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

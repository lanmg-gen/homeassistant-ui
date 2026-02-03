/**
 * 智能家居控制面板 - 页面逻辑
 * 
 * 功能:
 * - 底部导航栏切换
 * - 页面路由管理
 * - 响应式页面加载（移动端/桌面端）
 * - 页面切换动画
 * - Vue应用初始化
 */

// 配置将由 config/config.js 提供

// ==================== 应用状态管理 ====================
const AppState = {
    data: {
        currentPage: 'home',
        isMobile: true,
        // 可以添加更多全局状态
    },

    // 设置当前页面
    setPage(pageName) {
        if (window.AppConfig && window.AppConfig.pages.available.includes(pageName)) {
            this.data.currentPage = pageName;
            this.saveToStorage();
        } else {
            // console.error(`Invalid page: ${pageName}`);
        }
    },
    
    // 检测设备类型
    detectDevice() {
        this.data.isMobile = window.innerWidth < 768;
    },
    
    // 保存到本地存储
    saveToStorage() {
        try {
            localStorage.setItem('appCurrentPage', this.data.currentPage);
        } catch (error) {
            // console.error('Failed to save to localStorage:', error);
        }
    },
    
    // 从本地存储加载
    loadFromStorage() {
        try {
            const savedPage = localStorage.getItem('appCurrentPage');
            if (savedPage && window.AppConfig && window.AppConfig.pages.available.includes(savedPage)) {
                this.data.currentPage = savedPage;
            }
        } catch (error) {
            // console.error('Failed to load from localStorage:', error);
        }
    }
};

// ==================== 页面管理器 ====================
const PageManager = {
    // 主内容区域
    contentArea: null,
    
    // 初始化
    init() {
        this.contentArea = document.querySelector('.main-content');
        if (!this.contentArea) {
            // console.error('Main content area not found');
            return;
        }

        // 记录当前的设备类型
        let currentDeviceType = null;
        let resizeTimer = null;

        // 监听窗口大小变化（带防抖）
        window.addEventListener('resize', () => {
            // 清除之前的定时器
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }

            // 设置新的定时器（延迟200ms执行）
            resizeTimer = setTimeout(() => {
                const oldDeviceType = currentDeviceType;
                AppState.detectDevice();
                const newDeviceType = AppState.data.isMobile ? 'mobile' : 'desktop';

                // 只有当设备类型改变时才重新加载页面
                if (oldDeviceType !== newDeviceType) {
                    this.loadPage(AppState.data.currentPage, true);
                }
                currentDeviceType = newDeviceType;
            }, 200);
        });

        // 初始检测设备类型
        AppState.detectDevice();
        currentDeviceType = AppState.data.isMobile ? 'mobile' : 'desktop';
    },
    
    // 加载页面
    async loadPage(pageName, force = false) {
        const deviceType = AppState.data.isMobile ? 'mobile' : 'desktop';
        const pagePath = window.AppConfig ? window.AppConfig.pages.paths[deviceType][pageName] : null;
        const cssPath = `pages/${deviceType}/${pageName}.css`;
        const jsPath = `pages/${deviceType}/${pageName}.js`;
        
        if (!pagePath) {
            // console.error(`Page path not found: ${pageName}`);
            return;
        }
        
        try {
            // 移除旧页面的CSS和JS
            this.removeOldResources();

            // 清理旧的 Vue 应用实例
            if (window.HomePage && window.HomePage.vueApp) {
                try {
                    window.HomePage.vueApp.unmount();
                    window.HomePage.vueApp = null;
                } catch (e) {
                    // console.error('清理 Vue 应用时出错:', e);
                }
            }

            // 添加淡出动画
            this.contentArea.style.opacity = '0';
            this.contentArea.style.transform = 'translateY(20px)';
            this.contentArea.style.transition = 'all 0.3s ease';

            // 等待动画完成
            await this.delay(300);

            // 加载页面内容
            const response = await fetch(pagePath);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.statusText}`);
            }

            const html = await response.text();

            // 插入新内容
            this.contentArea.innerHTML = html;

            // 加载页面的CSS
            await this.loadCSS(cssPath, pageName);

            // 加载页面的JS
            await this.loadJS(jsPath);

            // 通用页面Vue应用创建逻辑
            const pageObjectName = pageName.charAt(0).toUpperCase() + pageName.slice(1) + 'Page';
            if (window[pageObjectName] && window[pageObjectName].createVueApp) {
                window[pageObjectName].createVueApp();
            }

            // 添加淡入动画
            setTimeout(() => {
                this.contentArea.style.opacity = '1';
                this.contentArea.style.transform = 'translateY(0)';
            }, 50);

            } catch (error) {
                // console.error('Failed to load page:', error);
                this.showError(`加载页面失败: ${error.message}`);
            }
    },
    
    // 加载CSS
    loadCSS(path, pageName) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.dataset.page = pageName;
            link.onload = () => {
                resolve();
            };
            link.onerror = () => {
                // console.warn(`CSS load failed: ${path}`);
                resolve(); // 不阻塞，即使CSS加载失败也继续
            };
            document.head.appendChild(link);
        });
    },
    
    // 加载JS
    loadJS(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                // console.warn(`JS load failed: ${path}`);
                resolve(); // 不阻塞，即使JS加载失败也继续
            };
            document.body.appendChild(script);
        });
    },
    
    // 移除旧页面的资源
    removeOldResources() {
        // 移除旧的CSS
        const oldCSS = document.querySelectorAll('link[data-page]');
        oldCSS.forEach(link => link.remove());
        
        // JS不需要移除，因为我们使用了条件判断避免重复声明
    },
    
    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 显示错误
    showError(message) {
        const errorHtml = `
            <div class="error-page">
                <div class="error-icon">⚠️</div>
                <h2>出错了</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="error-button">重新加载</button>
            </div>
        `;
        this.contentArea.innerHTML = errorHtml;
        this.contentArea.style.opacity = '1';
        this.contentArea.style.transform = 'translateY(0)';
    }
};

// ==================== 导航管理 ====================
const NavigationManager = {
    // 初始化导航
    init() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.bindEvents();
        this.updateActiveState();
    },
    
    // 绑定事件
    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = item.getAttribute('data-page');
                this.navigateTo(pageName);
            });
        });
    },
    
    // 导航到指定页面
    async navigateTo(pageName) {
        if (pageName === AppState.data.currentPage) {
            return;
        }
        
        // 更新状态
        AppState.setPage(pageName);
        
        // 更新导航栏激活状态
        this.updateActiveState();
        
        // 加载新页面
        await PageManager.loadPage(pageName);
        
        // 触发页面切换事件
        this.dispatchEvent('page-change', { page: pageName });
    },

    // 更新激活状态
    updateActiveState() {
        const currentPage = AppState.data.currentPage;
        this.navItems.forEach(item => {
            const itemPage = item.getAttribute('data-page');
            if (itemPage === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    // 触发自定义事件
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail: detail });
        window.dispatchEvent(event);
    }
};

// ==================== Vue应用 ====================
const App = {
    // Vue实例
    vueInstance: null,

    // 初始化
    async init() {
        // 初始化 HA 连接
        this.initHAConnection();

        // 加载保存的状态
        AppState.loadFromStorage();

        // 加载保存的主题
        if (window.loadSavedTheme) {
            window.loadSavedTheme();
        }

        // 检测设备类型
        AppState.detectDevice();

        // 初始化页面管理器
        PageManager.init();

        // 初始化底部导航
        NavigationManager.init();

        // 加载移动端顶部页眉(仅在移动端)
        if (AppState.data.isMobile) {
            await this.loadMobileHeaderbar();
        }

        // 创建Vue应用
        this.createVueApp();

        // 加载初始页面
        await PageManager.loadPage(AppState.data.currentPage);

        // 加载背景主题
        if (window.loadBackgroundTheme) {
            window.loadBackgroundTheme();
        }
    },

    // 初始化 HA 连接
    initHAConnection() {
        const haConfig = window.getHAConfig ? window.getHAConfig() : { url: '', token: '' };

        if (haConfig && haConfig.enabled && window.haConnection) {
            window.haConnection.init(haConfig.url, haConfig.token);

            // 初始化状态管理器
            if (window.DeviceStateManager) {
                window.DeviceStateManager.init();
            }

            // 初始化 WebSocket（优先使用 WebSocket）
            if (window.WebSocketManager) {
                window.WebSocketManager.init(haConfig.url, haConfig.token);
            }

            // 监听状态更新，转发给状态管理器
            window.haConnection.addListener('stateUpdate', (data) => {
                if (window.DeviceStateManager && data.entityId) {
                    window.DeviceStateManager.updateCache(data.entityId, data.state);
                }
            });

            // 监听连接错误
            window.haConnection.addListener('error', (data) => {
                console.error('HA 连接错误:', data.message);
                if (window.vant && window.vant.Toast) {
                    window.vant.Toast.fail(data.message);
                }
            });

            // 监听HA就绪事件
            window.addEventListener('ha-ready', () => {
                if (window.DeviceStateManager) {
                    window.DeviceStateManager.refreshAll();
                }
            });
        }
    },
    
    // 加载移动端顶部页眉
    async loadMobileHeaderbar() {
        try {
            const headerbarContainer = document.getElementById('mobile-headerbar');
            if (!headerbarContainer) {
                console.warn('Mobile headerbar container not found');
                return;
            }
            
            // 加载页眉HTML
            const headerbarPath = window.AppConfig ? window.AppConfig.pages.paths.mobile.headerbar : 'pages/mobile/headerbar/headerbar.html';
            const response = await fetch(headerbarPath);
            if (!response.ok) {
                throw new Error(`Failed to load headerbar: ${response.statusText}`);
            }
            
            const html = await response.text();
            headerbarContainer.innerHTML = html;
            
            // 加载页眉CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'pages/mobile/headerbar/headerbar.css';
            document.head.appendChild(link);
            
            // 加载页眉JS
            const script = document.createElement('script');
            script.src = 'pages/mobile/headerbar/headerbar.js';
            document.body.appendChild(script);
        } catch (error) {
            // console.error('Failed to load mobile headerbar:', error);
        }
    },
    
    // 创建Vue应用
    createVueApp() {
        const { createApp } = Vue;

        this.vueInstance = createApp({
            data() {
                return {
                    currentPage: AppState.data.currentPage,
                    isMobile: AppState.data.isMobile
                };
            },
            mounted() {
                // 监听页面切换事件
                window.addEventListener('page-change', this.handlePageChange);
            },
            beforeUnmount() {
                // 移除事件监听
                window.removeEventListener('page-change', this.handlePageChange);
            },
            methods: {
                // 处理页面切换
                handlePageChange(event) {
                    this.currentPage = event.detail.page;
                },

                // 切换页面
                navigateTo(pageName) {
                    NavigationManager.navigateTo(pageName);
                }
            }
        });
        
        // 将Vue实例挂载到全局
        window.vueApp = this.vueInstance;
    }
};

// ==================== 工具函数 ====================

// 显示提示信息
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
        font-size: 14px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== 初始化 ====================

// DOM加载完成后初始化应用
// 注意：如果是动态加载（通过 cards-loader.js），DOMContentLoaded 已经触发过了
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    // DOM 已经加载完成，直接初始化
    App.init();
}

// 导出全局对象
window.AppConfig = AppConfig;
window.AppState = AppState;
window.PageManager = PageManager;
window.NavigationManager = NavigationManager;
window.App = App;
window.showToast = showToast;

// 立即初始化 window.app，确保卡片组件可以使用
window.app = {
    getDeviceState: (entityId) => {
        // 防御性检查：确保 entityId 有效
        if (!entityId || typeof entityId !== 'string') {
            console.warn(`[app.getDeviceState] 无效的实体ID: ${entityId}`, new Error().stack);
            return Promise.resolve('unavailable');
        }
        return window.haConnection ? window.haConnection.getDeviceState(entityId) : Promise.resolve('off');
    },
    handleDeviceClick: (device) => window.DeviceController ? window.DeviceController.handleDeviceClick(device) : Promise.resolve(),
    callService: (domain, service, data) => window.haConnection ? window.haConnection.callService(domain, service, data) : Promise.reject(new Error('HA 未连接'))
};

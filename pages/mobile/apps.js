/**
 * 应用页面 - 移动端逻辑
 */

// 避免重复声明
if (!window.AppsPage) {
    window.AppsPage = {
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

            const container = document.getElementById('appsContainer');
            if (!container) {
                return;
            }

            // 创建一个新的 Vue 应用实例专门用于 apps 页面
            const appsApp = Vue.createApp({
                data() {
                    return {
                        apps: [],
                        selectedApp: null,
                        showAppContainer: false,
                        showMenu: false
                    };
                },
                mounted() {
                    this.loadApps();
                },
                methods: {
                    // 加载应用列表
                    loadApps() {
                        // 从应用文件夹中加载应用
                        this.loadAppsFromFolder();
                    },
                    
                    // 从应用文件夹加载应用
                    loadAppsFromFolder() {
                        // 尝试扫描apps文件夹中的html文件
                        this.scanAppsFolder();
                    },
                    
                    // 从apps.json文件加载应用列表
                    async scanAppsFolder() {
                        try {
                            // 尝试加载apps.json文件
                            const response = await fetch('apps/apps.json');
                            if (!response.ok) {
                                throw new Error('无法加载apps.json文件');
                            }
                            
                            const data = await response.json();
                            if (data.apps && Array.isArray(data.apps)) {
                                // 加载每个应用的详细配置
                                this.apps = await Promise.all(data.apps.map(async app => {
                                    try {
                                        // 构建应用路径
                                        const appPath = 'apps/' + app.name;
                                        // 尝试加载应用的配置文件
                                        const configResponse = await fetch(`${appPath}/config/config.json`);
                                        let appConfig = {};
                                        
                                        if (configResponse.ok) {
                                            appConfig = await configResponse.json();
                                        }
                                        
                                        // 合并应用信息
                                        const appInfo = {
                                            id: app.name,
                                            path: appPath + '/index.html',
                                            name: appConfig.app?.name || app.name,
                                            icon: appConfig.app?.icon || '📱'
                                        };
                                        
                                        // 加载外部SVG图标
                                        if (appInfo.icon && appInfo.icon.startsWith('svg:')) {
                                            const svgPath = 'apps/' + appInfo.icon.replace('svg:', '');
                                            try {
                                                const svgResponse = await fetch(svgPath);
                                                if (svgResponse.ok) {
                                                    appInfo.svgContent = await svgResponse.text();
                                                }
                                            } catch (svgError) {
                                                console.error(`加载SVG图标失败: ${svgPath}`, svgError);
                                            }
                                        }
                                        
                                        return appInfo;
                                    } catch (configError) {
                                        console.error(`加载应用 ${app.name} 配置失败:`, configError);
                                        // 如果配置加载失败，使用基本信息
                                        return {
                                            id: app.name,
                                            path: 'apps/' + app.name + '/index.html',
                                            name: app.name,
                                            icon: '📱'
                                        };
                                    }
                                }));
                            } else {
                                // 如果apps.json格式不正确，使用默认应用
                                this.apps = this.getDefaultApps();
                            }
                        } catch (error) {
                            console.error('加载apps.json失败:', error);
                            // 如果加载失败，使用默认应用
                            this.apps = this.getDefaultApps();
                        }
                    },
                    
                    // 获取默认应用列表
                    getDefaultApps() {
                        return [
                            {
                                id: 'app1',
                                name: '示例应用 1',
                                description: '这是一个示例应用',
                                icon: '📱',
                                path: 'apps/app1.html'
                            },
                            {
                                id: 'app2',
                                name: '示例应用 2',
                                description: '这是另一个示例应用',
                                icon: '🎯',
                                path: 'apps/app2.html'
                            }
                        ];
                    },
                    
                    // 打开应用
                    openApp(app) {
                        this.selectedApp = app;
                        this.showAppContainer = true;
                        // 禁止页面滚动
                        document.body.style.overflow = 'hidden';
                        // 确保移除关闭动画类，以便重新显示打开动画
                        this.$nextTick(() => {
                            const appContainer = this.$refs.appContainer;
                            if (appContainer) {
                                appContainer.classList.remove('closing');
                            }
                            // 初始化与iframe的通信
                            this.initIframeCommunication();
                        });
                    },
                    
                    // 初始化与iframe的通信
                    initIframeCommunication() {
                        const iframe = this.$refs.appIframe;
                        if (!iframe) return;
                        
                        // 监听来自iframe的消息
                        window.addEventListener('message', this.handleIframeMessage);
                        
                        // 发送初始消息，通知应用它在标准容器内
                        if (iframe.contentWindow) {
                            // 立即发送消息
                            iframe.contentWindow.postMessage({
                                type: 'app-container-init'
                            }, '*');
                            // 延迟再次发送，确保应用已经加载完成
                            setTimeout(() => {
                                iframe.contentWindow.postMessage({
                                    type: 'app-container-init'
                                }, '*');
                            }, 100);
                        }
                    },
                    
                    // 处理来自iframe的消息
                    handleIframeMessage(event) {
                        const data = event.data;
                        if (!data || typeof data !== 'object') return;
                        
                        switch (data.type) {
                            case 'set-app-name':
                                // 设置应用名
                                if (data.name) {
                                    this.selectedApp.name = data.name;
                                } else if (data.data && data.data.appName) {
                                    this.selectedApp.name = data.data.appName;
                                }
                                break;
                            case 'menu-action':
                                // 处理菜单操作
                                this.handleMenuAction(data.data);
                                break;
                            default:
                                break;
                        }
                    },
                    
                    // 处理菜单操作
                    handleMenuAction(action) {
                        switch (action) {
                            case 'toggle-menu':
                                this.toggleMenu();
                                break;
                            case 'close-menu':
                                this.closeMenu();
                                break;
                            default:
                                break;
                        }
                    },
                    
                    // 关闭应用
                    closeApp() {
                        // 移除消息监听器
                        window.removeEventListener('message', this.handleIframeMessage);
                        
                        // 添加关闭动画类
                        const appContainer = document.querySelector('.app-container');
                        if (appContainer) {
                            appContainer.classList.add('closing');
                            // 等待动画结束后再隐藏
                            setTimeout(() => {
                                this.showAppContainer = false;
                                this.selectedApp = null;
                                this.showMenu = false;
                                // 恢复页面滚动
                                document.body.style.overflow = '';
                            }, 300);
                        } else {
                            // 如果找不到容器，直接关闭
                            this.showAppContainer = false;
                            this.selectedApp = null;
                            this.showMenu = false;
                            document.body.style.overflow = '';
                        }
                    },
                    
                    // 切换菜单显示状态
                    toggleMenu() {
                        this.showMenu = !this.showMenu;
                        // 向iframe发送菜单点击消息
                        const iframe = this.$refs.appIframe;
                        if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'menu-click'
                            }, '*');
                        }
                    },
                    
                    // 关闭菜单
                    closeMenu() {
                        this.showMenu = false;
                    }
                },
                template: `
                    <div class="apps-container">
                        <div class="apps-grid">
                            <div 
                                v-for="app in apps" 
                                :key="app.id"
                                class="app-card"
                                @click="openApp(app)"
                            >
                                <div class="app-icon">
                                    <template v-if="app.icon && app.icon.startsWith('<svg')">
                                        <div v-html="app.icon"></div>
                                    </template>
                                    <template v-else-if="app.icon && app.icon.startsWith('svg:')">
                                        <div v-html="app.svgContent"></div>
                                    </template>
                                    <template v-else>
                                        {{ app.icon }}
                                    </template>
                                </div>
                                <div class="app-name">{{ app.name }}</div>
                            </div>
                        </div>
                        
                        <!-- 应用容器 -->
                        <div v-if="showAppContainer" class="app-container" ref="appContainer" @click="closeApp">
                            <div class="app-header" @click.stop>
                                <div class="app-header-left">
                                    <button class="menu-button" @click="toggleMenu()">☰</button>
                                    <h2>{{ selectedApp?.name }}</h2>
                                </div>
                                <button class="close-button" @click="closeApp">×</button>
                            </div>
                            <!-- 应用菜单 -->
                            <div v-if="showMenu" class="app-menu" @click.stop>
                                <div class="app-menu-content">
                                    <div class="app-menu-item" @click="closeMenu">关闭菜单</div>
                                    <!-- 这里可以添加更多菜单项 -->
                                </div>
                            </div>
                            <div class="app-content" @click.stop>
                                <iframe 
                                    :src="selectedApp?.path" 
                                    frameborder="0"
                                    width="100%"
                                    height="100%"
                                    data-app-container="true"
                                    ref="appIframe"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                `
            });

            // 挂载 Vue 应用
            this.vueApp = appsApp.mount(container);
        }
    };
}

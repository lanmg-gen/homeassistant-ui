/**
 * 应用页面 - 桌面端逻辑
 */

// 避免重复声明
if (!window.AppsPageDesktop) {
    window.AppsPageDesktop = {
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
                        showAppContainer: false
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
                                        return {
                                            id: app.name,
                                            path: appPath + '/index.html',
                                            name: appConfig.app?.name || app.name,
                                            icon: appConfig.app?.icon || '📱'
                                        };
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
                            },
                            {
                                id: 'app3',
                                name: '示例应用 3',
                                description: '这是第三个示例应用',
                                icon: '📊',
                                path: 'apps/app3.html'
                            }
                        ];
                    },
                    
                    // 打开应用
                    openApp(app) {
                        this.selectedApp = app;
                        this.showAppContainer = true;
                        // 禁止页面滚动
                        document.body.style.overflow = 'hidden';
                    },
                    
                    // 关闭应用
                    closeApp() {
                        this.showAppContainer = false;
                        this.selectedApp = null;
                        // 恢复页面滚动
                        document.body.style.overflow = '';
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
                                <div class="app-card-content">
                                    <div class="app-icon">{{ app.icon }}</div>
                                    <div class="app-name">{{ app.name }}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 应用容器 -->
                        <div v-if="showAppContainer" class="app-container">
                            <div class="app-header">
                                <h2>{{ selectedApp?.name }}</h2>
                                <button class="close-button" @click="closeApp">×</button>
                            </div>
                            <div class="app-content">
                                <iframe 
                                    :src="selectedApp?.path" 
                                    frameborder="0"
                                    width="100%"
                                    height="100%"
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

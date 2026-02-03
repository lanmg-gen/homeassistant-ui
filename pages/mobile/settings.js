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

            const container = document.getElementById('settingsCardsContainer');
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
                            { name: '数据同步', icon: '🔄', description: '云端同步设置', type: 'sync' },
                            { name: '关于', icon: 'ℹ️', description: '版本信息和帮助', type: 'about' }
                        ],
                        // 弹出卡片状态
                        showPopup: false,
                        popupTitle: '',
                        popupDescription: '',
                        popupIcon: '',
                        currentPopupType: '',
                        // 主题选择
                        selectedTheme: 'default'
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
                    }
                },
                mounted() {
                    // 初始化选中主题为当前主题
                    this.selectedTheme = this.currentTheme.id;
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
                        }
                    },

                    // 关闭弹出卡片
                    closePopup() {
                        this.showPopup = false;
                        this.currentPopupType = '';
                    },

                    // 处理弹出卡片按钮点击
                    handlePopupAction(action) {
                        if (action === 'apply') {
                            // 根据当前弹出类型执行不同的应用操作
                            switch (this.currentPopupType) {
                                case 'general':
                                    // 应用主题设置
                                    if (window.setBackgroundTheme) {
                                        window.setBackgroundTheme(this.selectedTheme);
                                        // 重新加载背景
                                        if (window.loadBackgroundTheme) {
                                            window.loadBackgroundTheme();
                                        }
                                    }
                                    break;
                                case 'notification':
                                case 'privacy':
                                case 'sync':
                                    // 其他设置类型可以在这里添加具体逻辑
                                    break;
                                // 'about' 和 'network' 类型没有应用操作
                            }
                            
                            // 显示提示
                            if (window.showToast) {
                                window.showToast(`已应用: ${this.popupTitle}`);
                            }
                        }
                        this.closePopup();
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
                    }
                },
                template: `
                    <div class="settings-grid">
                        <card-1x1
                            v-for="(card, index) in settingsCards"
                            :key="index"
                            :name="card.name"
                            :icon="card.icon"
                            stateentity="settings.dummy"
                            devicetype="switch"
                            layouttype="default"
                            :hasdetailpage="false"
                            @click="handleSettingsClick(card)"
                        ></card-1x1>
                    </div>
                    <!-- 弹出卡片 -->
                    <card-popup
                        v-model="showPopup"
                        :title="popupTitle"
                        @close="closePopup"
                    >
                        <div class="settings-popup">
                            <div style="font-size: 48px; margin-bottom: 16px;">{{ popupIcon }}</div>
                            <h3>{{ popupTitle }}</h3>
                            <p>{{ popupDescription }}</p>
                            
                            <!-- 根据弹出类型显示不同内容 -->
                            <div v-if="currentPopupType === 'general'" class="popup-content">
                                <div class="setting-item">
                                    <label>背景主题</label>
                                    <select v-model="selectedTheme" class="theme-select">
                                        <option v-for="theme in themeOptions" :key="theme.id" :value="theme.id">
                                            {{ theme.name }}
                                        </option>
                                    </select>
                                </div>
                                <div class="popup-buttons">
                                    <button class="popup-button" @click="handlePopupAction('apply')">应用</button>
                                    <button class="popup-button" @click="handlePopupAction('cancel')">取消</button>
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
                                        <span class="info-value">{{ getHAConfigInfo()?.enabled || '未知' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">连接超时：</span>
                                        <span class="info-value">{{ getHAConfigInfo()?.connectionTimeout }}ms</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">重连间隔：</span>
                                        <span class="info-value">{{ getHAConfigInfo()?.reconnectInterval }}ms</span>
                                    </div>
                                </div>
                                <div class="popup-buttons">
                                    <button class="popup-button" @click="closePopup">关闭</button>
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
                                <div class="popup-buttons">
                                    <button class="popup-button" @click="closePopup">关闭</button>
                                </div>
                            </div>
                            
                            <div v-else class="popup-content">
                                <!-- 其他设置类型的默认内容 -->
                                <div class="popup-buttons">
                                    <button class="popup-button" @click="handlePopupAction('apply')">应用</button>
                                    <button class="popup-button" @click="handlePopupAction('cancel')">取消</button>
                                </div>
                            </div>
                        </div>
                    </card-popup>
                `
            });

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

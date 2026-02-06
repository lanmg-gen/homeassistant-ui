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
                            { name: '清空缓存', icon: '🗑️', description: '清除缓存并刷新页面', type: 'clearCache' },
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
                        }
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
                        }
                    },

                    // 清空缓存并刷新页面
                    clearCacheAndReload() {
                        // 1. 清理 localStorage
                        localStorage.clear();

                        // 2. 清理 Service Worker 缓存
                        if ('caches' in window) {
                            caches.keys().then(names => {
                                names.forEach(name => caches.delete(name));
                            });
                        }

                        // 3. 注销 Service Worker
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistrations().then(registrations => {
                                registrations.forEach(registration => registration.unregister());
                            });
                        }

                        // 4. 显示提示
                        if (window.vant && window.vant.Toast) {
                            window.vant.Toast.success('缓存已清空,即将刷新...');
                        }

                        // 5. 延迟后强制刷新页面
                        setTimeout(() => {
                            location.reload(true);
                        }, 1000);
                    },

                    // 关闭弹出卡片
                    closePopup() {
                        this.showPopup = false;
                        this.currentPopupType = '';
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
                    
                    // 应用主题
                    applyTheme(themeId) {
                        if (window.setBackgroundTheme) {
                            window.setBackgroundTheme(themeId);
                            // 立即加载并应用背景主题
                            if (window.loadBackgroundTheme) {
                                window.loadBackgroundTheme();
                            }
                            // 保存主题设置
                            localStorage.setItem('selectedTheme', themeId);

                    // 自动同步到 HA
                    if (window.HASettingsSync) {
                        const themeNumericId = window.HASettingsSync.themeIdMap[themeId] ?? 0;
                        window.HASettingsSync.autoSync({ th: themeNumericId });
                    }

                            // 显示成功提示
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.success('主题已应用');
                            }
                        }
                    },
                    
                    // 获取当前主题名称
                    getCurrentThemeName() {
                        const theme = this.themeOptions.find(t => t.id === this.selectedTheme);
                        return theme ? theme.name : '默认渐变';
                    },
                    
                    // 选择主题
                    selectTheme(themeId) {
                        this.selectedTheme = themeId;
                        this.showThemeDropdown = false;
                        this.applyTheme(themeId);
                    },
                    
                    // 检查下拉框是否需要向上展开
                    checkDropdownPosition(element) {
                        if (!element) return false;
                        const rect = element.getBoundingClientRect();
                        const dropdownHeight = 200; // 预估下拉框高度
                        const viewportHeight = window.innerHeight;
                        const spaceBelow = viewportHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        
                        return spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
                    },
                    
                    // 获取下拉框样式
                    getDropdownStyle(element) {
                        if (!this.checkDropdownPosition(element)) {
                            return {};
                        }
                        
                        // 如果需要向上展开
                        const rect = element.getBoundingClientRect();
                        const dropdownHeight = 200; // 预估下拉框高度
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
                    },
                    
                    // 切换主题下拉框
                    toggleThemeDropdown() {
                        this.showThemeDropdown = !this.showThemeDropdown;
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


                },
                template: `
                    <div class="settings-grid">
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

                            <div v-else-if="currentPopupType === 'clearCache'" class="popup-content">
                                <div class="cache-clear-content">
                                    <p style="text-align: center; color: rgba(255, 255, 255, 0.8); margin-bottom: 24px;">
                                        清空缓存将清除所有本地存储的数据并刷新页面。<br>
                                        此操作不会删除您的设备配置。
                                    </p>
                                    <button class="clear-cache-btn" @click="clearCacheAndReload">
                                        <span class="btn-icon">🗑️</span>
                                        <span class="btn-text">确认清空缓存</span>
                                    </button>
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
                    top: 100%;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    margin-top: 8px;
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    backdrop-filter: blur(15px);
                    overflow: hidden;
                    animation: dropdownFadeIn 0.2s ease;
                }
                
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
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
                    margin-bottom: 20px;
                }

                .setting-item label {
                    display: block;
                    color: white;
                    font-weight: 500;
                    margin-bottom: 8px;
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

/**
 * 场景 - 移动端逻辑
 */

// 避免重复声明
if (!window.ScenesPage) {
    window.ScenesPage = {
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

            const container = document.getElementById('scenesCardsContainer');
            if (!container) {
                return;
            }

            // 创建一个新的 Vue 应用实例专门用于 scenes 页面
            const scenesApp = Vue.createApp({
                data() {
                    return {
                        // 场景卡片数据
                        scenesCards: [
                            { name: '回家模式', icon: '🌅', description: '开启常用设备' },
                            { name: '离家模式', icon: '🌙', description: '关闭所有设备' },
                            { name: '影院模式', icon: '🎬', description: '调暗灯光，开启电视' },
                            { name: '音乐模式', icon: '🎵', description: '播放背景音乐' },
                            { name: '阅读模式', icon: '📚', description: '柔和灯光' },
                            { name: '睡眠模式', icon: '😴', description: '关闭所有灯光' }
                        ],
                        // 弹出卡片状态
                        showPopup: false,
                        popupTitle: '',
                        popupDescription: '',
                        popupIcon: ''
                    };
                },
                methods: {
                    // 处理场景卡片点击
                    handleSceneClick(card) {
                        this.popupTitle = card.name;
                        this.popupIcon = card.icon;
                        this.popupDescription = card.description;
                        this.showPopup = true;
                    },

                    // 关闭弹出卡片
                    closePopup() {
                        this.showPopup = false;
                    },

                    // 激活场景
                    activateScene() {
                        // 这里可以添加具体的场景激活逻辑
                        // 显示提示
                        if (window.showToast) {
                            window.showToast(`已激活: ${this.popupTitle}`);
                        }
                        this.closePopup();
                    }
                },
                template: `
                    <div class="scenes-grid">
                        <card-1x1
                            v-for="(card, index) in scenesCards"
                            :key="index"
                            :name="card.name"
                            :icon="card.icon"
                            stateentity="scenes.dummy"
                            devicetype="switch"
                            layouttype="default"
                            :hasdetailpage="false"
                            @click="handleSceneClick(card)"
                        ></card-1x1>
                    </div>
                    <!-- 弹出卡片 -->
                    <card-popup
                        v-model="showPopup"
                        :title="popupTitle"
                        @close="closePopup"
                    >
                        <div class="scenes-popup">
                            <div style="font-size: 48px; margin-bottom: 16px;">{{ popupIcon }}</div>
                            <h3>{{ popupTitle }}</h3>
                            <p>{{ popupDescription }}</p>
                            <div class="popup-buttons">
                                <button class="popup-button" @click="closePopup">取消</button>
                                <button class="popup-button popup-button-activate" @click="activateScene">激活场景</button>
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
                        scenesApp.component(card.tag, Component);
                    }
                });
            } else {
                // 后备方案：直接注册
                if (window.Card1x1Component) {
                    scenesApp.component('card-1x1', window.Card1x1Component);
                }
                if (window.CardPopupComponent) {
                    scenesApp.component('card-popup', window.CardPopupComponent);
                }
            }

            // 挂载应用
            scenesApp.mount(container);
            this.vueApp = scenesApp;
        }
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ScenesPage.init();
        });
    } else {
        window.ScenesPage.init();
    }
}

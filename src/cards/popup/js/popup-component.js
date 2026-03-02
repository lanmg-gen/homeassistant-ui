/**
 * 弹出卡片 Vue 组件
 * 文件：cards/popup/js/popup-component.js
 *
 * 用途：在智能家居控制面板中提供弹层/对话框，风格与 1x1、1x2 设备卡片一致。
 *
 * 功能概要：
 * - 使用 Vue 3 Teleport 挂载到 body，避免被父级裁剪或 z-index 遮挡
 * - 通过 v-model 绑定布尔值控制显示/隐藏
 * - 标题栏支持自定义标题与关闭按钮显隐
 * - 默认插槽用于放置弹层正文内容
 * - 支持点击遮罩关闭（可配置关闭）
 *
 * 使用示例：
 *   <card-popup v-model="showPopup" title="设备详情" @close="onClose">
 *       <p>这里是弹层内容</p>
 *   </card-popup>
 *
 * 依赖：Vue 3.x（需在引入本脚本前加载 vue.global.js）
 */

const CardPopupComponent = {
    name: 'CardPopup',

    // ==================== 自定义事件声明 ====================
    emits: ['close', 'update:modelValue', 'ac-control'],

    // ==================== 组件属性（Props） ====================
    props: {
        /**
         * 是否显示弹层。
         * 与 v-model 双向绑定：父组件用 v-model="xxx" 即可控制显隐。
         */
        modelValue: {
            type: Boolean,
            default: false
        },
        /**
         * 弹层标题，显示在顶部标题栏左侧。
         */
        title: {
            type: String,
            default: '提示'
        },
        /**
         * 是否在标题栏右侧显示关闭按钮。
         * 为 false 时仍可通过点击遮罩关闭（若 closeOnMask 为 true）。
         */
        showClose: {
            type: Boolean,
            default: true
        },
        /**
         * 是否在标题栏右侧显示确定按钮（在关闭按钮左侧）。
         */
        showConfirm: {
            type: Boolean,
            default: false
        },
        /**
         * 确定按钮点击事件回调。
         */
        onConfirm: {
            type: Function,
            default: null
        },
        /**
         * 点击遮罩（蒙层）时是否关闭弹层。
         * 为 true 时点击弹层外部会关闭；点击弹层内部不会关闭（已阻止冒泡）。
         */
        closeOnMask: {
            type: Boolean,
            default: true
        },
        /**
         * 自定义卡片类名，用于特殊样式（如大尺寸URL显示）
         */
        cardClass: {
            type: String,
            default: ''
        },
        /**
         * 点击位置（用于动画起始点），格式：{ x: number, y: number }
         */
        clickOrigin: {
            type: Object,
            default: null
        }
    },

    // ==================== 组件内部数据 ====================
    data() {
        return {
            isClosing: false
        };
    },

    // ==================== 组件方法 ====================
    methods: {
        /**
         * 确定按钮点击处理。
         * 如果有 onConfirm 回调则调用，然后关闭弹层。
         */
        handleConfirm() {
            if (typeof this.onConfirm === 'function') {
                this.onConfirm();
            }
            this.close();
        },
        /**
         * 关闭弹层。
         * 将 visible 设为 false（会触发 update:modelValue），并发出 close 事件。
         */
        close() {
            this.isClosing = true;
            // 等待动画完成后关闭
            setTimeout(() => {
                this.$emit('update:modelValue', false);
                this.isClosing = false;
                this.$emit('close');
            }, 300);
        },

        /**
         * 获取卡片样式
         */
        getCardStyle() {
            return {};
        },

        /**
         * 遮罩层点击处理。
         * 仅当 closeOnMask 为 true 且点击目标就是遮罩自身（非子元素）时才关闭，
         * 避免点击到卡片内部时误关。
         */
        onMaskClick(e) {
            if (this.closeOnMask && e.target === e.currentTarget) {
                this.close();
            }
        },

        /**
         * 弹层卡片区域点击处理。
         * 阻止事件冒泡到遮罩，避免点击卡片内容时触发遮罩的关闭逻辑。
         */
        onCardClick(e) {
            e.stopPropagation();
        }
    },

    // ==================== 模板 ====================
    template: `
        <Teleport to="body">
            <div
                v-if="modelValue"
                class="popup-card-mask"
                :class="{ 'closing': isClosing }"
                @click="onMaskClick"
            >
                <div
                    ref="cardRef"
                    :class="['popup-card', cardClass, { 'closing': isClosing }]"
                    :style="getCardStyle()"
                    @click="onCardClick"
                >
                    <div class="popup-card__header">
                        <h2 class="popup-card__title">{{ title }}</h2>
                    <div class="popup-card__header-buttons">
                        <button
                            v-if="showConfirm"
                            type="button"
                            class="popup-card__confirm"
                            aria-label="确定"
                            @click="handleConfirm"
                        >✓</button>
                        <button
                            v-if="showClose"
                            type="button"
                            class="popup-card__close"
                            aria-label="关闭"
                            @click="close"
                        ></button>
                    </div>
                    </div>
                    <div class="popup-card__body" v-bind="$attrs">
                        <slot></slot>
                    </div>
                </div>
            </div>
        </Teleport>
    `
};

// ==================== 导出 ====================
// 支持 CommonJS 环境（如 Node / 打包工具）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardPopupComponent;
}
// 挂载到全局，供入口页或各页面 Vue 应用注册使用（如 home.js 中的 card-popup）
window.CardPopupComponent = CardPopupComponent;

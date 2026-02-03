/**
 * 1x1卡片Vue组件
 * 用于智能家居设备控制面板
 *
 * 功能特性:
 * - 显示设备图标、名称和状态
 * - 支持点击切换设备状态
 * - 支持两种布局模式：default（默认）和icon-only（仅图标）
 * - 支持详细页面入口（右上角切角标记）
 * - 自动响应容器尺寸，适配不同屏幕
 * - 优化触摸屏交互（禁用文本选择）
 */

const Card1x1Component = {
    name: 'Card1x1',

    // ==================== 组件属性 ====================
    props: {
        // 设备名称
        name: {
            type: String,
            default: '设备名称'
        },
        // 设备图标（emoji或SVG）
        icon: {
            type: String,
            default: '📱'
        },
        // 设备状态实体ID（必需）
        stateentity: {
            type: String,
            required: true
        },
        // 控制实体ID（可选，默认使用stateentity）
        controlEntity: {
            type: String,
            default: ''
        },
        // 设备类型：light（灯）、switch（开关）等
        devicetype: {
            type: String,
            default: 'switch'
        },
        // 布局类型：default（默认，显示名称和状态）、icon-only（仅显示图标）
        layouttype: {
            type: String,
            default: 'default',
            validator: (value) => ['default', 'icon-only'].includes(value)
        },
        // 设备描述（当前未使用，保留用于未来扩展）
        description: {
            type: String,
            default: ''
        },
        // 卡片跨列数（当前未使用，保留用于未来扩展）
        span: {
            type: Number,
            default: 1
        },
        // 是否有详细页面：true/false/'true'/''（空字符串表示有）
        hasdetailpage: {
            type: [Boolean, String],
            default: false
        },
        // 电源实体ID（用于3D打印机等设备的电源控制）
        powerentity: {
            type: String,
            default: ''
        },
        // 控制URL（用于3D打印机等设备的控制面板）
        controlurl: {
            type: String,
            default: ''
        },
        // 冰箱冷藏传感器ID
        fridgesensor: {
            type: String,
            default: ''
        },
        // 冰箱冷冻传感器ID
        freezersensor: {
            type: String,
            default: ''
        }
    },

    // ==================== 数据状态 ====================
    data() {
        return {
            state: 'off',        // 设备状态：on/off/unavailable
            loading: false,       // 加载状态
            acTemperature: '--',  // 空调温度
            acHumidity: '--',     // 空调湿度
            fridgeTemp: '--',     // 冰箱冷藏温度
            freezerTemp: '--',    // 冰箱冷冻温度
            unsubscribe: null     // 状态订阅取消函数
        };
    },

    // ==================== 计算属性 ====================
    computed: {
        // 是否为空调设备
        isACDevice() {
            return this.devicetype === 'climate';
        },

        // 是否为冰箱设备（需要显示两个温度）
        isFridgeDevice() {
            return this.devicetype === 'display' && this.name.includes('冰箱');
        },

        // 是否为设置卡片（没有真实实体，不需要显示状态）
        isSettingsCard() {
            return this.stateentity && this.stateentity.startsWith('settings.');
        },

        // 状态类名：根据设备状态和加载状态返回对应的CSS类
        statusClass() {
            return {
                'on': this.state === 'on' || (this.devicetype === 'vacuum' && ['cleaning', 'returning'].includes(this.state)),
                'off': this.state === 'off' || (this.devicetype === 'vacuum' && ['docked', 'idle', 'paused'].includes(this.state)) || this.devicetype === 'feeder',
                'unavailable': this.state === 'unavailable' || this.state === 'error',
                'loading': this.loading
            };
        },

        // 状态文本：将设备状态转换为中文显示
        statusText() {
            // 对于设置卡片，不显示状态文本
            if (this.isSettingsCard) return '';

            if (this.loading) return '加载中...';

            // 冰箱设备特殊处理：显示冷藏和冷冻温度
            if (this.isFridgeDevice) {
                const fridgeDisplay = this.fridgeTemp !== '--' ? `${this.fridgeTemp}℃` : '--';
                const freezerDisplay = this.freezerTemp !== '--' ? `${this.freezerTemp}℃` : '--';
                return `冷藏:${fridgeDisplay} 冷冻:${freezerDisplay}`;
            }

            // 空调设备特殊处理：显示温度和状态
            if (this.isACDevice) {
                const tempDisplay = this.acTemperature !== '--' ? `${this.acTemperature}℃` : '--';
                const humidityDisplay = this.acHumidity !== '--' ? `${this.acHumidity}%` : '';

                // 构造状态文本
                if (this.state === 'off') {
                    return '已关闭';
                } else if (this.state === 'cooling') {
                    return `${tempDisplay} ${humidityDisplay}`;
                } else if (this.state === 'heating') {
                    return `${tempDisplay} ${humidityDisplay}`;
                } else if (this.state === 'fan_only') {
                    return `${tempDisplay} 送风`;
                } else if (this.state === 'dry') {
                    return `${tempDisplay} 干燥`;
                } else if (this.state === 'idle') {
                    return `${tempDisplay} 待机`;
                }
                return tempDisplay;
            }

            // 宠物投喂器特殊状态处理
            if (this.devicetype === 'feeder') {
                return `${this.state}次`;
            }

            // 扫地机器人特殊状态处理
            if (this.devicetype === 'vacuum') {
                const vacuumStates = {
                    'cleaning': '清扫中',
                    'returning': '返回中',
                    'docked': '已回充',
                    'idle': '待机',
                    'paused': '已暂停',
                    'error': '错误'
                };
                return vacuumStates[this.state] || '未知';
            }

            // 普通开关设备状态
            switch (this.state) {
                case 'on':
                    return '已开启';
                case 'off':
                    return '已关闭';
                case 'unavailable':
                    return '不可用';
                default:
                    return '未知';
            }
        },

        // 卡片类名：基础类名 + 布局类型 + 详细页面标记
        cardClass() {
            let result = `card-1x1 card-1x1--${this.layouttype}`;
            // 判断是否添加详细页面切角标记
            if (this.hasdetailpage === true || this.hasdetailpage === 'true' || this.hasdetailpage === '') {
                result += ' has-detail-page';
            }
            return result;
        }
    },

        // ==================== 生命周期钩子 ====================
    mounted() {
        // 对于设置卡片，不需要加载状态
        if (this.isSettingsCard) {
            this.state = 'off';
            return;
        }

        if (!this.stateentity) return;

        // 使用状态管理器订阅状态更新
        if (window.DeviceStateManager) {
            this.loading = true;
            this.unsubscribe = window.DeviceStateManager.subscribe(
                this.stateentity,
                (state) => {
                    this.state = state;
                    this.loading = false;
                },
                { priority: 'normal' }
            );
        }

        // 订阅 WebSocket 实时推送
        if (window.WebSocketManager && window.WebSocketManager.isConnected) {
            window.WebSocketManager.subscribeEntities([this.stateentity]);
        }
    },

    beforeUnmount() {
        // 取消状态订阅
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    },

    // ==================== 方法定义 ====================
    methods: {


        // 处理卡片点击：切换设备开关状态
        async handleClick() {
            if (this.loading) return;

            // 对于URL类型设备（如3D打印机），点击卡片主体时打开URL弹出
            if (this.devicetype === 'url') {
                // 先检查电源状态，只有开启时才允许弹出URL
                if (this.powerentity && window.haConnection) {
                    try {
                        const powerState = await window.haConnection.getDeviceState(this.powerentity);

                        if (powerState !== 'on') {
                            // 电源关闭，显示提示不弹出
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.fail('打印机电源已关闭，请先开启电源');
                            } else {
                                alert('打印机电源已关闭，请先开启电源');
                            }
                            return;
                        }
                    } catch (error) {
                        console.error('[1x1卡片] 获取电源状态失败:', error);
                        // 获取失败时允许弹出，避免阻塞用户
                    }
                }

                // 电源开启或没有配置电源实体，正常弹出URL
                this.$emit('open-detail', {
                    name: this.name,
                    icon: this.icon,
                    stateEntity: this.stateentity,
                    deviceType: this.devicetype,
                    action: 'show_url',
                    controlUrl: this.controlurl,
                    powerEntity: this.powerentity
                });
                return;
            }

            // 对于其他设备，执行正常控制
            try {
                this.loading = true;

                // 调用全局方法处理设备点击
                if (window.app && window.app.handleDeviceClick) {
                    const device = {
                        name: this.name,
                        icon: this.icon,
                        stateEntity: this.stateentity,
                        controlEntity: this.controlEntity || this.stateentity,
                        deviceType: this.devicetype,

                    };

                    await window.app.handleDeviceClick(device);
                }
            } catch (error) {
                console.error('控制设备失败:', error);
                // 显示错误提示
                if (window.vant && window.vant.Toast) {
                    window.vant.Toast.fail('操作失败');
                }
            } finally {
                this.loading = false;
                // 延迟重新加载状态，等待设备响应
                setTimeout(() => this.loadDeviceState(), 300);
            }
        },

        // 切换设备状态（当前未使用，保留用于未来扩展）
        async toggleState() {
            if (this.devicetype === 'light' || this.devicetype === 'switch') {
                const newState = this.state === 'on' ? 'off' : 'on';
                if (window.app && window.app.callService) {
                    await window.app.callService(
                        this.devicetype,
                        newState === 'on' ? 'turn_on' : 'turn_off',
                        { entity_id: this.controlEntity || this.stateentity }
                    );
                }
            }
        },

        // 处理详情页切角点击：阻止冒泡并触发打开详情事件
        handleDetailCornerClick(event) {
            // 阻止事件冒泡，避免触发卡片点击
            event.stopPropagation();

            // 对于URL类型设备（如3D打印机），点击切角弹出电源控制
            if (this.devicetype === 'url') {
                const emitData = {
                    name: this.name,
                    icon: this.icon,
                    stateEntity: this.stateentity,
                    deviceType: this.devicetype,
                    action: 'control_power',
                    powerEntity: this.powerentity
                };
                this.$emit('open-detail', emitData);
            } else {
                // 对于其他设备（如空调），弹出详细控制
                this.$emit('open-detail', {
                    name: this.name,
                    icon: this.icon,
                    stateEntity: this.stateentity,
                    deviceType: this.devicetype,
                    action: 'detail'
                });
            }
        },

        // 查找设备配置
        findDeviceConfig() {
            if (!window.DEVICE_CARDS) return null;
            
            // 根据卡片名称查找对应的设备配置
            return window.DEVICE_CARDS.find(device => {
                // 这里简化处理，实际应用中可能需要更复杂的匹配逻辑
                return device.name === this.name;
            }) || null;
        }
    },

    // ==================== 模板 ====================
    template: `
        <div :class="[cardClass, { 'on': state === 'on' }]" @click="handleClick">
            <!-- 设备图标 -->
            <div class="card-1x1__icon">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="card-1x1__icon-svg">
                    <text x="50" y="50" font-size="70" text-anchor="middle" dominant-baseline="middle">{{ icon }}</text>
                </svg>
            </div>
            <!-- 设备信息（名称和状态） -->
            <div class="card-1x1__content">
                <div class="card-1x1__name">{{ name }}</div>
                <div v-if="!isSettingsCard" class="card-1x1__status" :class="statusClass">
                    {{ statusText }}
                </div>
            </div>
            <!-- 详细页面切角标记（通过CSS样式显示） -->
            <div v-if="hasdetailpage" @click.stop="handleDetailCornerClick"></div>
        </div>
    `
};

// ==================== 组件导出 ====================
// 支持CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Card1x1Component;
}

// 导出到全局对象，供外部Vue应用直接使用
window.Card1x1Component = Card1x1Component;

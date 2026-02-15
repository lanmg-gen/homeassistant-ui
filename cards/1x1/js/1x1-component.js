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
        },
        // 自定义属性对象，用于传递额外的设备特定配置
        customProps: {
            type: Object,
            default: () => ({})
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
            timerAttributes: null, // 计时器实体属性（仅计时器实体使用）
            timerUnregisterFn: null, // 全局定时器注销函数（仅计时器实体使用）
            currentTime: Date.now(), // 当前时间戳（用于计时器倒计时响应式更新）
            controlEntityState: 'off' // 控制实体状态（用于计时器实体关联的灯状态）
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
            return this.devicetype === 'fridge';
        },

        // 是否为设置类型（不走设备控制流程）
        isSettingsType() {
            return this.devicetype === 'settings';
        },

        // 是否为设置卡片（没有真实实体，不需要显示状态）
        isSettingsCard() {
            return this.devicetype === 'settings' || (this.stateentity && this.stateentity.startsWith('settings.'));
        },

        // 是否为计时器实体
        isTimerEntity() {
            return this.stateentity && this.stateentity.startsWith('timer.');
        },

        // 计时器剩余时间（响应式计算，依赖currentTime）
        timerRemainingTime() {
            if (!this.isTimerEntity || this.state !== 'active' || !this.timerAttributes) {
                return null;
            }

            // 方法1: 如果有finishes_at时间戳，计算实时剩余时间
            if (this.timerAttributes.finishes_at) {
                try {
                    const finishesAt = new Date(this.timerAttributes.finishes_at);
                    const now = new Date(this.currentTime);
                    const diffMs = finishesAt.getTime() - now.getTime();

                    if (diffMs > 0) {
                        const totalSeconds = Math.floor(diffMs / 1000);
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;
                        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    } else {
                        return '00:00';
                    }
                } catch (error) {
                    // finishes_at解析错误
                }
            }

            // 方法2: 如果finishes_at无效，尝试remaining字段
            if (this.timerAttributes.remaining) {
                const remaining = this.timerAttributes.remaining;
                if (typeof remaining === 'string' && remaining.includes(':')) {
                    const parts = remaining.split(':');
                    if (parts.length === 3) {
                        const hours = parseInt(parts[0]) || 0;
                        const minutes = parseInt(parts[1]) || 0;
                        const seconds = parseInt(parts[2]) || 0;
                        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                        const dispMinutes = Math.floor(totalSeconds / 60);
                        const dispSeconds = totalSeconds % 60;
                        return `${dispMinutes.toString().padStart(2, '0')}:${dispSeconds.toString().padStart(2, '0')}`;
                    }
                }
            }

            return null;
        },

        // 状态类名：根据设备状态和加载状态返回对应的CSS类
        statusClass() {
            return {
                'on': this.state === 'on' || (this.devicetype === 'vacuum' && ['cleaning', 'returning'].includes(this.state)) || (this.isTimerEntity && this.controlEntityState === 'on'),
                'off': this.state === 'off' || (this.devicetype === 'vacuum' && ['docked', 'idle', 'paused'].includes(this.state)) || (this.isTimerEntity && this.controlEntityState === 'off'),
                'unavailable': this.state === 'unavailable' || this.state === 'error',
                'loading': this.loading
            };
        },

        // 状态文本：将设备状态转换为中文显示
        statusText() {
            // 对于设置卡片，不显示状态文本
            if (this.isSettingsCard) return '';

            if (this.loading) return '加载中...';

            // 计时器实体特殊处理：根据控制实体（灯）状态显示
            if (this.isTimerEntity) {
                // 如果控制实体（灯）关闭，显示"已关闭"
                if (this.controlEntityState === 'off') {
                    return '已关闭';
                }
                // 如果控制实体（灯）开启，显示计时器倒计时
                if (this.controlEntityState === 'on' && this.timerAttributes) {
                    const remainingTime = this.timerRemainingTime;
                    if (remainingTime) {
                        return remainingTime;
                    }
                    return '运行中';
                }
                return '已关闭';
            }

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
                // 投喂器状态是计数器的值，直接显示数字+次
                // 现在 state 应该是正确的计数值，但如果还是异常值则显示--
                const count = this.state === 'unavailable' || this.state === 'unknown' || this.state === 'idle' || this.state === 'None' ? '--' : this.state;
                return `${count}次`;
            }

            // 洗衣机特殊状态处理
            if (this.devicetype === 'washingmachine') {
                const washingMachineStates = {
                    '关机': '关机',
                    '待机中': '待机',
                    '暂停中': '暂停',
                    '工作中': '运行中',
                    '预约中': '预约'
                };
                return washingMachineStates[this.state] || this.state || '未知';
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
            this.loading = false;
            return;
        }

        if (!this.stateentity) return;

        // 1. 直接加载设备状态（确保立即有数据显示）
        this.loadDeviceState();

        // 2. 对于冰箱设备，加载冷藏和冷冻温度
        if (this.isFridgeDevice) {
            // 检查全局配置
            const globalFridgeConfig = window.DEVICE_CONFIGS ? window.DEVICE_CONFIGS.fridge : null;
            
            // 多重备选方案获取传感器ID
            let fridgeSensorId = this.customprops?.fridgeSensor || this.fridgesensor;
            let freezerSensorId = this.customprops?.freezerSensor || this.freezersensor;
            
            // 如果 customprops 为空，尝试从全局配置获取
            if ((!fridgeSensorId || !freezerSensorId) && globalFridgeConfig) {
                fridgeSensorId = globalFridgeConfig.customprops?.fridgeSensor || globalFridgeConfig.fridgesensor;
                freezerSensorId = globalFridgeConfig.customprops?.freezerSensor || globalFridgeConfig.freezersensor;
            }

            // 如果还是没有，使用硬编码的默认值（临时方案）
            if (!fridgeSensorId) {
                fridgeSensorId = 'sensor.midjd6_cn_590940698_610_temperature_p_3_1';
            }
            if (!freezerSensorId) {
                freezerSensorId = 'sensor.midjd6_cn_590940698_610_temperature_p_4_1';
            }
            this.loadFridgeTemperatures();
        }

        // 3. 启动计时器实时更新（仅计时器实体需要）
        if (this.isTimerEntity) {
            this.startTimerUpdate();
        }

        // 4. 订阅HA连接的实时更新（如果可用）
        if (window.haConnection && window.haConnection.addListener) {
            this.handleHAStateUpdate = (data) => {
                // 更新状态实体
                if (data.entityId === this.stateentity) {
                    const newState = data.state;
                    if (typeof newState === 'object' && newState !== null) {
                        this.state = newState.state || 'unavailable';
                    } else {
                        this.state = newState || 'unavailable';
                    }
                    this.loading = false;

                    // 如果是计时器实体，更新属性
                    if (this.isTimerEntity && data.attributes) {
                        this.timerAttributes = data.attributes;
                    }
                }

                // 如果是计时器实体，同时监听控制实体（灯）的状态
                if (this.isTimerEntity && this.controlEntity) {
                    const controlEntityId = this.controlEntity;
                    if (data.entityId === controlEntityId) {
                        const newState = data.state;
                        if (typeof newState === 'object' && newState !== null) {
                            this.controlEntityState = newState.state || 'off';
                        } else {
                            this.controlEntityState = newState || 'off';
                        }
                        // 计时器控制实体状态更新
                    }
                }

                    // 更新冰箱温度
                    if (this.isFridgeDevice) {
                        // 优先从 customProps 获取传感器ID，兼容旧的 fridgesensor/freezersensor props
                        const fridgeSensorId = this.customProps?.fridgeSensor || this.fridgesensor;
                        const freezerSensorId = this.customProps?.freezerSensor || this.freezersensor;
                        // HA状态更新-冰箱
                        if (data.entityId === fridgeSensorId) {
                            const tempValue = data.state;
                            if (tempValue && tempValue !== 'unavailable' && tempValue !== 'unknown') {
                                this.fridgeTemp = tempValue;
                            } else {
                                this.fridgeTemp = '--';
                            }
                        }
                        if (data.entityId === freezerSensorId) {
                            const tempValue = data.state;
                            if (tempValue && tempValue !== 'unavailable' && tempValue !== 'unknown') {
                                this.freezerTemp = tempValue;
                            } else {
                                this.freezerTemp = '--';
                            }
                        }
                    }
            };
            window.haConnection.addListener('stateUpdate', this.handleHAStateUpdate);
        }

        // 4. 订阅全局事件（作为备份，兼容其他方式派发的事件）
        this.handleStateUpdate = (event) => {
            if (event.detail) {
                // 更新状态实体（计时器）
                if (event.detail.entityId === this.stateentity) {
                    const newState = event.detail.state;
                    if (typeof newState === 'object' && newState !== null) {
                        this.state = newState.state || 'unavailable';
                    } else {
                        this.state = newState || 'unavailable';
                    }
                    this.loading = false;

                    // 如果是计时器实体，更新属性
                    if (this.isTimerEntity && event.detail.attributes) {
                        this.timerAttributes = event.detail.attributes;
                    }
                }

                // 如果是计时器实体，同时监听控制实体（灯）的状态
                if (this.isTimerEntity && this.controlEntity) {
                    const controlEntityId = this.controlEntity;
                    if (event.detail.entityId === controlEntityId) {
                        const newState = event.detail.state;
                        if (typeof newState === 'object' && newState !== null) {
                            this.controlEntityState = newState.state || 'off';
                        } else {
                            this.controlEntityState = newState || 'off';
                        }
                    }
                }

                // 更新冰箱温度
                if (this.isFridgeDevice) {
                    const fridgeSensorId = this.customprops?.fridgeSensor || this.fridgesensor;
                    const freezerSensorId = this.customprops?.freezerSensor || this.freezersensor;
                    if (event.detail.entityId === fridgeSensorId) {
                        const tempValue = event.detail.state;
                        if (tempValue && tempValue !== 'unavailable' && tempValue !== 'unknown') {
                            this.fridgeTemp = tempValue;
                        } else {
                            this.fridgeTemp = '--';
                        }
                    }
                    if (event.detail.entityId === freezerSensorId) {
                        const tempValue = event.detail.state;
                        if (tempValue && tempValue !== 'unavailable' && tempValue !== 'unknown') {
                            this.freezerTemp = tempValue;
                        } else {
                            this.freezerTemp = '--';
                        }
                    }
                }
            }
        };
        window.addEventListener('device-state-update', this.handleStateUpdate);
    },

    beforeUnmount() {
        // 取消HA连接监听
        if (this.handleHAStateUpdate && window.haConnection) {
            window.haConnection.removeListener('stateUpdate', this.handleHAStateUpdate);
        }

        // 取消全局事件监听
        if (this.handleStateUpdate) {
            window.removeEventListener('device-state-update', this.handleStateUpdate);
        }

        // 停止计时器更新
        this.stopTimerUpdate();
    },

    // ==================== 方法定义 ====================
    methods: {

    // 启动计时器实时更新（仅计时器实体调用）
    startTimerUpdate() {
        if (!this.isTimerEntity) return;

        // 先停止现有的定时器
        this.stopTimerUpdate();

        // 使用全局定时器管理器注册回调
        if (window.TimerManager) {
            const updateCallback = () => {
                this.currentTime = Date.now();
            };

            // 注册到全局管理器，并保存注销函数
            this.timerUnregisterFn = window.TimerManager.register(updateCallback);
        } else {
            // 降级方案：如果没有全局管理器，使用独立定时器
            this.timerUnregisterFn = () => {};
            this.timerInterval = setInterval(() => {
                this.currentTime = Date.now();
            }, 1000);
        }
    },

    // 停止计时器更新
    stopTimerUpdate() {
        // 使用注销函数从全局管理器注销
        if (this.timerUnregisterFn) {
            this.timerUnregisterFn();
            this.timerUnregisterFn = null;
        }

        // 降级方案：清理独立定时器
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    // 加载设备状态
    async loadDeviceState() {
        // 对于设置卡片或空实体ID，直接设置为off状态，不发起API请求
        if (this.isSettingsCard || !this.stateentity) {
            this.state = 'off';
            this.loading = false;
            return;
        }

        try {
            this.loading = true;

            if (!window.haConnection) {
                this.state = 'unavailable';
                return;
            }

            // 对于计时器实体，需要获取完整状态包括属性，同时获取控制实体（灯）状态
            if (this.isTimerEntity) {
                const haUrl = window.haConnection.url || window.HA_URL;
                const accessToken = window.haConnection.token || window.ACCESS_TOKEN;

                if (haUrl && accessToken) {
                    // 获取计时器实体状态
                    const timerResponse = await fetch(`${haUrl}/api/states/${this.stateentity}`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (timerResponse.ok) {
                        const timerData = await timerResponse.json();
                        this.state = timerData.state || 'unavailable';
                        this.timerAttributes = timerData.attributes || null;
                    } else {
                        this.state = 'unavailable';
                        this.timerAttributes = null;
                    }

                    // 获取控制实体（灯）状态
                    if (this.controlEntity) {
                        const controlResponse = await fetch(`${haUrl}/api/states/${this.controlEntity}`, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (controlResponse.ok) {
                            const controlData = await controlResponse.json();
                            this.controlEntityState = controlData.state || 'off';
                        } else {
                            this.controlEntityState = 'off';
                        }
                    }
                }
            } else {
                // 对于非计时器实体，使用原来的方式
                const state = await window.haConnection.getDeviceState(this.stateentity);

                // 处理返回的状态（可能是字符串或对象）
                if (typeof state === 'object' && state !== null) {
                    this.state = state.state || 'unavailable';
                } else {
                    this.state = state || 'unavailable';
                }

                // 投喂器状态已加载
            }
        } catch (error) {
            this.state = 'unavailable';
            this.timerAttributes = null;
        } finally {
            this.loading = false;
        }
    },

        // 加载冰箱温度
        async loadFridgeTemperatures() {
        if (!window.haConnection) {
            this.fridgeTemp = 'unavailable';
            this.freezerTemp = 'unavailable';
            return;
        }

        // 多重备选方案获取传感器ID
        let fridgeSensorId = this.customProps?.fridgeSensor || this.fridgesensor;
        let freezerSensorId = this.customProps?.freezerSensor || this.freezersensor;
        
        // 如果 customProps 为空，尝试从全局配置获取
        if ((!fridgeSensorId || !freezerSensorId) && window.DEVICE_CONFIGS && window.DEVICE_CONFIGS.fridge) {
            const globalFridgeConfig = window.DEVICE_CONFIGS.fridge;
            fridgeSensorId = globalFridgeConfig.customProps?.fridgeSensor || globalFridgeConfig.fridgesensor;
            freezerSensorId = globalFridgeConfig.customProps?.freezerSensor || globalFridgeConfig.freezersensor;
        }

        try {
            // 加载冷藏温度
            if (fridgeSensorId) {
                const fridgeState = await window.haConnection.getDeviceState(fridgeSensorId);
                if (fridgeState && fridgeState !== 'unavailable' && fridgeState !== 'unknown') {
                    this.fridgeTemp = fridgeState;
                } else {
                    this.fridgeTemp = '--';
                }
            } else {
                // 没有配置冷藏传感器
            }

            // 加载冷冻温度
            if (freezerSensorId) {
                const freezerState = await window.haConnection.getDeviceState(freezerSensorId);
                if (freezerState && freezerState !== 'unavailable' && freezerState !== 'unknown') {
                    this.freezerTemp = freezerState;
                } else {
                    this.freezerTemp = '--';
                }
            }
        } catch (error) {
            // 加载冰箱温度失败
            this.fridgeTemp = '--';
            this.freezerTemp = '--';
        }
    },

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

            // 对于设置类型卡片，不执行设备控制，只触发点击事件
            if (this.isSettingsType) {
                // 触发自定义设置卡片点击事件
                this.$emit('settings-click', {
                    name: this.name,
                    icon: this.icon,
                    devicetype: this.devicetype
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
                        deviceType: this.devicetype
                    };
                    await window.app.handleDeviceClick(device);
                }
            } catch (error) {
                // 控制设备失败
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
        }
    },

    // ==================== 模板 ====================
    template: `
        <div :class="[cardClass, statusClass]" @click="handleClick" :style="{ overflow: hasdetailpage ? 'visible' : 'hidden' }">
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

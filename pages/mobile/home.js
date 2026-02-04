/**
 * 首页 - 移动端逻辑
 */

// 避免重复声明
if (!window.HomePage) {
    window.HomePage = {
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

            const container = document.getElementById('deviceCardsContainer');
            if (!container) {
                return;
            }

            // 创建一个新的 Vue 应用实例专门用于 home 页面

            const homeApp = Vue.createApp({
                data() {
                    const cards = window.DEVICE_CARDS ? [...window.DEVICE_CARDS] : [];
                    // 调试：检查冰箱卡片的 customProps
                    const fridgeDevice = cards.find(d => d.deviceType === 'fridge');
                    if (fridgeDevice) {
                        console.log('[Home] 冰箱设备:', fridgeDevice.name, 'customProps:', fridgeDevice.customProps);
                    }

                    // 从本地存储加载投喂数量
                    let savedFeederAmount = 1;
                    try {
                        const saved = localStorage.getItem('feederAmount');
                        if (saved) {
                            savedFeederAmount = parseInt(saved, 10) || 1;
                        }
                    } catch (error) {
                        // 加载失败使用默认值
                    }

                    return {
                        deviceCards: cards,
                        draggedItem: null,
                        draggedIndex: null,
                        // 弹出卡片状态
                        showPopup: false,
                        popupTitle: '',
                        popupContent: null,
                        // 当前操作的打印机设备
                        currentPrinterDevice: null,
                        // 打印机电源状态缓存
                        printerPowerState: 'unknown',
                        // 弹出卡片是否为大尺寸（用于URL显示）
                        isLargePopup: false,
                        // 设备状态缓存
                        deviceStates: {},
                        // 空调状态缓存
                        acTemperature: '--',
                        acHumidity: '--',
                        // 空调详细状态
                        acState: null,  // 完整状态对象
                        acHvacMode: 'off',  // 当前模式
                        acTargetTemp: 26,  // 目标温度
                        acFanMode: '四档',  // 风速档位
                        acFanIndex: 3,  // 风速索引（0-6 对应 自动、一档、二档、三档、四档、五档、六档、七档、Max档）
                        // 投喂器设置
                        feederAmount: savedFeederAmount,  // 投喂数量（从本地存储加载）
                        currentFeederDevice: null,  // 当前操作的投喂器设备
                        // 洗衣机状态
                        washingMachineState: '关机',  // 洗衣机状态
                        washingMachineStage: '',  // 当前阶段
                        washingMachineTime: '--',  // 剩余时间
                        washingMachineMode: 'daily',  // 洗涤模式（默认日常洗）
                        washingMachineRinse: 2,  // 漂洗次数
                        washingMachineWater: 50,  // 目标水量
                        washingMachinePower: 'off',  // 电源状态
                        washingMachineChildLock: false,  // 童锁状态
                        currentWashingMachine: null,  // 当前操作的洗衣机设备
                        // 洗衣机模式列表
                        washingMachineModes: [
                            { name: '日常洗', value: 'daily', icon: '👕' },
                            { name: '快速洗', value: 'quick', icon: '⚡' },
                            { name: '大件洗', value: 'heavy', icon: '🛏️' },
                            { name: '强力洗', value: 'strong', icon: '💪' },
                            { name: '单脱水', value: 'spin', icon: '🌀' },
                            { name: '桶自洁', value: 'self_clean', icon: '🧼' },
                            { name: '自定义', value: 'custom', icon: '⚙️' },
                            { name: '轻柔洗', value: 'gentle', icon: '🌸' },
                            { name: '羊毛洗', value: 'wool', icon: '🐑' },
                            { name: '婴童洗', value: 'baby', icon: '👶' },
                            { name: '内衣洗', value: 'underwear', icon: '🩲' },
                            { name: '棉麻洗', value: 'cotton', icon: '🧵' },
                            { name: '漂+脱', value: 'rinse_spin', icon: '💧' },
                            { name: '桶风干', value: 'dry', icon: '🌬️' },
                            { name: '除螨洗', value: 'mites', icon: '🦠' },
                            { name: '浸泡洗', value: 'soak', icon: '🛁' }
                        ]
                    };
                },
                computed: {
                    // 1x1 卡片设备列表（非 span 2 的设备）
                    deviceCards1x1() {
                        return this.deviceCards.filter(device => device.span !== 2);
                    },
                    // 1x2 卡片设备列表（span 为 2 的设备）
                    deviceCards1x2() {
                        return this.deviceCards.filter(device => device.span === 2);
                    },
                    // 洗衣机状态样式类
                    washingMachineStateClass() {
                        const stateClasses = {
                            '关机': 'off',
                            '待机中': 'standby',
                            '工作中': 'running',
                            '暂停中': 'paused',
                            '预约中': 'scheduled'
                        };
                        return stateClasses[this.washingMachineState] || 'off';
                    },
                    // 洗衣机阶段中文显示
                    washingMachineStageText() {
                        const stageMap = {
                            'None': '准备中',
                            'Weighing': '称重中',
                            'Washing': '洗涤中',
                            'Rinsing': '漂洗中',
                            'Spin': '脱水中',
                            'Drying': '烘干中',
                            'Complete': '已完成'
                        };
                        return stageMap[this.washingMachineStage] || this.washingMachineStage || '--';
                    }
                },
                watch: {
                    // 打开弹出卡片时加载空调状态
                    showPopup(newVal) {
                        if (newVal && this.popupContent === 'air-conditioner') {
                            this.loadACState();
                        }
                    },
                    // 监控洗衣机模式变化
                    washingMachineMode(newVal, oldVal) {
                        console.log('[Home] 洗衣机模式变化:', oldVal, '->', newVal);
                    }
                },
                methods: {
                    // 获取卡片在原始数组中的真实索引
                    getOriginalIndex(device) {
                        return this.deviceCards.findIndex(d =>
                            d.name === device.name && d.controlEntity === device.controlEntity
                        );
                    },

                    // 获取缓存的设备状态
                    getCachedDeviceState(entityId) {
                        return this.deviceStates[entityId] || 'unknown';
                    },

                    // 获取设备状态文本
                    getDeviceStatusText(device) {
                        // 优先使用 controlEntity，否则使用 stateEntity
                        const entityId = device.controlEntity || device.stateEntity;
                        const state = this.getCachedDeviceState(entityId);
                        switch (state) {
                            case 'on':
                                return '已开启';
                            case 'off':
                                return '已关闭';
                            case 'unavailable':
                                return '不可使用';
                            default:
                                return '未知';
                        }
                    },

                    // 处理设备点击
                    handleDeviceClick(device) {
                        // 优先使用 controlEntity，否则使用 stateEntity
                        const entityId = device.controlEntity || device.stateEntity;
                        // 防护：检查是否是有效的设备卡片（必须有实体）
                        if (!device || !entityId || typeof entityId !== 'string' || entityId === 'Error') {
                            console.log('[Home] 非设备项被点击:', device);
                            return;
                        }
                        
                        const newState = this.getCachedDeviceState(entityId) === 'on' ? 'off' : 'on';
                        this.deviceStates[entityId] = newState;
                        // 更新卡片显示状态
                        this.$forceUpdate();
                    },

                    // 拖拽开始
                    onDragStart(event, index) {
                        this.draggedIndex = index;
                        this.draggedItem = this.deviceCards[index];
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', index);
                        // 延迟添加拖拽样式,避免拖拽时元素不可见
                        setTimeout(() => {
                            event.target.classList.add('dragging');
                        }, 0);
                    },

                    // 拖拽结束
                    onDragEnd(event) {
                        event.target.classList.remove('dragging');
                        this.draggedItem = null;
                        this.draggedIndex = null;

                        // 保存到本地存储
                        this.saveCardOrder();
                    },

                    // 拖拽经过
                    onDragOver(event) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                    },

                    // 放下
                    onDrop(event, targetIndex) {
                        event.preventDefault();
                        if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
                            return;
                        }

                        // 移动卡片
                        const draggedItem = this.deviceCards[this.draggedIndex];
                        this.deviceCards.splice(this.draggedIndex, 1);
                        this.deviceCards.splice(targetIndex, 0, draggedItem);
                    },

                    // 保存卡片顺序到本地存储
                    saveCardOrder() {
                        try {
                            const cardOrder = this.deviceCards.map(card => ({
                                name: card.name,
                                stateEntity: card.stateEntity
                            }));
                            localStorage.setItem('deviceCardOrder', JSON.stringify(cardOrder));
                        } catch (error) {
                            // 保存失败静默处理
                        }
                    },

                    // 处理详情页面打开
                    async handleOpenDetail(detail) {
                        // 根据设备类型和操作类型显示不同的弹出内容
                        const deviceType = detail.deviceType;
                        const action = detail.action || 'detail';

                        if (deviceType === 'climate') {
                            // 空调详情弹出
                            this.showAirConditionerPopup(detail);
                        } else if (deviceType === 'url') {
                            // URL类型设备（如3D打印机）
                            if (action === 'control_power') {
                                // 点击切角：弹出电源控制（异步）
                                await this.showPrinterPowerPopup(detail);
                            } else if (action === 'show_url') {
                                // 点击卡片主体：显示URL iframe
                                this.showPrinterUrlPopup(detail);
                            }
                        } else if (deviceType === 'feeder') {
                            // 投喂器设置弹窗
                            this.showFeederSettingsPopup(detail);
                        } else if (deviceType === 'washingmachine') {
                            // 洗衣机控制弹窗
                            this.showWashingMachinePopup(detail);
                        }
                    },

                    /**
                     * 处理投喂器点击
                     * @param {Object} detail - 投喂器详情
                     */
                    async handleFeederClick(detail) {
                        if (!window.haConnection) return;

                        try {
                            // 获取投喂数量（优先使用传入的，否则使用当前设置）
                            const amount = detail.amount || this.feederAmount;

                            // 调用服务投喂指定数量
                            await window.haConnection.callService('number', 'set_value', {
                                entity_id: detail.controlEntity,
                                value: amount
                            });

                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.success(`投喂 ${amount} 份成功`);
                            }
                        } catch (error) {
                            console.error('投喂失败:', error);
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.fail('投喂失败');
                            }
                        }
                    },

                    /**
                     * 处理投喂器设置
                     * @param {Object} detail - 投喂器详情
                     */
                    handleFeederSettings(detail) {
                        this.currentFeederDevice = detail;
                        this.feederAmount = detail.currentAmount || 1;
                        this.showFeederSettingsPopup(detail);
                    },



                    /**
                     * 设置洗衣机模式
                     * @param {string} mode - 模式值
                     */
                    async setWashingMachineMode(mode) {
                        if (!window.haConnection) return;
                        const device = window.DEVICE_CARDS.find(d => d.deviceType === 'washingmachine');
                        if (!device || !device.modeEntity) return;

                        try {
                            // 将内部值转换为中文名（Home Assistant 期望中文选项）
                            const modeObj = this.washingMachineModes.find(m => m.value === mode);
                            if (!modeObj) {
                                console.error('未找到对应模式:', mode);
                                return;
                            }
                            const chineseName = modeObj.name;
                            
                            await window.haConnection.callService('select', 'select_option', {
                                entity_id: device.modeEntity,
                                option: chineseName
                            });
                            this.washingMachineMode = mode;
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.success('模式已切换');
                            }
                        } catch (error) {
                            console.error('设置模式失败:', error);
                        }
                    },

                    /**
                     * 调节漂洗次数
                     * @param {number} delta - 变化量
                     */
                    async adjustRinse(delta) {
                        const newValue = Math.max(1, Math.min(5, this.washingMachineRinse + delta));
                        this.washingMachineRinse = newValue;

                        if (!window.haConnection) return;
                        const device = window.DEVICE_CARDS.find(d => d.deviceType === 'washingmachine');
                        if (!device || !device.rinseEntity) return;

                        try {
                            await window.haConnection.callService('number', 'set_value', {
                                entity_id: device.rinseEntity,
                                value: newValue
                            });
                        } catch (error) {
                            console.error('设置漂洗次数失败:', error);
                        }
                    },

                    /**
                     * 调节水位
                     * @param {number} delta - 变化量
                     */
                    async adjustWater(delta) {
                        const newValue = Math.max(20, Math.min(100, this.washingMachineWater + delta));
                        this.washingMachineWater = newValue;

                        if (!window.haConnection) return;
                        const device = window.DEVICE_CARDS.find(d => d.deviceType === 'washingmachine');
                        if (!device || !device.waterLevelEntity) return;

                        try {
                            await window.haConnection.callService('number', 'set_value', {
                                entity_id: device.waterLevelEntity,
                                value: newValue
                            });
                        } catch (error) {
                            console.error('设置水位失败:', error);
                        }
                    },

                    /**
                     * 切换童锁
                     */
                    async toggleChildLock() {
                        if (!window.haConnection) return;
                        const device = window.DEVICE_CARDS.find(d => d.deviceType === 'washingmachine');
                        if (!device || !device.childLock) return;

                        try {
                            const newState = this.washingMachineChildLock ? 'off' : 'on';
                            await window.haConnection.callService('switch', 'turn_' + newState, {
                                entity_id: device.childLock
                            });
                            this.washingMachineChildLock = !this.washingMachineChildLock;
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.success(this.washingMachineChildLock ? '童锁已开启' : '童锁已关闭');
                            }
                        } catch (error) {
                            console.error('切换童锁失败:', error);
                        }
                    },

                    /**
                     * 显示投喂器设置弹窗
                     * @param {Object} detail - 设备详情对象
                     */
                    showFeederSettingsPopup(detail) {
                        this.popupTitle = detail.name + ' - 投喂设置';
                        this.popupContent = 'feeder-settings';
                        this.isLargePopup = false;
                        this.showPopup = true;
                    },

                    /**
                     * 显示洗衣机控制弹窗
                     * @param {Object} detail - 设备详情对象
                     */
                    async showWashingMachinePopup(detail) {
                        this.currentWashingMachine = detail;
                        // 先显示弹窗
                        this.popupTitle = detail.name + ' - 控制面板';
                        this.popupContent = 'washing-machine';
                        this.isLargePopup = false;
                        this.showPopup = true;
                        // 重置状态
                        this.washingMachineState = '加载中...';
                        this.washingMachineStage = '';
                        this.washingMachineTime = '--';
                        this.washingMachineMode = 'daily';
                        console.log('[Home] 洗衣机弹窗显示, 默认模式:', this.washingMachineMode, '模式列表:', this.washingMachineModes);
                        // 异步加载洗衣机状态
                        this.$nextTick(async () => {
                            await this.loadWashingMachineState();
                        });
                    },

                    /**
                     * 加载洗衣机状态
                     */
                    async loadWashingMachineState() {
                        if (!window.haConnection || !this.currentWashingMachine) return;

                        const device = window.DEVICE_CARDS.find(d => d.deviceType === 'washingmachine');
                        if (!device) {
                            console.log('[Home] 未找到洗衣机设备配置');
                            return;
                        }

                        try {
                            console.log('[Home] 加载洗衣机状态, 设备:', device);

                            // 获取状态
                            if (device.stateEntity) {
                                const state = await window.haConnection.getDeviceState(device.stateEntity);
                                console.log('[Home] 洗衣机状态:', device.stateEntity, '=', state);
                                this.washingMachineState = state || '关机';
                            }

                            // 获取阶段
                            if (device.stageEntity) {
                                const stage = await window.haConnection.getDeviceState(device.stageEntity);
                                console.log('[Home] 洗衣机阶段:', device.stageEntity, '=', stage);
                                this.washingMachineStage = stage || '';
                            }

                            // 获取剩余时间
                            if (device.timeRemainingEntity) {
                                const time = await window.haConnection.getDeviceState(device.timeRemainingEntity);
                                console.log('[Home] 洗衣机剩余时间:', device.timeRemainingEntity, '=', time);
                                this.washingMachineTime = time || '--';
                            }

                            // 获取模式
                            if (device.modeEntity) {
                                const mode = await window.haConnection.getDeviceState(device.modeEntity);
                                console.log('[Home] 洗衣机模式:', device.modeEntity, '=', mode);
                                
                                // 创建中文名到value的映射
                                const modeNameToValue = {};
                                // 创建value集合
                                const validValues = new Set();
                                this.washingMachineModes.forEach(m => {
                                    modeNameToValue[m.name] = m.value;
                                    validValues.add(m.value);
                                });
                                
                                // 处理模式值
                                let mappedMode = 'daily'; // 默认值
                                if (mode) {
                                    const modeStr = String(mode);
                                    const lowerMode = modeStr.toLowerCase();
                                    
                                    if (lowerMode === 'unknown') {
                                        console.log('[Home] 洗衣机模式为 unknown，使用默认值 daily');
                                    } else if (modeNameToValue[modeStr]) {
                                        // 是中文名，映射到value
                                        mappedMode = modeNameToValue[modeStr];
                                    } else if (validValues.has(modeStr)) {
                                        // 已经是有效的value
                                        mappedMode = modeStr;
                                    } else {
                                        // 未知值，使用默认
                                        console.warn('[Home] 未知的洗衣机模式:', modeStr, '，使用默认值 daily');
                                    }
                                } else {
                                    console.log('[Home] 洗衣机模式为空，使用默认值 daily');
                                }
                                
                                console.log('[Home] 映射后模式:', mode, '->', mappedMode);
                                this.washingMachineMode = mappedMode;
                            }

                            // 获取电源状态
                            if (device.powerSwitch) {
                                const power = await window.haConnection.getDeviceState(device.powerSwitch);
                                console.log('[Home] 洗衣机电源:', device.powerSwitch, '=', power);
                                this.washingMachinePower = power || 'off';
                            }

                            // 获取童锁状态
                            if (device.childLock) {
                                const childLock = await window.haConnection.getDeviceState(device.childLock);
                                console.log('[Home] 洗衣机童锁:', device.childLock, '=', childLock);
                                this.washingMachineChildLock = childLock === 'on';
                            }

                            // 获取漂洗次数
                            if (device.rinseEntity) {
                                const rinse = await window.haConnection.getDeviceState(device.rinseEntity);
                                console.log('[Home] 洗衣机漂洗次数:', device.rinseEntity, '=', rinse);
                                this.washingMachineRinse = parseInt(rinse) || 2;
                            }

                            // 获取水位
                            if (device.waterLevelEntity) {
                                const water = await window.haConnection.getDeviceState(device.waterLevelEntity);
                                console.log('[Home] 洗衣机水位:', device.waterLevelEntity, '=', water);
                                this.washingMachineWater = parseInt(water) || 50;
                            }
                        } catch (error) {
                            console.error('[Home] 加载洗衣机状态失败:', error);
                        }
                    },

                    /**
                     * 控制洗衣机
                     * @param {string} action - 操作类型
                     */
                    async controlWashingMachine(action) {
                        if (!window.haConnection || !this.currentWashingMachine) return;

                        const device = window.DEVICE_CARDS.find(d => d.deviceType === 'washingmachine');
                        if (!device) return;

                        try {
                            if (action === 'start' && device.startButton) {
                                await window.haConnection.callService('button', 'press', {
                                    entity_id: device.startButton
                                });
                                if (window.vant && window.vant.Toast) {
                                    window.vant.Toast.success('开始洗涤');
                                }
                            } else if (action === 'pause' && device.pauseButton) {
                                await window.haConnection.callService('button', 'press', {
                                    entity_id: device.pauseButton
                                });
                                if (window.vant && window.vant.Toast) {
                                    window.vant.Toast.success('已暂停');
                                }
                            } else if (action === 'power' && device.powerSwitch) {
                                const currentState = await window.haConnection.getDeviceState(device.powerSwitch);
                                const newState = currentState === 'on' ? 'off' : 'on';
                                await window.haConnection.callService('switch', 'turn_' + newState, {
                                    entity_id: device.powerSwitch
                                });
                                if (window.vant && window.vant.Toast) {
                                    window.vant.Toast.success(newState === 'on' ? '已开机' : '已关机');
                                }
                            }
                            // 刷新状态
                            setTimeout(() => this.loadWashingMachineState(), 500);
                        } catch (error) {
                            console.error('控制洗衣机失败:', error);
                            if (window.vant && window.vant.Toast) {
                                window.vant.Toast.fail('操作失败');
                            }
                        }
                    },

                    /**
                     * 确认投喂器设置
                     */
                    confirmFeederSettings() {
                        // 保存设置到本地存储
                        try {
                            localStorage.setItem('feederAmount', this.feederAmount.toString());
                        } catch (error) {
                            // 保存失败静默处理
                        }
                        this.closePopup();
                        if (window.vant && window.vant.Toast) {
                            window.vant.Toast.success(`已设置投喂 ${this.feederAmount} 份`);
                        }
                    },

                    /**
                     * 显示空调控制弹出卡片
                     * @param {Object} detail - 设备详情对象
                     */
                    showAirConditionerPopup(detail) {
                        this.popupTitle = detail.name + ' - 详细控制';
                        this.popupContent = 'air-conditioner';
                        this.showPopup = true;
                    },

                    /**
                     * 显示URL设备弹出卡片（如3D打印机）- 显示URL
                     * @param {Object} detail - 设备详情对象
                     */
                    showPrinterUrlPopup(detail) {
                        this.popupTitle = detail.name + ' - 控制面板';
                        this.popupContent = 'printer-url';
                        this.isLargePopup = true;  // URL弹出使用大尺寸
                        this.showPopup = true;
                    },

                    /**
                     * 显示3D打印机电源控制弹出卡片
                     * @param {Object} detail - 设备详情对象
                     */
                    async showPrinterPowerPopup(detail) {
                        // 存储当前操作的打印机设备
                        this.currentPrinterDevice = detail;
                        // 设置标题为"设备名称+电源控制"
                        this.popupTitle = detail.name + '电源控制';
                        this.popupContent = 'printer-power';
                        this.isLargePopup = false;  // 电源控制使用普通尺寸
                        this.showPopup = true;

                        // 异步获取电源状态
                        await this.updatePrinterPowerState();
                    },

                    /**
                     * 更新打印机电源状态缓存
                     */
                    async updatePrinterPowerState() {
                        if (!this.currentPrinterDevice || !window.haConnection) {
                            this.printerPowerState = 'unknown';
                            return;
                        }

                        const powerEntity = this.currentPrinterDevice.powerEntity;
                        if (!powerEntity) {
                            this.printerPowerState = 'unknown';
                            return;
                        }

                        try {
                            // getDeviceState 是异步函数，返回 Promise
                            const state = await window.haConnection.getDeviceState(powerEntity);

                            // state 是字符串 'on'、'off' 或 'unavailable'
                            if (state === 'on' || state === 'off') {
                                this.printerPowerState = state;
                            } else {
                                this.printerPowerState = 'unknown';
                            }
                        } catch (error) {
                            this.printerPowerState = 'unknown';
                        }
                    },

                    /**
                     * 获取3D打印机电源状态（从缓存中读取）
                     * @returns {string} 电源状态 'on'|'off'|'unknown'
                     */
                    getPrinterPowerState() {
                        return this.printerPowerState;
                    },

                    /**
                     * 关闭弹出卡片
                     */
                    closePopup() {
                        this.showPopup = false;
                        this.popupContent = null;
                    },

                    /**
                     * 获取空调状态文本
                     * @returns {string} 状态文本
                     */
                    async getACStatus() {
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
                        if (!acDevice || !window.haConnection) return '未知';

                        const state = await window.haConnection.getDeviceState(acDevice.stateEntity);
                        if (state && typeof state === 'object') {
                            const stateVal = state.state || 'off';
                            const statusMap = {
                                'off': '已关闭',
                                'idle': '待机',
                                'cooling': '制冷',
                                'heating': '制热',
                                'fan_only': '送风',
                                'dry': '干燥'
                            };
                            return statusMap[stateVal] || stateVal;
                        }
                        return '未知';
                    },

                    /**
                     * 加载空调温湿度状态
                     */
                    async loadACState() {
                        // 从 deviceCards 中查找空调设备
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
                        if (!acDevice || !acDevice.stateEntity) {
                            this.acTemperature = '--';
                            this.acHumidity = '--';
                            return;
                        }

                        try {
                            const entityId = acDevice.stateEntity;

                            // 优先从 haConnection.states 缓存中获取完整状态
                            let stateData = null;
                            if (window.haConnection && window.haConnection.states && window.haConnection.states[entityId]) {
                                // states 中存储的是 state 字符串，不是完整对象
                                // 需要重新获取完整状态
                            }

                            // 使用 fetch API 获取完整状态对象（包含 attributes）
                            const haUrl = window.haConnection?.url || window.HA_URL || 'http://192.168.4.5:8123';
                            const accessToken = window.haConnection?.token || window.ACCESS_TOKEN;

                            const response = await fetch(`${haUrl}/api/states/${entityId}`, {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }

                            stateData = await response.json();

                            if (stateData && stateData.attributes) {
                                // 保存完整状态
                                this.acState = stateData;
                                this.acHvacMode = stateData.state || 'off';
                                this.acTargetTemp = stateData.attributes.temperature || 26;
                                this.acFanMode = stateData.attributes.fan_mode || '四档';

                                // 更新风量索引
                                const fanModes = ['自动', '一档', '二档', '三档', '四档', '五档', '六档', '七档', 'Max档'];
                                this.acFanIndex = fanModes.indexOf(this.acFanMode);
                                if (this.acFanIndex === -1) this.acFanIndex = 3; // 默认四档

                                // 尝试不同的属性名
                                this.acTemperature = stateData.attributes.temperature ||
                                                   stateData.attributes.current_temperature ||
                                                   stateData.attributes['current temperature'] ||
                                                   '--';
                                this.acHumidity = stateData.attributes.humidity ||
                                                  stateData.attributes.current_humidity ||
                                                  stateData.attributes['current humidity'] ||
                                                  '--';
                            } else {
                                this.acTemperature = '--';
                                this.acHumidity = '--';
                            }
                        } catch (error) {
                            this.acTemperature = '--';
                            this.acHumidity = '--';
                        }
                    },

                    /**
                     * 控制空调
                     * @param {string} action - 操作类型（turn_off/set_temperature/set_mode）
                     * @param {number} value - 温度值或模式（仅 set_temperature/set_mode 时使用）
                     */
                    async controlAC(action, value) {
                        // 从 deviceCards 中查找空调设备
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
        if (!acDevice || !acDevice.stateEntity || !window.haConnection) return;

        try {
                            if (action === 'turn_off') {
                                const serviceData = {
                                    entity_id: acDevice.stateEntity
                                };
                                await window.haConnection.callService('climate', 'turn_off', serviceData);
                            } else if (action === 'set_temperature') {
                                // 设置温度：只在用户点击温度按钮时设置温度
                                const serviceData = {
                                    entity_id: acDevice.stateEntity,
                                    temperature: value
                                };

                                // 尝试设置温度，如果失败（空调关闭），先设置模式再设置温度
                                try {
                                    await window.haConnection.callService('climate', 'set_temperature', serviceData);
                                } catch (tempError) {
                                    // 先设置为制冷模式（会自动开启空调）
                                    await window.haConnection.callService('climate', 'set_hvac_mode', {
                                        entity_id: acDevice.stateEntity,
                                        hvac_mode: 'cool'
                                    });

                                    // 等待一小段时间
                                    await new Promise(resolve => setTimeout(resolve, 300));

                                    // 再次设置温度
                                    await window.haConnection.callService('climate', 'set_temperature', serviceData);
                                }
                            } else if (action === 'set_mode') {
                                // 设置模式：只设置模式，不设置温度
                                const serviceData = {
                                    entity_id: acDevice.stateEntity,
                                    hvac_mode: value
                                };
                                await window.haConnection.callService('climate', 'set_hvac_mode', serviceData);
                            }
                            // 控制操作后刷新状态
                            setTimeout(() => this.loadACState(), 500);
                        } catch (error) {
                            // 静默处理错误
                        }
                    },

                    /**
                     * 控制空调风量
                     * @param {string} action - 操作类型（set/prev/next）
                     * @param {number} value - 档位索引（仅 set 时使用）
                     */
                    async controlFan(action, value) {
                        const fanModes = ['自动', '一档', '二档', '三档', '四档', '五档', '六档', '七档', 'Max档'];
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
                        if (!acDevice || !acDevice.stateEntity || !window.haConnection) return;

                        try {
                            if (action === 'prev') {
                                this.acFanIndex = Math.max(0, this.acFanIndex - 1);
                            } else if (action === 'next') {
                                this.acFanIndex = Math.min(fanModes.length - 1, this.acFanIndex + 1);
                            } else if (action === 'set') {
                                this.acFanIndex = Math.max(0, Math.min(fanModes.length - 1, parseInt(value) || 0));
                            }

                            this.acFanMode = fanModes[this.acFanIndex];

                            // 调用 HA 服务设置风量
                            await window.haConnection.callService('climate', 'set_fan_mode', {
                                entity_id: acDevice.stateEntity,
                                fan_mode: this.acFanMode
                            });

                            // 刷新状态
                            setTimeout(() => this.loadACState(), 500);
                        } catch (error) {
                            // 静默处理错误
                        }
                    },

                    /**
                     * 控制3D打印机电源
                     * @param {string} action - 操作类型（turn_on/turn_off）
                     */
                    async controlPrinter(action) {
                        // 优先使用当前弹出卡片中存储的打印机设备
                        const printerDevice = this.currentPrinterDevice || this.deviceCards.find(d => d.deviceType === 'url');

                        if (!printerDevice || !printerDevice.powerEntity || !window.haConnection) return;

                        try {
                            if (action === 'turn_on') {
                                await window.haConnection.callService('switch', 'turn_on', {
                                    entity_id: printerDevice.powerEntity
                                });
                                // 更新状态缓存
                                this.printerPowerState = 'on';
                            } else if (action === 'turn_off') {
                                await window.haConnection.callService('switch', 'turn_off', {
                                    entity_id: printerDevice.powerEntity
                                });
                                // 更新状态缓存
                                this.printerPowerState = 'off';
                            }
                            // 操作完成后关闭弹出卡片
                            this.closePopup();
                        } catch (error) {
                            // 控制失败静默处理
                        }
                    },

                    /**
                     * 获取3D打印机控制面板URL
                     * @returns {string} URL地址
                     */
                    getPrinterUrl() {
                        const printerDevice = this.deviceCards.find(d => d.deviceType === 'url');
                        return printerDevice?.controlUrl || '';
                    },

                    // 从本地存储加载卡片顺序
                    loadCardOrder() {
                        try {
                            const savedOrder = localStorage.getItem('deviceCardOrder');
                            if (savedOrder) {
                                const order = JSON.parse(savedOrder);
                                if (Array.isArray(order) && order.length > 0) {
                                    // 根据保存的顺序重新排列卡片
                                    const newCards = [];
                                    const remainingCards = [...this.deviceCards];

                                    order.forEach(savedCard => {
                                        const index = remainingCards.findIndex(
                                            card => card.name === savedCard.name && card.stateEntity === savedCard.stateEntity
                                        );
                                        if (index !== -1) {
                                            newCards.push(remainingCards.splice(index, 1)[0]);
                                        }
                                    });

                                    // 添加剩余的卡片(新增的卡片)
                                    newCards.push(...remainingCards);
                                    this.deviceCards = newCards;
                                }
                            }
                        } catch (error) {
                            // 加载失败静默处理
                        }
                    },


                },
                components: {
                    'card-1x1': window.Card1x1Component
                },
                        template: `
                    <div class="device-grid">
                        <card-1x1
                            v-for="(device, index) in deviceCards1x1"
                            :key="'1x1-' + index"
                            :name="device.name"
                            :icon="device.icon"
                            :stateentity="device.stateEntity"
                            :control-entity="device.controlEntity"
                            :devicetype="device.deviceType || 'switch'"
                            :layouttype="'default'"
                            :hasdetailpage="device.deviceType === 'climate' || device.deviceType === 'url' || device.deviceType === 'feeder' || device.deviceType === 'washingmachine'"
                            :powerentity="device.powerEntity"
                            :controlurl="device.controlUrl"
                            :data-index="index"
                            :customprops="device.customProps"
                            :feederamount="device.deviceType === 'feeder' ? feederAmount : 1"
                            @open-detail="handleOpenDetail"
                            @feeder-click="handleFeederClick"
                            @feeder-settings="handleFeederSettings"
                        ></card-1x1>
                        <card-1x2
                            v-for="(device, index) in deviceCards1x2"
                            :key="'1x2-' + index"
                            :name="device.name"
                            :icon="device.icon"
                            :stateentity="device.stateEntity"
                            :control-entity="device.controlEntity"
                            :devicetype="device.deviceType || 'switch'"
                            :layouttype="'default'"
                            :hasdetailpage="device.deviceType === 'climate' || device.deviceType === 'url'"
                            :powerentity="device.powerEntity"
                            :controlurl="device.controlUrl"
                            :customprops="device.customProps"
                            :data-index="index"
                            @open-detail="handleOpenDetail"
                        ></card-1x2>
                    </div>
                    <!-- 弹出卡片 -->
                    <card-popup
                        v-model="showPopup"
                        :title="popupTitle"
                        :card-class="isLargePopup ? 'popup-card--large' : ''"
                        @close="closePopup"
                    >
                        <!-- 空调控制内容 -->
                        <template v-if="popupContent === 'air-conditioner'">
                            <div class="air-conditioner-popup">
                                <!-- 状态显示 -->
                                <div class="ac-status-display">
                                    <div class="ac-status-item">
                                        <span class="ac-status-label">室温</span>
                                        <span class="ac-status-value">{{ acTemperature }}℃</span>
                                    </div>
                                    <div class="ac-status-item">
                                        <span class="ac-status-label">湿度</span>
                                        <span class="ac-status-value">{{ acHumidity }}%</span>
                                    </div>
                                </div>

                                <!-- 温度控制区 -->
                                <div class="ac-section">
                                    <h3 class="ac-section-title">温度调节</h3>
                                    <div class="ac-temp-slider">
                                        <button class="ac-slider-btn" @click="controlAC('set_temperature', acTargetTemp - 1)">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M5 12h14"/>
                                            </svg>
                                        </button>
                                        <input type="range"
                                               class="ac-slider-input"
                                               :min="16"
                                               :max="31"
                                               :step="0.5"
                                               v-model.number="acTargetTemp"
                                               @change="controlAC('set_temperature', $event.target.value)">
                                        <button class="ac-slider-btn" @click="controlAC('set_temperature', acTargetTemp + 1)">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M12 5v14"/>
                                                <path d="M19 12l-7-7-7 7"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <!-- 模式控制区 -->
                                <div class="ac-section">
                                    <h3 class="ac-section-title">模式选择</h3>
                                    <div class="ac-mode-controls">
                                        <button class="ac-mode-btn ac-mode-cool" :class="{ 'ac-mode-btn--active': acHvacMode === 'cool' }" @click="controlAC('set_mode', 'cool')">
                                            <span class="ac-mode-icon">❄️</span>
                                            <span class="ac-mode-label">制冷</span>
                                        </button>
                                        <button class="ac-mode-btn ac-mode-heat" :class="{ 'ac-mode-btn--active': acHvacMode === 'heat' }" @click="controlAC('set_mode', 'heat')">
                                            <span class="ac-mode-icon">🔥</span>
                                            <span class="ac-mode-label">制热</span>
                                        </button>
                                        <button class="ac-mode-btn ac-mode-fan" :class="{ 'ac-mode-btn--active': acHvacMode === 'fan_only' }" @click="controlAC('set_mode', 'fan_only')">
                                            <span class="ac-mode-icon">🌬</span>
                                            <span class="ac-mode-label">送风</span>
                                        </button>
                                        <button class="ac-mode-btn ac-mode-dry" :class="{ 'ac-mode-btn--active': acHvacMode === 'dry' }" @click="controlAC('set_mode', 'dry')">
                                            <span class="ac-mode-icon">💧</span>
                                            <span class="ac-mode-label">干燥</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- 风量控制区 -->
                                <div class="ac-section">
                                    <h3 class="ac-section-title">风量调节</h3>
                                    <div class="ac-fan-slider">
                                        <button class="ac-slider-btn" @click="controlFan('prev')">-</button>
                                        <input type="range"
                                               class="ac-slider-input"
                                               min="0"
                                               max="6"
                                               step="1"
                                               v-model.number="acFanIndex"
                                               @change="controlFan('set', $event.target.value)">
                                        <button class="ac-slider-btn" @click="controlFan('next')">+</button>
                                    </div>
                                    <div class="ac-fan-display">{{ acFanMode }}</div>
                                </div>

                                <!-- 电源控制区 -->
                                <div class="ac-section ac-power-section">
                                    <button class="ac-power-btn" :class="{ 'ac-power-btn--on': acHvacMode === 'off', 'ac-power-btn--off': acHvacMode !== 'off' }" @click="acHvacMode === 'off' ? controlAC('set_mode', 'cool') : controlAC('turn_off')">
                                        <span class="ac-power-icon">{{ acHvacMode === 'off' ? '▶' : '⏹' }}</span>
                                        <span class="ac-power-label">{{ acHvacMode === 'off' ? '开启' : '关闭' }}</span>
                                    </button>
                                </div>
                        </div>
                        </template>
                        <!-- 3D打印机URL内容 -->
                        <div v-if="popupContent === 'printer-url'" class="printer-url-popup">
                            <div class="printer-frame-wrapper">
                                <iframe
                                    v-if="getPrinterUrl()"
                                    :src="getPrinterUrl()"
                                    class="printer-iframe"
                                    frameborder="0"
                                ></iframe>
                            </div>
                        </div>
                        <!-- 3D打印机电源控制内容 -->
                        <div v-if="popupContent === 'printer-power'" class="printer-power-popup">
                            <!-- 打印机图标 -->
                            <div class="printer-power-icon-wrapper">
                                <span class="printer-power-icon">🖨️</span>
                            </div>
                            <!-- 确认文本 - 根据电源状态动态显示 -->
                            <p class="printer-power-confirm-text">
                                {{ getPrinterPowerState() === 'on' ? '确认要关机吗？' : '确认要开机吗？' }}
                            </p>
                            <!-- 警告提示框 -->
                            <div class="printer-power-warning">
                                <span class="printer-power-warning-icon">⚠️</span>
                                <span class="printer-power-warning-text">请确保3D打印机处于安全状态后再操作电源</span>
                            </div>
                            <!-- 按钮组 - 根据电源状态显示不同按钮 -->
                            <div class="printer-power-buttons">
                                <button class="printer-power-btn printer-power-btn-cancel" @click.stop="closePopup()">
                                    取消
                                </button>
                                <!-- 电源关闭时显示绿色开机按钮 -->
                                <button v-if="getPrinterPowerState() === 'off'" 
                                        class="printer-power-btn printer-power-btn-start" 
                                        @click.stop="controlPrinter('turn_on')">
                                    开机
                                </button>
                                <!-- 电源开启时显示红色关机按钮 -->
                                <button v-else 
                                        class="printer-power-btn printer-power-btn-stop" 
                                        @click.stop="controlPrinter('turn_off')">
                                    关机
                                </button>
                            </div>
                        </div>
                        <!-- 投喂器设置内容 -->
                        <div v-if="popupContent === 'feeder-settings'" class="feeder-settings-popup">
                            <!-- 投喂器图标 -->
                            <div class="feeder-icon-wrapper">
                                <span class="feeder-icon">🐾</span>
                            </div>
                            <!-- 投喂数量设置 -->
                            <div class="feeder-amount-section">
                                <h3 class="feeder-section-title">投喂数量</h3>
                                <div class="feeder-amount-control">
                                    <button class="feeder-amount-btn" @click="feederAmount = Math.max(1, feederAmount - 1)">-</button>
                                    <span class="feeder-amount-display">{{ feederAmount }} 份</span>
                                    <button class="feeder-amount-btn" @click="feederAmount = Math.min(10, feederAmount + 1)">+</button>
                                </div>
                                <input type="range"
                                       class="feeder-amount-slider"
                                       min="1"
                                       max="10"
                                       step="1"
                                       v-model.number="feederAmount">
                            </div>
                            <!-- 提示文本 -->
                            <p class="feeder-hint">点击卡片将按照设置数量投喂</p>
                            <!-- 按钮组 -->
                            <div class="feeder-buttons">
                                <button class="feeder-btn feeder-btn-cancel" @click.stop="closePopup()">
                                    取消
                                </button>
                                <button class="feeder-btn feeder-btn-confirm" @click.stop="confirmFeederSettings()">
                                    确定
                                </button>
                            </div>
                        </div>
                        <!-- 洗衣机控制内容 -->
                        <div v-if="popupContent === 'washing-machine'" class="washing-machine-popup">
                            <!-- 洗衣机图标和主状态 -->
                            <div class="washing-machine-header">
                                <div class="washing-machine-icon-wrapper">
                                    <span class="washing-machine-icon">👕</span>
                                    <div class="washing-machine-status-badge" :class="washingMachineStateClass">{{ washingMachineState }}</div>
                                </div>
                                <div class="washing-machine-info">
                                    <div class="washing-machine-stage" v-if="washingMachineStage">
                                        <span class="stage-label">当前阶段</span>
                                        <span class="stage-value">{{ washingMachineStageText }}</span>
                                    </div>
                                    <div class="washing-machine-time">
                                        <span class="time-icon">⏱</span>
                                        <span class="time-value">{{ washingMachineTime }} 分钟</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 洗涤模式选择 -->
                            <div class="washing-machine-section">
                                <h3 class="washing-machine-section-title">洗涤模式</h3>
                                <select class="washing-machine-mode-select" v-model="washingMachineMode" @change="setWashingMachineMode($event.target.value)">
                                    <option value="" disabled>-- 选择洗涤模式 --</option>
                                    <option v-for="mode in washingMachineModes" :key="mode.value" :value="mode.value">
                                        {{ mode.icon }} {{ mode.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- 参数调节 -->
                            <div class="washing-machine-params">
                                <div class="washing-machine-param">
                                    <span class="param-label">漂洗次数</span>
                                    <div class="param-control">
                                        <button class="param-btn" @click="adjustRinse(-1)">-</button>
                                        <span class="param-value">{{ washingMachineRinse }} 次</span>
                                        <button class="param-btn" @click="adjustRinse(1)">+</button>
                                    </div>
                                </div>
                                <div class="washing-machine-param">
                                    <span class="param-label">水位</span>
                                    <div class="param-control">
                                        <button class="param-btn" @click="adjustWater(-10)">-</button>
                                        <span class="param-value">{{ washingMachineWater }}%</span>
                                        <button class="param-btn" @click="adjustWater(10)">+</button>
                                    </div>
                                </div>
                            </div>

                            <!-- 控制按钮 -->
                            <div class="washing-machine-controls">
                                <button class="washing-machine-btn washing-machine-btn-power"
                                        :class="{ 'active': washingMachinePower === 'on' }"
                                        @click="controlWashingMachine('power')">
                                    <span class="washing-machine-btn-icon">⚡</span>
                                    <span class="washing-machine-btn-label">{{ washingMachinePower === 'on' ? '关闭' : '开启' }}</span>
                                </button>
                                <button class="washing-machine-btn washing-machine-btn-start"
                                        :disabled="washingMachineState === '工作中'"
                                        @click="controlWashingMachine('start')">
                                    <span class="washing-machine-btn-icon">▶</span>
                                    <span class="washing-machine-btn-label">开始</span>
                                </button>
                                <button class="washing-machine-btn washing-machine-btn-pause"
                                        :disabled="washingMachineState !== '工作中'"
                                        @click="controlWashingMachine('pause')">
                                    <span class="washing-machine-btn-icon">⏸</span>
                                    <span class="washing-machine-btn-label">暂停</span>
                                </button>
                            </div>

                            <!-- 童锁开关 -->
                            <div class="washing-machine-childlock">
                                <span class="childlock-label">🔒 童锁</span>
                                <button class="childlock-toggle" :class="{ 'active': washingMachineChildLock }" @click="toggleChildLock()">
                                    {{ washingMachineChildLock ? '已开启' : '已关闭' }}
                                </button>
                            </div>

                            <!-- 关闭按钮 -->
                            <button class="washing-machine-close-btn" @click.stop="closePopup()">
                                关闭
                            </button>
                        </div>
                    </card-popup>
                `,
                mounted() {
                    // 从本地存储加载卡片顺序
                    this.loadCardOrder();
                }
            });

            // 根据 config.js 的 cards 配置自动注册卡片组件，无需逐个写死
            const cardConfig = window.AppConfig && window.AppConfig.cards;

            if (Array.isArray(cardConfig)) {
                cardConfig.forEach(card => {
                    const Component = card.name && window[card.name];
                    if (Component && card.tag) {
                        homeApp.component(card.tag, Component);
                    }
                });
            } else {
                // 后备方案：直接注册
                if (window.Card1x1Component) {
                    homeApp.component('card-1x1', window.Card1x1Component);
                }
                if (window.Card1x2Component) {
                    homeApp.component('card-1x2', window.Card1x2Component);
                }
            }

            // 挂载应用
            homeApp.mount(container);
            this.vueApp = homeApp;
        }
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.HomePage.init();
        });
    } else {
        window.HomePage.init();
    }
}

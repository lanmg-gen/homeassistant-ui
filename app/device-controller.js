/**
 * Home Assistant 设备控制通用方法
 * 提供各种设备类型的控制逻辑
 */

const DeviceController = {
    /**
     * 处理设备点击
     * @param {Object} device - 设备配置对象
     */
    async handleDeviceClick(device) {
        try {
            // 忽略设置类型的卡片，它们不走设备控制流程
            if (device.deviceType === 'settings') {
                // 设置类型卡片，跳过设备控制
                return;
            }
            
            switch (device.deviceType) {
                case 'light':
                    await this.controlLight(device);
                    break;
                case 'switch':
                    await this.controlSwitch(device);
                    break;
                case 'vacuum':
                    await this.controlVacuum(device);
                    break;
                case 'feeder':
                    await this.controlFeeder(device);
                    break;
                case 'climate':
                    await this.controlClimate(device);
                    break;
                case 'display':
                    break;
                case 'url':
                    this.controlUrl(device);
                    break;
            }
        } catch (error) {
            // 控制设备失败
            this.showError(error.message);
        }
    },

    /**
     * 控制灯光设备
     * @param {Object} device - 设备配置
     */
    async controlLight(device) {
        // 优先使用 controlEntity，否则使用 stateEntity
        const entityId = device.controlEntity || device.stateEntity;
        // 防护：检查实体ID是否有效
        if (!entityId || entityId === 'Error' || typeof entityId !== 'string' || !entityId.includes('.')) {
            console.error(`[DeviceController] 灯光设备实体ID无效: ${entityId}`, device);
            this.showError('设备配置错误，无法控制');
            return;
        }
        
        const currentState = await window.haConnection.getDeviceState(entityId);
        const newState = currentState === 'on' ? 'off' : 'on';
        const service = newState === 'on' ? 'turn_on' : 'turn_off';

        await window.haConnection.callService('light', service, {
            entity_id: entityId
        });
    },

    /**
     * 控制开关设备
     * @param {Object} device - 设备配置
     */
    async controlSwitch(device) {
        // 优先使用 controlEntity，否则使用 stateEntity
        const entityId = device.controlEntity || device.stateEntity;
        // 防护：检查实体ID是否有效
        if (!entityId || entityId === 'Error' || typeof entityId !== 'string' || !entityId.includes('.')) {
            console.error(`[DeviceController] 开关设备实体ID无效: ${entityId}`, device);
            this.showError('设备配置错误，无法控制');
            return;
        }
        
        const currentState = await window.haConnection.getDeviceState(entityId);
        const newState = currentState === 'on' ? 'off' : 'on';
        const service = newState === 'on' ? 'turn_on' : 'turn_off';

        await window.haConnection.callService('switch', service, {
            entity_id: entityId
        });
    },

    /**
     * 控制扫地机器人
     * @param {Object} device - 设备配置
     */
    async controlVacuum(device) {
        // 优先使用 controlEntity，否则使用 stateEntity
        const entityId = device.controlEntity || device.stateEntity;
        // 防护：检查实体ID是否有效
        if (!entityId || entityId === 'Error' || typeof entityId !== 'string' || !entityId.includes('.')) {
            console.error(`[DeviceController] 扫地机设备实体ID无效: ${entityId}`, device);
            this.showError('设备配置错误，无法控制');
            return;
        }
        
        const currentState = await window.haConnection.getDeviceState(entityId);

        if (currentState === 'cleaning' || currentState === 'returning') {
            // 如果正在清扫或返回,则暂停
            await window.haConnection.callService('vacuum', 'pause', {
                entity_id: entityId
            });
        } else if (currentState === 'docked' || currentState === 'idle') {
            // 如果在底座或空闲,则开始清扫
            await window.haConnection.callService('vacuum', 'start', {
                entity_id: entityId
            });
        } else {
            // 返回底座
            await window.haConnection.callService('vacuum', 'return_to_base', {
                entity_id: entityId
            });
        }
    },

    /**
     * 控制宠物投喂器
     * @param {Object} device - 设备配置
     */
    async controlFeeder(device) {
        // 防护：检查实体ID是否有效
        const controlEntity = device.controlEntity || device.stateEntity;
        if (!controlEntity || controlEntity === 'Error' || typeof controlEntity !== 'string' || !controlEntity.includes('.')) {
            console.error(`[DeviceController] 投喂器设备实体ID无效: ${controlEntity}`, device);
            this.showError('设备配置错误，无法控制');
            return;
        }

        await window.haConnection.callService('number', 'set_value', {
            entity_id: controlEntity,
            value: 1
        });
    },

    /**
     * 控制空调
     * @param {Object} device - 设备配置
     */
    async controlClimate(device) {
        // 优先使用 controlEntity，否则使用 stateEntity
        const entityId = device.controlEntity || device.stateEntity;
        // 防护：检查实体ID是否有效
        if (!entityId || entityId === 'Error' || typeof entityId !== 'string' || !entityId.includes('.')) {
            console.error(`[DeviceController] 空调设备实体ID无效: ${entityId}`, device);
            this.showError('设备配置错误，无法控制');
            return;
        }
        
        const currentState = await window.haConnection.getDeviceState(entityId);

        // 简单切换开关状态
        if (currentState === 'off' || currentState === 'idle') {
            await window.haConnection.callService('climate', 'turn_on', {
                entity_id: entityId
            });
        } else {
            await window.haConnection.callService('climate', 'turn_off', {
                entity_id: entityId
            });
        }
    },

    /**
     * 控制 URL 类型设备
     * @param {Object} device - 设备配置
     */
    controlUrl(device) {
        if (device.controlUrl) {
            window.open(device.controlUrl, '_blank');
        }
    },

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    showError(message) {
        if (window.vant && window.vant.Toast) {
            window.vant.Toast.fail(message);
        }
    },

    /**
     * 获取设备状态文本
     * @param {string} state - 设备状态
     * @returns {string}
     */
    getStateText(state) {
        const stateMap = {
            'on': '已开启',
            'off': '已关闭',
            'unavailable': '不可用',
            'cleaning': '清扫中',
            'docked': '已回充',
            'idle': '空闲',
            'returning': '返回中',
            'cooling': '制冷',
            'heating': '制热',
            'dry': '干燥',
            'fan_only': '送风'
        };
        return stateMap[state] || state;
    }
};

// 导出到全局
window.DeviceController = DeviceController;

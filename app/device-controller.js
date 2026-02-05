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
                return;
            }

            switch (device.deviceType) {
                case 'light':
                    await this.controlToggleDevice(device, 'light');
                    break;
                case 'switch':
                    await this.controlToggleDevice(device, 'switch');
                    break;
                case 'vacuum':
                    await this.controlVacuum(device);
                    break;
                case 'feeder':
                    await this.controlFeeder(device);
                    break;
                case 'climate':
                    await this.controlToggleDevice(device, 'climate', true);
                    break;
                case 'display':
                    break;
                case 'url':
                    this.controlUrl(device);
                    break;
            }
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * 验证实体ID是否有效
     * @param {string} entityId - 实体ID
     * @param {string} deviceType - 设备类型（用于日志）
     * @returns {boolean}
     */
    _isValidEntityId(entityId, deviceType) {
        if (!entityId || entityId === 'Error' || typeof entityId !== 'string' || !entityId.includes('.')) {
            console.error(`[DeviceController] ${deviceType}设备实体ID无效: ${entityId}`);
            this.showError('设备配置错误，无法控制');
            return false;
        }
        return true;
    },

    /**
     * 通用开关设备控制方法
     * @param {Object} device - 设备配置
     * @param {string} domain - Home Assistant 域名（light, switch, climate等）
     * @param {boolean} [simpleToggle=false] - 是否简单开关（不支持状态切换，只根据当前开关）
     */
    async controlToggleDevice(device, domain, simpleToggle = false) {
        const entityId = device.controlEntity || device.stateEntity;

        if (!this._isValidEntityId(entityId, domain)) {
            return;
        }

        const currentState = await window.haConnection.getDeviceState(entityId);

        if (simpleToggle) {
            // 简单开关：只根据当前开关状态
            const service = (currentState === 'off' || currentState === 'idle') ? 'turn_on' : 'turn_off';
            await window.haConnection.callService(domain, service, { entity_id: entityId });
        } else {
            // 普通开关：根据当前状态切换
            const newState = currentState === 'on' ? 'off' : 'on';
            const service = newState === 'on' ? 'turn_on' : 'turn_off';
            await window.haConnection.callService(domain, service, { entity_id: entityId });
        }
    },

    /**
     * 控制扫地机器人
     * @param {Object} device - 设备配置
     */
    async controlVacuum(device) {
        const entityId = device.controlEntity || device.stateEntity;

        if (!this._isValidEntityId(entityId, 'vacuum')) {
            return;
        }

        const currentState = await window.haConnection.getDeviceState(entityId);

        let service;
        if (currentState === 'cleaning' || currentState === 'returning') {
            service = 'pause';
        } else if (currentState === 'docked' || currentState === 'idle') {
            service = 'start';
        } else {
            service = 'return_to_base';
        }

        await window.haConnection.callService('vacuum', service, { entity_id: entityId });
    },

    /**
     * 控制宠物投喂器
     * @param {Object} device - 设备配置
     */
    async controlFeeder(device) {
        const controlEntity = device.controlEntity || device.stateEntity;

        if (!this._isValidEntityId(controlEntity, '投喂器')) {
            return;
        }

        await window.haConnection.callService('number', 'set_value', {
            entity_id: controlEntity,
            value: 1
        });
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

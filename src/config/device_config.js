/**
 * 智慧家庭控制中心 - 设备卡片配置文件
 *
 * 用途说明：此文件用于集中管理所有设备的配置信息，包括状态栏卡片和设备控制卡片
 *
 * 配置说明：
 * 1. 修改配置后刷新页面即可生效，无需修改代码
 * 2. 所有设备配置集中管理，便于维护和更新
 * 3. 新增设备时，按照现有格式添加配置对象并加入相应的列表即可
 */

// ========================================
// 状态栏设备配置
// ========================================

/**
 * 状态栏卡片配置说明
 *
 * 状态栏显示在页面顶部，用于快速查看重要设备的状态
 * 每个状态卡片包含以下属性：
 * - name: 卡片显示名称
 * - icon: 卡片图标（emoji表情）
 * - stateEntity: 状态实体ID（获取设备实时状态）
 * - counterEntity: 计数器实体ID（仅投喂器使用，显示投喂次数）
 * - timerEntity: 计时器实体ID（仅氛围灯使用，显示倒计时）
 * - description: 设备说明描述
 */

// 扫地机器人状态卡片配置
const STATUS_VACUUM = {
    name: '扫地机',              // 卡片显示名称
    icon: '🤖',                 // 卡片图标
    stateEntity: 'vacuum.viomi_cn_374919338_v7',  // 状态实体ID，用于获取设备状态
    description: '扫地机器人状态显示'
};

// 氛围灯倒计时状态卡片配置
const STATUS_AMBIENT_LIGHT = {
    name: '氛围灯',             // 卡片显示名称
    icon: '💡',                // 卡片图标
    stateEntity: 'timer.fen_wei_deng_dao_ji_shi', // 状态实体ID
    timerEntity: 'light.fen_wei_deng_zhu_wo_ding_deng', // 计时器实体ID
    description: '氛围灯状态和倒计时显示'
};

// 投喂器状态卡片配置
const STATUS_PET_FEEDING = {
    name: '投喂器',             // 卡片显示名称
    icon: '🐾',                // 卡片图标
    counterEntity: 'counter.chong_wu_tou_wei_lei_ji', // 计数器实体ID，用于显示投喂次数
    description: '宠物投喂器投喂次数统计'
};

// ========================================
// 设备控制卡片配置
// ========================================

/**
 * 设备控制卡片配置说明
 *
 * 设备控制卡片显示在页面中央，用于控制各类智能家居设备
 * 每个设备卡片包含以下属性：
 * - name: 卡片显示名称
 * - icon: 卡片图标（emoji表情）
 * - stateEntity: 状态实体ID，用于获取设备当前状态
 * - controlEntity: 控制实体ID，用于发送控制命令（通常与stateEntity相同）
 * - deviceType: 设备类型，决定控制方式
 *   - 'light': 灯具类（开关控制）
 *   - 'vacuum': 扫地机类（开始/停止/回充）
 *   - 'feeder': 投喂器类（点击投喂）
 *   - 'switch': 开关类（电器设备，如热水器等）
 *   - 'climate': 空调类（制冷/制热控制）
 *   - 'url': URL链接类（打开指定网页）
 *   - 'display': 显示类（仅显示传感器数据，无控制功能）
 * - span: 卡片跨度（可选），默认为1，设置为2表示占用2个卡片宽度
 * - controlUrl: URL地址（仅url类型设备使用）
 * - description: 设备功能说明
 * - sensors: 传感器实体对象（仅display类型设备使用）
 *
 * 新增设备步骤：
 * 1. 参照现有格式创建新的设备配置对象
 * 2. 在下方的 DEVICE_CARDS 列表中添加该配置对象
 * 3. 在 DEVICE_CONFIGS 对象中添加导出条目（可选，用于按名称查找）
 * 4. 刷新页面查看效果
 */

// 扫地机器人控制卡片
const DEVICE_VACUUM = {
    name: '扫地机器人',
    icon: '🤖',
    stateEntity: 'vacuum.viomi_cn_374919338_v7',
    controlEntity: 'vacuum.viomi_cn_374919338_v7',
    deviceType: 'vacuum',
    description: '扫地机器人开关控制'
};

// 氛围灯控制卡片
const DEVICE_AMBIENT_LIGHT = {
    name: '氛围灯',
    icon: '💡',
    stateEntity: 'timer.fen_wei_deng_dao_ji_shi',
    controlEntity: 'light.fen_wei_deng_zhu_wo_ding_deng',
    deviceType: 'light',
    description: '主卧氛围灯开关控制'
};

// 宠物投喂控制卡片
const DEVICE_PET_FEEDING = {
    name: '宠物投喂',
    icon: '🐾',
    stateEntity: 'counter.chong_wu_tou_wei_lei_ji',//这个是用来显示投喂次数的
    controlEntity: 'number.chong_wu_wei_shi_qi_feed', // 这个是用来投喂的(正确的number实体)
    deviceType: 'feeder',
    description: '宠物投喂器控制，点击投喂一份'
};

// 餐厅灯控制卡片
const DEVICE_DINING_LIGHT = {
    name: '餐厅灯',
    icon: '🍽️',
    stateEntity: 'light.can_ting_deng_kai_guan_1',
    controlEntity: 'light.can_ting_deng_kai_guan_1',
    deviceType: 'light',
    description: '餐厅灯开关控制'
};

// 厨房灯控制卡片
const DEVICE_KITCHEN_LIGHT = {
    name: '厨房灯',
    icon: '🍳',
    stateEntity: 'light.chu_fang_kai_guan_1',
    controlEntity: 'light.chu_fang_kai_guan_1',
    deviceType: 'light',
    description: '厨房灯开关控制'
};

// 客厅灯控制卡片
const DEVICE_LIVING_ROOM_LIGHT = {
    name: '客厅灯',
    icon: '🛋️',
    stateEntity: 'light.ke_ting_kai_guan_1',
    controlEntity: 'light.ke_ting_kai_guan_1',
    deviceType: 'light',
    description: '客厅灯开关控制'
};

// 次卧灯控制卡片
const DEVICE_SECOND_BEDROOM_LIGHT = {
    name: '次卧灯',
    icon: '🛏️',
    stateEntity: 'light.ci_wo_kai_guan_1',
    controlEntity: 'light.ci_wo_kai_guan_1',
    deviceType: 'light',
    description: '次卧灯开关控制'
};

// 工作室灯控制卡片
const DEVICE_GUEST_BEDROOM_LIGHT = {
    name: '工作室灯',
    icon: '🔧',
    stateEntity: 'light.yin_wo_ding_deng_yin_wo_ding_deng',
    controlEntity: 'light.yin_wo_ding_deng_yin_wo_ding_deng',
    deviceType: 'light',
    description: '工作室灯开关控制'
};

// 主卧灯控制卡片
const DEVICE_MASTER_BEDROOM_LIGHT = {
    name: '主卧灯',
    icon: '🛏️',
    stateEntity: 'light.zhu_wo_deng_kai_guan_1',
    controlEntity: 'light.zhu_wo_deng_kai_guan_1',
    deviceType: 'light',
    description: '主卧灯开关控制'
};

// 卫生间灯控制卡片
const DEVICE_BATHROOM_LIGHT = {
    name: '卫生间灯',
    icon: '🚽',
    stateEntity: 'light.wei_sheng_jian_guo_dao_1_wei_sheng_jian',
    controlEntity: 'light.wei_sheng_jian_guo_dao_1_wei_sheng_jian',
    deviceType: 'light',
    description: '卫生间灯开关控制'
};

// 卫生间走廊1灯控制卡片
const DEVICE_CORRIDOR1_LIGHT = {
    name: '走廊1',
    icon: '🚪',
    stateEntity: 'light.wei_sheng_jian_guo_dao_1_guo_dao_1',
    controlEntity: 'light.wei_sheng_jian_guo_dao_1_guo_dao_1',
    deviceType: 'light',
    description: '卫生间走廊1灯开关控制'
};

// 客厅走廊3灯控制卡片
const DEVICE_CORRIDOR3_LIGHT = {
    name: '走廊2',
    icon: '🚪',
    stateEntity: 'light.ke_ting_kai_guan_2',
    controlEntity: 'light.ke_ting_kai_guan_2',
    deviceType: 'light',
    description: '客厅走廊3灯开关控制'
};

// 空调控制卡片（占用2个卡片宽度）
const DEVICE_AIR_CONDITIONER = {
    name: '空调',
    icon: '❄️',
    stateEntity: 'climate.xiaomi_cn_992505569_h39h00',
    controlEntity: 'climate.xiaomi_cn_992505569_h39h00',
    deviceType: 'climate',
    span: 2,  // 占用2个卡片宽度
    description: '空调控制（制冷/制热）'
};

// 客厅走廊3灯控制卡片
const DEVICE_WATER_HEATER = {
    name: '热水器',
    icon: '🚿',
    stateEntity: 'switch.yu_shi_re_shui_qi_kai_guan_switch_1',
    controlEntity: 'switch.yu_shi_re_shui_qi_kai_guan_switch_1',
    deviceType: 'switch',
    description: '热水器开关控制'
};

// 冰箱温度显示卡片
const DEVICE_FRIDGE = {
    name: '冰箱温度',
    icon: '🧊',
    stateEntity: 'sensor.midjd6_cn_590940698_610_temperature_p_3_1',  // 冷藏温度作为主状态实体
    deviceType: 'fridge',  // 专用冰箱类型
    description: '冷藏/冷冻温度显示',
    // 传递给1x1组件的自定义属性
    customProps: {
        fridgeSensor: 'sensor.midjd6_cn_590940698_610_temperature_p_3_1',
        freezerSensor: 'sensor.midjd6_cn_590940698_610_temperature_p_4_1'
    }
};

// 洗衣机控制卡片
const DEVICE_WASHING_MACHINE = {
    name: '洗衣机',
    icon: '👕',
    deviceType: 'washingmachine',
    description: '洗衣机状态监控',
    // 核心状态实体
    stateEntity: 'sensor.mibx2_cn_476777181_v6_status_p_2_2',  // 洗衣机状态（关机/待机中/暂停中/工作中/预约中）
    // 工作阶段
    stageEntity: 'sensor.mibx2_cn_476777181_v6_stroke_p_3_6',  // 当前阶段（None/Weighing/Washing/Rinsing/Spin）
    // 剩余时间
    timeRemainingEntity: 'sensor.mibx2_cn_476777181_v6_left_time_p_2_10',  // 剩余工作时间（分钟）
    // 故障状态
    faultEntity: 'sensor.mibx2_cn_476777181_v6_fault_p_2_4',  // 故障状态
    // 模式选择
    modeEntity: 'select.mibx2_cn_476777181_v6_mode_p_2_3',  // 洗涤模式（日常洗/快速洗/大件洗等）
    // 控制按钮
    startButton: 'button.mibx2_cn_476777181_v6_start_wash_a_2_1',  // 开始洗涤
    pauseButton: 'button.mibx2_cn_476777181_v6_pause_a_2_2',  // 暂停
    // 可调参数
    rinseEntity: 'number.mibx2_cn_476777181_v6_rinsh_times_p_2_6',  // 漂洗次数
    waterLevelEntity: 'number.mibx2_cn_476777181_v6_target_water_level_p_2_11',  // 目标水量
    // 开关
    powerSwitch: 'switch.mibx2_cn_476777181_v6_on_p_2_1',  // 洗衣机开关
    childLock: 'switch.mibx2_cn_476777181_v6_physical_controls_locked_p_4_1'  // 童锁
};

// ========================================
// 设备卡片列表（按显示顺序排列）
// ========================================

/**
 * 设备控制卡片配置列表
 *
 * 说明：
 * - 此列表决定了设备卡片在页面上的显示顺序
 * - 数组中设备的顺序即页面显示的顺序（从左到右，从上到下）
 *
 * 管理方法：
 * - 添加新设备：在此列表中添加新配置对象
 * - 删除设备：从此列表中移除相应配置对象
 * - 调整顺序：在此列表中调整配置对象的位置
 */
const DEVICE_CARDS = [
    DEVICE_VACUUM,                    // 0. 扫地机器人
    DEVICE_AMBIENT_LIGHT,             // 1. 氛围灯
    DEVICE_PET_FEEDING,               // 2. 宠物投喂
    DEVICE_DINING_LIGHT,              // 3. 餐厅灯
    DEVICE_KITCHEN_LIGHT,             // 4. 厨房灯
    DEVICE_LIVING_ROOM_LIGHT,         // 5. 客厅灯
    DEVICE_SECOND_BEDROOM_LIGHT,      // 6. 次卧灯
    DEVICE_GUEST_BEDROOM_LIGHT,       // 7. 工作室灯
    DEVICE_MASTER_BEDROOM_LIGHT,      // 8. 主卧灯
    DEVICE_BATHROOM_LIGHT,            // 9. 卫生间灯
    DEVICE_CORRIDOR1_LIGHT,           // 10. 走廊1
    DEVICE_CORRIDOR3_LIGHT,           // 11. 走廊2
    DEVICE_WATER_HEATER,              // 12. 热水器
    DEVICE_AIR_CONDITIONER,            // 13. 空调（2个卡片宽度）
    DEVICE_FRIDGE,                    // 15. 冰箱温度（显示专用）
    DEVICE_WASHING_MACHINE            // 16. 洗衣机
];

// ========================================
// 导出配置（供其他文件使用）
// ========================================

/**
 * 设备配置导出对象
 *
 * 说明：
 * - DEVICE_CONFIGS: 将所有设备配置导出为对象，支持按名称查找
 * - STATUS_CONFIGS: 将状态栏配置导出为对象
 *
 * 使用方式：
 * - 在其他文件中引入此配置文件即可使用
 * - 例如：DEVICE_CARDS[0].name 获取第一个设备的名称
 */

// 将所有设备配置导出为对象，方便按名称查找
const DEVICE_CONFIGS = {
    vacuum: DEVICE_VACUUM,
    ambientLight: DEVICE_AMBIENT_LIGHT,
    petFeeding: DEVICE_PET_FEEDING,
    diningLight: DEVICE_DINING_LIGHT,
    kitchenLight: DEVICE_KITCHEN_LIGHT,
    livingRoomLight: DEVICE_LIVING_ROOM_LIGHT,
    secondBedroomLight: DEVICE_SECOND_BEDROOM_LIGHT,
    guestBedroomLight: DEVICE_GUEST_BEDROOM_LIGHT,
    masterBedroomLight: DEVICE_MASTER_BEDROOM_LIGHT,
    bathroomLight: DEVICE_BATHROOM_LIGHT,
    corridor1Light: DEVICE_CORRIDOR1_LIGHT,
    corridor3Light: DEVICE_CORRIDOR3_LIGHT,
    waterHeater: DEVICE_WATER_HEATER,
    airConditioner: DEVICE_AIR_CONDITIONER,
    fridge: DEVICE_FRIDGE,
    washingMachine: DEVICE_WASHING_MACHINE
};

// 状态栏配置导出
const STATUS_CONFIGS = {
    vacuum: STATUS_VACUUM,
    ambientLight: STATUS_AMBIENT_LIGHT,
    petFeeding: STATUS_PET_FEEDING
};

// 导出到全局对象
window.DEVICE_CARDS = DEVICE_CARDS;

// 确保 window.DEVICE_CARDS 存在
if (!window.DEVICE_CARDS) {
    window.DEVICE_CARDS = DEVICE_CARDS;
}
window.DEVICE_CONFIGS = DEVICE_CONFIGS;
window.STATUS_CONFIGS = STATUS_CONFIGS;


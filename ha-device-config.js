/**
 * 智慧家庭控制中心 - 设备卡片配置文件
 *
 * 用途说明：此文件用于集中管理所有设备的配置信息，包括HA连接参数、状态栏卡片和设备控制卡片
 *
 * 配置说明：
 * 1. 修改配置后刷新页面即可生效，无需修改代码
 * 2. 所有设备配置集中管理，便于维护和更新
 * 3. 新增设备时，按照现有格式添加配置对象并加入相应的列表即可
 */

// ========================================
// Home Assistant 连接配置
// ========================================

/**
 * Home Assistant 服务器连接配置
 * 
 * 参数说明：
 * - url: Home Assistant 服务器地址（本地网络地址或公网地址），格式：http://IP:端口
 * - token: Home Assistant 长期访问令牌
 * 
 * 获取令牌方式：
 * 1. 登录 Home Assistant 网页界面
 * 2. 点击左下角用户名 -> 向下滚动找到"长期访问令牌" -> 点击"创建令牌"
 * 3. 填写令牌名称（如：智慧家庭控制中心），复制生成的令牌
 * 
 * 注意事项：
 * - token 建议留空，通过页面设置界面配置更安全
 * - 如在此处配置，token 将作为默认值使用
 */
const HA_CONFIG = {
    url: 'http://192.168.4.5:8123',  // Home Assistant 服务器地址
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhYTZlOTM3MWFjZDg0NTlkYTJkM2ZlMWQ5MDg1N2IwMCIsImlhdCI6MTc2ODcwODc1MiwiZXhwIjoyMDg0MDY4NzUyfQ.o911fMvo6C4DoIG3vwbRH_7IiL55SWigB3RgDX-ZPgE'  // 访问令牌（建议留空，通过页面设置界面配置）
};

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
    stateEntity: 'light.zhu_wo_deng_zhu_wo_deng', // 状态实体ID
    timerEntity: 'timer.fen_wei_deng_dao_ji_shi', // 计时器实体ID
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
    stateEntity: 'light.zhu_wo_deng_zhu_wo_deng',
    controlEntity: 'light.zhu_wo_deng_zhu_wo_deng',
    deviceType: 'light',
    description: '主卧氛围灯开关控制'
};

// 宠物投喂控制卡片
const DEVICE_PET_FEEDING = {
    name: '宠物投喂',
    icon: '🐾',
    stateEntity: 'counter.chong_wu_tou_wei_lei_ji',
    controlEntity: 'number.chong_wu_wei_shi_qi_feed', // 控制实体是number类型，用于设置投喂份数
    deviceType: 'feeder',
    description: '宠物投喂器控制，点击投喂一份'
};

// 餐厅灯控制卡片
const DEVICE_DINING_LIGHT = {
    name: '餐厅灯',
    icon: '💡',
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

// 3D打印机控制卡片
const DEVICE_PRINTER_3D = {
    name: 'voron2.4',
    icon: '🖨️',
    controlUrl: 'http://192.168.4.6/?printer=98cf22853c45c005073ff07237fed9d9#/',
    powerEntity: 'switch.3dda_yin_ji',
    deviceType: 'url',
    description: '3D打印机控制（弹窗显示）'
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
    deviceType: 'display',
    description: '冷藏/冷冻温度显示',
    sensors: {
        fridge: 'sensor.midjd6_cn_590940698_610_temperature_p_3_1',  // 冷藏温度
        freezer: 'sensor.midjd6_cn_590940698_610_temperature_p_4_1'  // 冷冻温度
    }
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
    DEVICE_VACUUM,                    // 1. 扫地机器人
    DEVICE_AMBIENT_LIGHT,             // 2. 氛围灯
    DEVICE_PET_FEEDING,               // 3. 宠物投喂
    DEVICE_DINING_LIGHT,              // 4. 餐厅灯
    DEVICE_KITCHEN_LIGHT,             // 5. 厨房灯
    DEVICE_LIVING_ROOM_LIGHT,         // 6. 客厅灯
    DEVICE_SECOND_BEDROOM_LIGHT,      // 7. 次卧灯
    DEVICE_GUEST_BEDROOM_LIGHT,       // 8. 工作室灯
    DEVICE_MASTER_BEDROOM_LIGHT,      // 9. 主卧灯
    DEVICE_BATHROOM_LIGHT,            // 10. 卫生间灯
    DEVICE_CORRIDOR1_LIGHT,           // 11. 走廊1
    DEVICE_CORRIDOR3_LIGHT,           // 12. 走廊2
    DEVICE_WATER_HEATER,              // 13. 热水器
    DEVICE_AIR_CONDITIONER,            // 14. 空调（2个卡片宽度）
    DEVICE_PRINTER_3D,                // 15. 3D打印机
    DEVICE_FRIDGE                     // 16. 冰箱温度（显示专用）

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
    ambientLight: STATUS_AMBIENT_LIGHT,
    petFeeding: STATUS_PET_FEEDING,
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
    printer3D: DEVICE_PRINTER_3D,
    fridge: DEVICE_FRIDGE
};

// 状态栏配置导出
const STATUS_CONFIGS = {
    vacuum: STATUS_VACUUM,
    ambientLight: STATUS_AMBIENT_LIGHT,
    petFeeding: STATUS_PET_FEEDING
};

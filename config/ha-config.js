/**
 * 智慧家庭控制中心 - 应用配置文件
 *
 * 说明：此文件用于管理应用级别的配置
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
// 天气配置
// ========================================

/**
 * 天气API配置
 * 使用免费天气API，无需申请密钥
 */
const WEATHER_API_CITY = '达拉特旗'; // 城市名称






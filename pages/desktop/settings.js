/**
 * 设置 - 桌面端逻辑
 */

// 避免重复声明
if (!window.SettingsPageDesktop) {
    window.SettingsPageDesktop = {
        // 初始化
        init() {
            this.bindEvents();
        },
        
        // 绑定事件
        bindEvents() {
            const settingsItems = document.querySelectorAll('.settings-item');
            settingsItems.forEach(item => {
                item.addEventListener('click', () => this.handleSettingsClick(item));
            });
        },
        
        // 处理设置项点击
        handleSettingsClick(item) {
            const settingName = item.querySelector('h3').textContent;
            
            // 触发设置点击事件
            window.dispatchEvent(new CustomEvent('settings-navigate', {
                detail: { name: settingName }
            }));
            
            // 显示提示
            if (window.showToast) {
                window.showToast(`打开: ${settingName}`);
            }
        }
    };
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SettingsPageDesktop.init();
        });
    } else {
        window.SettingsPageDesktop.init();
    }
}

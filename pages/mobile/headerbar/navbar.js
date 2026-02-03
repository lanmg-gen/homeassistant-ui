/**
 * 移动端顶部导航栏逻辑
 */

// 避免重复声明
if (!window.MobileNavbar) {
    window.MobileNavbar = {
        // 初始化
        init() {
            this.bindEvents();
        },
        
        // 绑定事件
        bindEvents() {
            const menuIcon = document.querySelector('.navbar-left .navbar-icon');
            const notificationIcon = document.querySelector('.navbar-right .navbar-icon');
            
            if (menuIcon) {
                menuIcon.addEventListener('click', () => this.handleMenuClick());
            }
            
            if (notificationIcon) {
                notificationIcon.addEventListener('click', () => this.handleNotificationClick());
            }
        },
        
        // 处理菜单点击
        handleMenuClick() {
            if (window.showToast) {
                window.showToast('打开菜单');
            }
        },
        
        // 处理通知点击
        handleNotificationClick() {
            if (window.showToast) {
                window.showToast('查看通知');
            }
        }
    };
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.MobileNavbar.init();
        });
    } else {
        window.MobileNavbar.init();
    }
}

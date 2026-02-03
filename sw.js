/**
 * Service Worker - 离线缓存支持
 * 提供静态资源缓存、API响应缓存、后台同步
 */

// 获取当前脚本路径，支持子目录部署
const SCRIPT_URL = new URL(self.scriptURL || self.location.href);
const BASE_PATH = SCRIPT_URL.pathname.replace(/sw\.js$/, '');

const CACHE_NAME = 'smart-home-v1';
const STATIC_ASSETS = [
    BASE_PATH || './',
    BASE_PATH + 'index.html',
    BASE_PATH + 'index.css',
    BASE_PATH + 'index.js',
    BASE_PATH + 'libs/vue.global.js'
];

const API_CACHE_NAME = 'smart-home-api-v1';
const API_CACHE_MAX_AGE = 30000; // API缓存30秒

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
    console.log('[SW] 安装中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] 缓存静态资源');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => {
                console.error('[SW] 缓存失败:', err);
            })
    );
    
    self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[SW] 激活中...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
                    .map(name => {
                        console.log('[SW] 删除旧缓存:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    
    self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 只处理同域请求
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // API请求处理
    if (url.pathname.includes('/api/')) {
        event.respondWith(handleAPIRequest(request));
        return;
    }
    
    // 静态资源处理
    event.respondWith(handleStaticRequest(request));
});

/**
 * 处理静态资源请求
 */
async function handleStaticRequest(request) {
    // 1. 先尝试从缓存获取
    const cached = await caches.match(request);
    if (cached) {
        // 后台更新缓存
        fetch(request).then(response => {
            if (response.ok) {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, response);
                });
            }
        });
        return cached;
    }
    
    // 2. 缓存未命中，从网络获取
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // 缓存响应
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[SW] 静态资源获取失败:', error);
        return new Response('离线中', { status: 503 });
    }
}

/**
 * 处理API请求
 */
async function handleAPIRequest(request) {
    // 1. 先尝试从网络获取（优先实时数据）
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 缓存API响应
            const cache = await caches.open(API_CACHE_NAME);
            const responseToCache = networkResponse.clone();
            
            // 添加缓存时间戳
            const headers = new Headers(responseToCache.headers);
            headers.set('x-cache-time', Date.now().toString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers
            });
            
            cache.put(request, cachedResponse);
            
            return networkResponse;
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] 网络请求失败，尝试使用缓存:', error);
        
        // 2. 网络失败，尝试从缓存获取
        const cached = await caches.match(request);
        
        if (cached) {
            // 检查缓存是否过期
            const cacheTime = cached.headers.get('x-cache-time');
            if (cacheTime && Date.now() - parseInt(cacheTime) < API_CACHE_MAX_AGE) {
                console.log('[SW] 返回缓存的API响应');
                return cached;
            }
        }
        
        // 3. 缓存也过期或不存在
        console.log('[SW] 无可用缓存');
        return new Response(
            JSON.stringify({ error: '离线中，无可用缓存' }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// 后台同步
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-device-states') {
        event.waitUntil(syncDeviceStates());
    }
});

/**
 * 同步设备状态
 */
async function syncDeviceStates() {
    console.log('[SW] 后台同步设备状态');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'sync-states' });
    });
}

// 推送通知支持
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    
    event.waitUntil(
        self.registration.showNotification(data.title || '智能家居', {
            body: data.body || '设备状态变化',
            icon: '/icon.png',
            badge: '/badge.png',
            data: data.data
        })
    );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        self.clients.openWindow('/')
    );
});

/* 养殖记账本 Service Worker:网络优先,离线兜底。
   策略:能联网就用最新版本(保证网站更新及时生效),断网时用缓存的页面,记账不受影响。
   注意:记账数据存在浏览器 localStorage 里,与 SW 无关,不会被缓存逻辑影响。 */
'use strict';

const CACHE = 'farm-manager-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(['./']); })
      .catch(function () { /* 预缓存失败不阻塞安装(比如某文件缺失) */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  /* 网络优先:成功就更新缓存;失败回退缓存(离线可用) */
  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        }
        return res;
      })
      .catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || Response.error(); });
      })
  );
});

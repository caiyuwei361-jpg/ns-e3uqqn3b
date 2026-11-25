/* 脑屎 · 离线缓存
   程序文件存进手机，之后不联网也能打开。你的数据不在这里（数据只在本机存储里，从不上传）。
   改版本号 = 通知手机有新版本。 */
const VERSION = "mymemory-v0.6.0";
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await cache.match("index.html") : null);
    const net = fetch(req).then(r => {
      // 只缓存本站正常返回的内容（门禁登录页之类的跳转不缓存）
      if (r.ok && !r.redirected && r.type === "basic") cache.put(req, r.clone());
      return r;
    }).catch(() => hit);
    return hit || net;
  })());
});

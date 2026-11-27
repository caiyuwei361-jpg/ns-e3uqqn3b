/* 脑屎 · 离线缓存
   程序文件存进手机，之后不联网也能打开。你的数据不在这里（数据只在本机存储里，从不上传）。
   联网时：总是先拿最新版（所以更新马上生效）；不联网时：用存下来的那份。
   改版本号 = 通知手机有新版本。 */
const VERSION = "mymemory-v0.6.4";
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  // cache:"reload"：跳过浏览器自己的缓存，确保存进来的是服务器上的最新文件
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      // 先联网拿最新的（最多等 4 秒）
      const net = await Promise.race([
        fetch(req, { cache: "no-cache" }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 4000))
      ]);
      // 只缓存本站正常返回的内容（门禁登录页之类的跳转不缓存）
      if (net.ok && !net.redirected && net.type === "basic") cache.put(req, net.clone());
      return net;
    } catch {
      // 没网 / 太慢：用存下来的
      return (await cache.match(req, { ignoreSearch: true })) ||
             (req.mode === "navigate" ? await cache.match("index.html") : undefined) ||
             Response.error();
    }
  })());
});

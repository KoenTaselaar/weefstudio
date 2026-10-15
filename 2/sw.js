const CACHE = 'weefstudio2-v2.8';
const PREFIX = 'weefstudio2-';
const KERN = ['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(KERN)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX) && k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const url = new URL(e.request.url);
  if(url.origin!==location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit = await c.match(e.request, {ignoreSearch:true});
    const vers = fetch(e.request).then(r=>{ if(r && r.ok) c.put(e.request, r.clone()); return r; }).catch(()=>null);
    if(hit){ e.waitUntil(vers); return hit; }
    const r = await vers;
    return r || new Response('Geen verbinding en nog niets in de cache.', {status:503, headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }));
});

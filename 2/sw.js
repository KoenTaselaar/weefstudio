const CACHE = 'paint3k-beta-v1.4';
const PREFIX = 'paint3k-beta-';
const KERN = ['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
const NIETS = ()=>new Response('Geen verbinding en nog niets in de cache.', {status:503, headers:{'Content-Type':'text/plain;charset=utf-8'}});
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(KERN)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX) && k!==CACHE || k.startsWith('weefstudio2-')).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const url = new URL(e.request.url);
  if(url.origin!==location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    if(e.request.mode==='navigate'){
      // de pagina zelf: eerst het net (hooguit 3 s wachten), anders de cache — zo zie je een nieuwe versie bij de eerstvolgende start
      try{
        const r = await Promise.race([fetch(e.request), new Promise((_, nee)=>setTimeout(()=>nee(new Error('traag')), 3000))]);
        if(r && r.ok){ c.put(e.request, r.clone()); return r; }
      }catch(err){}
      return (await c.match(e.request, {ignoreSearch:true})) || (await c.match('./index.html')) || (await c.match('./')) || NIETS();
    }
    const hit = await c.match(e.request, {ignoreSearch:true});
    const vers = fetch(e.request).then(r=>{ if(r && r.ok) c.put(e.request, r.clone()); return r; }).catch(()=>null);
    if(hit){ e.waitUntil(vers); return hit; }
    return (await vers) || NIETS();
  }));
});

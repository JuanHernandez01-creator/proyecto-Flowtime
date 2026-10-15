const V='flowtime-v2';
const CORE=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);
 // Páginas: red primero (para recibir actualizaciones), caché si no hay internet
 if(r.mode==='navigate'){
  e.respondWith(fetch(r).then(res=>{caches.open(V).then(c=>c.put('./index.html',res.clone()));return res}).catch(()=>caches.match('./index.html')));
  return}
 // Resto (incluye Google Fonts): caché primero y se guarda al vuelo
 if(u.origin===location.origin||/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
  e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>h)))}
});

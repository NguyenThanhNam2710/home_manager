/* Service worker: giữ vỏ app để mở được khi mất mạng. Dữ liệu do Firestore tự lưu trên máy. */
var CACHE='fam-ef440deb44';
var SHELL=['./','index.html','fb.js','config.js','manifest.webmanifest','fonts/fonts.css','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
function fromNet(req,ms){
  return new Promise(function(res,rej){
    var t=setTimeout(function(){rej(new Error('timeout'))},ms);
    fetch(req).then(function(r){clearTimeout(t);res(r)},function(e){clearTimeout(t);rej(e)});
  });
}
self.addEventListener('fetch',function(e){
  var req=e.request,u=new URL(req.url);
  if(req.method!=='GET'||u.origin!==location.origin)return;
  if(/\/(fonts|icons)\//.test(u.pathname)){
    e.respondWith(caches.match(req).then(function(m){return m||fetch(req).then(function(r){var c=r.clone();caches.open(CACHE).then(function(x){x.put(req,c)});return r})}));
    return;
  }
  e.respondWith(fromNet(req,4000).then(function(r){var c=r.clone();if(r.ok)caches.open(CACHE).then(function(x){x.put(req,c)});return r}).catch(function(){return caches.match(req,{ignoreSearch:true}).then(function(m){return m||caches.match('index.html')})}));
});

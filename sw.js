/* Service worker: giữ vỏ app để mở được khi mất mạng. Dữ liệu do Firestore tự lưu trên máy. */
var CACHE='fam-3b90944f6e';
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

/* Thông báo đẩy: máy chủ gửi tin dữ liệu {title, body, tag}; ta tự hiện thông báo. */
self.addEventListener('push',function(e){
  var d={};try{var j=e.data?e.data.json():{};d=j.data||j.notification||j}catch(x){}
  e.waitUntil(self.registration.showNotification(d.title||'Nhắc việc',{body:d.body||'',tag:d.tag||undefined,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){if('focus' in cs[i])return cs[i].focus()}
    return self.clients.openWindow('./');
  }));
});

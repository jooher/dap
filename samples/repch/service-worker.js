const

CACHE_NAME = 'v1',

urlsToCache = [
//  '/index.html',
//  '/style.css',
//  '/scan.js',
//  '/0.4.js'
],

events={

	install: event=>{
			console.log("repch.io install")
			event.waitUntil( caches.open(CACHE_NAME).then( cache => cache.addAll(urlsToCache) ) );
		},

	activate: event=>{
			console.log('repch.io activate');
//			db.cleanup();
		},

	//message:

	//sync:

	fetch: event=>
			event.respondWith( caches.match(event.request).then( response => response || fetch(event.request) ) ),

	push:	event=>{  
		  var title = 'Yay a message.';  
		  var body = 'We have received a push message.';  
		  var icon = '/images/smiley.svg';  
		  var tag = 'simple-push-example-tag';
		  event.waitUntil(  
			self.registration.showNotification(title, {  
			  body: body,  
			  icon: icon,  
			  tag: tag  
			})  
		  );  
		}
};

for(const i in events)
	self.addEventListener(i,events[i]);
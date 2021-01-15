const

CACHE_NAME = 'v1',

urlsToCache = [
//  '/index.html',
//  '/style.css',
//  '/scan.js',
//  '/0.4.js'
],

db = (function(){
	
	const
	keep	={
		opinion	: $ => $.entity && $.aspect && ($.credit || $.note),
		entity	: $ => $.title || $.desc || T('opinion', $.entity),
		entry		: $ => T('entity', $.entity),
		listentity	: $ => T('entity', $.entity)
//		list		:
//		cat		:
	}
	
	return {
		
		cleanup:_=>{
			for(let t in keep)try{
				const	I=localStorage.getItem(t),
					T=JSON.parse(I).filter(keep[t]);
				if(T){
					console.log("Cleanup table "+t);
					//console.table(T);
					localStorage.setItem(t,JSON.stringify(T));
				}
			}catch(e){
				console.warn("Cleanup table "+t+" :: "+e.message);
			}
		}
	}
	
})(),

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
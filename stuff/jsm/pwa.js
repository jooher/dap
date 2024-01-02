// register PWA
if(navigator.serviceWorker)
	window.addEventListener('load', e=>
		navigator.serviceWorker.register('service-worker.js')
		.then(registration=>console.log('Registered!'),err=>console.log('Registration failed: ', err))
		.catch(err=>console.log(err))
	)
else
	console.log('service worker not supported');
	
// prevent from exit by back button
(stay =>{
	window.addEventListener('load', stay);
	window.addEventListener('popstate', stay);
})(e=>{window.history.pushState({},'')})
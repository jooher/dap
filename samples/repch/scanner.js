const

	timeout = ms => new Promise(resolve=>setTimeout(resolve, ms)),

	stub = {
		detect: async src=> {await timeout(1); return [{rawValue:"stub"}]; },
	},

	detector = window.BarcodeDetector ? new BarcodeDetector() : stub,
	
	el = (tag,cls)=>{
		const e = document.createElement(tag);
		if(cls)e.className=cls;
		return e;
	},
	
	scanner	= el("scanner"),
	video		= scanner.appendChild(el("video")),
	canvas	= scanner.appendChild(el("canvas")),
	deck		= scanner.appendChild(el("div")),
	cancelbtn	= deck.appendChild(el("button","cancel"));
	
let
	track = null,
	stop	= e => {
		track&&track.stop();
		scanner.parentNode&&scanner.parentNode.removeChild(scanner);
	};

cancelbtn.onclick = stop;


export default async where=>{
	
	let decoded=null;
	
	(where||document.body).appendChild(scanner);
				
	await
		navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:640}})
		.then(stream=>{
			if(stream){
				video.srcObject=stream;
				track	= video.srcObject.getVideoTracks()[0];
			}
			else alert("No stream");
		})
		.catch(alert);

	if(track){
		
		video.play();
		
		let
			context=null,
			w=0,h=0;
			
		while (!decoded && track.readyState==="live") {// && !paused
			if(video.videoWidth!=w){
				canvas.width	= w = video.videoWidth;
				canvas.height	= h = video.videoHeight;
				console.log("video size: "+w+" x "+h);
				context = canvas.getContext('2d');
			}
			if(w>0){
				context.drawImage(video,0,0,w,h);
				
				detector.detect(context.getImageData(0,0,w,h))////video
					.then( barcodes => {
						//barcodes.forEach(barcode => console.log(barcodes.rawValue))
						if(barcodes&&barcodes.length)
							decoded=barcodes[0].rawValue;
					})
					.catch(e=>{
						console.error("Barcode Detection failed: " + e);
						decoded="https://error.com";
					});
			}
			await timeout(25); //paused?1e3:
		};
	}
	
	stop();
	console.log(decoded);
	return decoded;//resolve(decoded); //"1234567890122";//
	
}

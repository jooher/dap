alert("scanner 1");

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
	//canvas	= scanner.appendChild(el("canvas")),
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
	
	let stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:640}});
	
	if(stream){
		video.srcObject=stream;
		track	= video.srcObject.getVideoTracks()[0];
		
		video.play();
		const
			w = video.videoWidth,
			h = video.videoHeight,
			context = canvas.getContext('2d');
			
		canvas.width	= w;
		canvas.height	= h;
		console.log("video size: "+w+" x "+h);
		
		while (!decoded && track.readyState==="live") {
		
			context.drawImage(video,0,0,w,h);
			
			const barcodes = await detector.detect(context.getImageData(0,0,w,h));
			if(barcodes && barcodes.length)
				decoded=barcodes[0].rawValue;
		}
		
		stop();
		console.log(decoded);
		return decoded;//resolve(decoded); //"1234567890122";//
		
	}
	else alert("Can't access media");
/*			
		let
			context=null,
			w=0,h=0;
			if(video.videoWidth!=w){
			}
			if(w>0){
			.then( barcodes => {
				//barcodes.forEach(barcode => console.log(barcodes.rawValue))
				if(barcodes&&barcodes.length)
					;
			})
			.catch(e=>{
				console.error("Barcode Detection failed: " + e);
				decoded="https://error.com";
			});
				
			}
			await timeout(25); //paused?1e3:
		};
	}
*/

}

const

	timeout = ms => new Promise(resolve=>setTimeout(resolve, ms)),

	el = (tag,cls)=>{
		const e = document.createElement(tag);
		if(cls)e.className=cls;
		return e;
	},
		
	scanner	= el("scanner"),
	video		= scanner.appendChild(el("video")),
	canvas	= scanner.appendChild(el("canvas")),
	deck		= scanner.appendChild(el("div")),
	cancelbtn	= deck.appendChild(el("button","cancel")),
	
	detector = window.BarcodeDetector && new BarcodeDetector();
	
	
let
	track = null,
	stop	= e => {
		track&&track.stop();
		scanner.parentNode&&scanner.parentNode.removeChild(scanner);
	};

cancelbtn.onclick = stop;


export default async where=>{
	
	if(!detector)
		return alert("Barcode detection not available");
	
	const
		stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:640}});
	
	if(!stream)
		return alert("Can't access media");
		
	(where||document.body).appendChild(scanner);
	
	video.srcObject=stream;
	track	= video.srcObject.getVideoTracks()[0];
	video.play();
		
	let
		decoded=null,
		context=null,	
		w=0, h=0;
	
	while (!decoded && track.readyState==="live") {
		
		if( w!=video.videoWidth || h!=video.videoHeight){
			canvas.width	= w = video.videoWidth;
			canvas.height	= h = video.videoHeight;
			context = canvas.getContext('2d');
		}
		
		if(w*h){
			context.drawImage(video,0,0,w,h);
			const barcodes = await detector.detect(context.getImageData(0,0,w,h));
			if(barcodes && barcodes.length)
				decoded=barcodes[0].rawValue;
		}
		else
			await timeout(100);
	}
	
	stop();
	console.log(decoded);
	return decoded;

}

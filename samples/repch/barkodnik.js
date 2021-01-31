let
	draw,
	styles={},
	w,
	h,
	ofs=0,
	dump=false,
	;

const

el	= t=>document.createElement(t),

Soft	= Y=>Y.map((n,i)=>Y[i]+Y[i+1]),
Diff	= Y=>Y.map((n,i)=>Y[i]-Y[i-1]),
Sum	= Y=>Y.reduce((a,w)=>a+w),
	
Luma	= rgba=>{
	const	c=rgba.length>>2,
		l=new Array(c);
	for(let i=0,j=0; i<c; i++,j+=4)
		l[i]=rgba[j]+rgba[j+1]+rgba[j+2];
	return l
},

Spans	= (D,thresh)=>{
	
	const
		spans	= Array(200),
		len	= D.length-1,
		FLAT	= len*5/(14*7),
		LEAST	= 40;
		
	let	x=0, count=0, d=0, w=0, dd=0, yy=0;
	
	spans[0]=0;
		
	while(x<len){
		
		let	x0=x;
		
		draw.I(x0,'rgba(0,100,0,.25)');
		
		while( x<len ){
			d=D[x];
			if(d*d>thresh)
				break;
			x++;
		}				
		
		w += x-x0;
		
		let	u = d*dd<0,
			s=d,
			y=d;
			
		dd=d;
		x0 = x;
		
		draw.I(x0,d>0?'rgba(255,0,0,.25)':'rgba(0,0,255,.25)');
		
		while( ++x<len ){
			d=D[x];
			if( d*d<thresh || d*dd<0 )
				break;
			s+=(y+=d);
		}
					
		w += x-x0;
		
		
		if(y*y>yy){
			const a = s/y;
			
			w -= a;
			
			if( w<FLAT )
				if(u)
					spans[++count] = w;
				else{
					spans[++count]=w/2;
					spans[++count]=w/2;
				}

			else
				if( count < LEAST )
					spans[count=0]=x-a;
				else
					x=len;
			w = a;
			yy = y*y/16;
		}
	}
	
	spans[++count]=w;
	
	return spans.slice(0,++count);
},

Code	={
	
	EAN13	:(function(){
		
		let	spans, unit, score;
		
		const	EAN	={ "3211":"0", "2221":"1", "2122":"2", "1411":"3", "1132":"4", "1231":"5", "1114":"6", "1312":"7", "1213":"8", "3112":"9" },
			HED	={ "LLLLLL":"0", "LLGLGG":"1", "LLGGLG":"2", "LLGGGL":"3", "LGLLGG":"4", "LGGLLG":"5", "LGGGLL":"6", "LGLGLG":"7", "LGLGGL":"8", "LGGLGL":"9" },
			
			GRDS=3,
			DIGS=6*4,
			MIDS=5,
			BARS=GRDS+DIGS+MIDS+DIGS+GRDS,
			
		fit3	= o=>{
			const	r0=spans[o+0]+1, r1=spans[o+1]+1, r2=spans[o+2]+1, half=(r0+r1+r2)*.5, quar=half*.5;
			return r0<half && r1<half && r2<half && r0>quar && r1>quar && r2>quar;
		},
		
		group	= (from,length) => Array.from({length},(x,i)=>
				norm(spans.slice(from+i*4,from+i*4+4))
			),
		
		norm	= spans=>{
			let	u	= 7/Sum(spans);
			for(let tries=3; tries--; ){
				const	bars	= spans.map(w=>Math.round(w*u)),
					gap	= 7-Sum(bars);
				if(!gap)
					return (score+=tries)&&bars;
				else u+=gap*.1
			}
			return null;
		},
		
		decode= quartets=>{
			
			let
				parity=[],
				miss	=false,
				digits=quartets.map(q=>{
						let d;
						if(q)parity.push( (d=EAN[q.join("")]) ? 'L' : (d=EAN[q.reverse().join("")]) ? 'G' : "-" );
						if(d)score+=3;
						else miss=true;
						return d||"-";
					}),
				reverse=parity.join("").indexOf("G")>6;
				
			if(reverse){
				digits.reverse();
				parity.reverse();
			}
			
			let p=parity.join("").slice(0,6);
			
			digits.unshift(HED[p]);

		
			/// verify checksum	
			if( score>60 ){
				const	
					check	= digits.pop(),
					sum	= digits.reduce((s,n,i)=>s+(i%2?3*n:1*n),0);
			
				digits.push(check);
				
				if(sum%10 == 10-check)
					score	= 100;
			}
			
			return digits.join("");
		};
					
		return	s=>{
			
			spans=s;
			score=0;
			
			const len=spans.length;
			
			if(len>30 && len<90){
				
				const	HOPE=len-BARS+4,
					barscore = 30-Math.abs(60-len);
					
				score	= barscore;
					
				let	left, right,decoded;
				for( let o=0; o <= HOPE; o++ )
					if(fit3(o)){
						
						score	= barscore+3;
						
						unit	= (spans[o+0]+spans[o+1]+spans[o+2])/3;
						
						left	= group(o+GRDS,6);
						right	= group(o+GRDS+DIGS+MIDS,6);
						
						if(score>40)
							return {
								code:decode(left.concat(right)),
								score
							}
					}
			}
			return {score}
		}
	})()
},

fromLine	=(luma,thresh)=>{
	
	const	Y= w>480?Soft(luma):luma;
	draw.Y(Y,.025);

	const	diff	= Diff(Y);
	//draw.Y(diff,.1,"rgba(0,0,100,1)");
	
	if(!thresh)
		thresh=1<<10;
	
	let	spans, result;
	
	do{
		spans = Spans(diff,thresh);
		draw.W(spans);
		result=Code.EAN13(spans);
		result.spans=spans,
		result.thresh=thresh;
	}while(result.score<100&&result.score>60&&spans.length>59&&(thresh<<=1<1<<16))
		
	draw.T(result.score+"%"+thresh+"  "+result.code,"black");
	
	return result;
},

fromImage	= img=>{
	
	const canvas = document.body.appendChild(el("canvas"));
	
	canvas.width	= w = img.width;
	canvas.height	= h = img.height;
	
	const context= canvas.getContext('2d');
	
	context.drawImage(img,0,0);

	console.log(fromContext(context,10));
},

fromContext	= (ctx,lines)=>{
	
	let	y0	= h/2,
		besty = y0,
		step	= y0/lines,
		best	= null,
		score =0,
		tries	= 4;
		
	draw	= Draw(ctx,styles);
		
	do{
		for(let i=0; i<lines; i++){
			const	y	= draw.at((i*step)+ofs+y0-(lines*step/2));
				result=fromLine(Luma(ctx.getImageData(0, y, w, 1).data));
				
			score	=result.score;
			
			draw.S(result.score);
				
			if(score>99)
				return result.code;
				
			if(!best || best.score<score){
				best	= result;
				besty	= y;
			}
		}
		step	= score>60 ? 1 : score>50 ? 2 : score>45 ? 4 : step/2;
		y0	= besty+step;
		
		if(++ofs>=(step*2))ofs=0;
		
	}while(best.score>40 && tries-->0);
	
	return null;
},

timeout = ms => new Promise(resolve=>setTimeout(resolve, ms)),


setStyles= s=> {styles=s},

Draw	= (ctx,style)=>{
	
	let	y0=100;
	
	return{
		
		at	: y => (y0=y),
		
		S	: score =>{//return;
				ctx.beginPath();
				ctx.moveTo(0,y0+.5);
				ctx.lineTo(w,y0+.5);
				ctx.strokeStyle = "rgba(255,0,0,"+(score<10?.1:score>100?1:score*.01)+")";			
				ctx.lineWidth = 1;
				ctx.stroke();
			},
		
		L	: (y0,s,l,c)=>{//return;
				ctx.beginPath();
				ctx.moveTo(s||0,y0);
				ctx.lineTo(l?(s+l):w,y0);
				ctx.strokeStyle = c>99?'green':c>6?'red':'rgba(255,0,0,.25)';			
				ctx.lineWidth = c>99?l/4:c||1;
				ctx.stroke();
			},
		
		I	: (x,s)	=>{if(!style.I)return;
				ctx.beginPath();
				ctx.moveTo(x+.5,y0);
				ctx.lineTo(x+.5,y0+20);
				ctx.strokeStyle = s;			
				ctx.lineWidth = 1;
				ctx.stroke();
			},
		
		w	: (x,w)=>{if(!style.w)return;
				ctx.fillStyle = style.w;		
				ctx.fillRect(x, y0, x+w, 10);
			},
		
		W	: W	=>{if(!style.W)return;
				ctx.fillStyle = style.W;		
				let i=0,x=0;
				while(i<W.length){
					const a=W[i++], b=W[i++];
					ctx.fillRect(x+a, y0, b, 8);
					x+=a+b;
				}
			},
			
		Y	: (Y,k)=>{if(!style.Y)return;
				ctx.beginPath();
				for(let x=0;x<Y.length;x++){
					ctx.moveTo(x+.5,y0);
					ctx.lineTo(x+.5,y0+Y[x]*k);
				}
				ctx.strokeStyle = style.Y;			
				ctx.lineWidth = 1;
				ctx.stroke();
			},

		T	: T	=>{if(!style.T)return;
				ctx.fillStyle = style.T;		
				ctx.fillText(T, 0, y0);
			}
	}
	
};
	
export default {
	Execute,
	fromContext,
	fromImage,
	fromLine,
	setStyles
};
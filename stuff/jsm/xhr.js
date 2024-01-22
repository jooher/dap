	Http	= (function(){

		const
		
		lowerKeys = o => {
			const
				lower = {};
			for(const k in o)
				lower[k.toLowerCase()]=o[k];
			return lower;
		},
		
		makeXHR = (req,sync)=>{
			
			if(typeof req === "string")
				req={url:req};//url,body,headers,method,contentType,)
		
			const	
				request	= window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Msxml2.XMLHTTP'),
				headers = req.headers && lowerKeys(req.headers),
				body = req.body || (req[""] && Mime.prepareContent(headers,req[""]) ),
				method	= req.method || ( body ? "POST" : "GET" );
			
			request.open( method,req.url,!sync ); //Uri.absolute(req.url)
			
			if(headers)
				for(const i in headers)
					request.setRequestHeader(i,headers[i]);
			
			try	{request.send(body||null);}
			catch(e){console.warn(e.message);}
			
			return request;
		};
		
		return {			
			request: makeXHR,
			
			execAsync: (req,sync)=>{
				const request=makeXHR(req,sync);
				return sync?request:
				new Promise((resolve,reject)=>{
					request.onreadystatechange = e =>
						(request.readyState == 4) &&
							(Math.floor(request.status/100)==2 ? resolve(request) : reject(request));
				})
			}
		}
	
	})(),
	
	Mime	= (function(){
		
		const
		
		decode = {
			
			"text/plain": request =>
				request.responseText,
				
			"application/json": request =>
				JSON.parse(request.responseText),
				
			"application/x-www-form-urlencoded": request =>
				QueryString.parse.hash(request.responseText),
				
			"application/javascript": request =>
				eval(request.responseText),
				
			"application/xml": request =>
				request.responseXML.documentElement,
		},
		
		encode = {
			
			"application/json": content=>
				JSON.stringify(content),
				
			"application/x-www-form-urlencoded": content=>
				QueryString.build.neutral(content)
			 
		},
		
		prepareContent= (headers,content) => {
			const
				ctype	= headers&&headers['content-type'],
				h	= ctype&&encode[ctype.split(";")[0]];
			return h ? h(content) : content;
		},
		
		parseResponse= req => {
			const	
				ctype=req&&req.getResponseHeader('content-type'),
				h=ctype&&decode[ctype.split(";")[0]];
			return h ? h(req) : req.responseText;
		};
		
		return {encode,decode,parseResponse,prepareContent}
		
	})(),

	QueryString = (function(){
		
		const
		
		regx =/(?:&|^)([^&=]+)=([^&]*)/g,
		encode = encodeURIComponent,
		decode = c=>decodeURIComponent(c.replace(/\+/g,' ')),
		
		parse	={
			
			pairs	:function(str,tgt){
				if(!tgt)tgt=[];
				str&&str.replace(regx,($0,$1,$2)=>{
					tgt.push({name:$1,value:decode($2)})
				});
				return tgt;
			},
			hash	:function(str,tgt){
				if(!tgt)tgt={};
				str&&str.replace(regx,($0,$1,$2)=>{
					if($1)tgt[$1]=decode($2)
				});
				return tgt;
			},
			feed	:function(str,tgt){
				if(!tgt)tgt={values:[],tags:[]};
				str&&str.replace(regx,($0,$1,$2)=>{
					tgt.values.push(decode($2));
					tgt.tags.push($1);
				})
				return tgt;
			}
		},
		
		build	={

			neutral	:(hash)=>{
				const arg=[];
				for(const k in hash)//Object.keys(hash).map((k,i)=>
					if( k && hash[k]!=null )
						arg.push(k+"="+encode(hash[k]));
				return arg.join('&').replace(/%20/g,'+');
			},
			
			ordered	:(values,tags,emptytoo)=>{
				let uri="";
				for(let i=values.length,v,t;i-->0;)
					if((v=values[i])||(v===0)||emptytoo)
						uri+=(t=tags[i]) ? "&"+t+"="+ encode(v) : v;
				return uri.replace(/%20/g,'+');
			}
		
		},

		merge	=(...strs)=> strs.reduce((tgt,str)=>parse.hash(str,tgt),{});
		
		return	{ parse, build, merge }		
	})(),

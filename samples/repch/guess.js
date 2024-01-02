const
	web	=[
			[ /^(?:www.youtube.com\/watch\?v=)([a-zA-Z0-9-]+)/, "youtube"],
			[ /^(?:youtu.be\/)([a-zA-Z0-9-]+)/, "youtube"],
			[ /^(?:www.facebook.com\/)([^?]+)/, "facebook" ]
		],
		
	nonweb={
			gtin		:/^\d{13}$/
		},
		
	redir	={
			gtin		: gtin=>"http://srs.gs1ru.org/id/gtin/"+gtin,
			youtube	: v	=>"https://youtu.be/"+v, // https://www.youtube.com/watch?v=
			facebook	: id	=>"https://www.facebook.com/"+id
		};
	
export default { // dap convert

	guess	: entry => {
	
		if(!entry)
			return entry;
	
		if(entry.startsWith("https://")){
			const	key=entry.substring(8);									
			for(let i=web.length; i--;){
				const match=web[i][0].exec(key);
				if(match)return web[i][1]+":"+match[1];
			};
			return decodeURI(entry);
		}
	
		const	parts	= entry.split(":"),
			key	= parts.pop(),
			f	= parts.length&&parts.pop();
			
		if(f)return key.match(nonweb[f])?entry:console.log("format mismatch:"+entry);
		else for(let f in nonweb)if(key.match(nonweb[f]))return f+":"+key;
		console.log("Can't recognize key format");
	},
	
	href	: entry =>{
		const parts	= entry.split(":"),
			urltp	= redir[parts[0]];
		return urltp ? urltp(parts[1]) : parts[1];
	}
};
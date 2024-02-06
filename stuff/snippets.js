const 

encode = (type,params) =>
	/json/.test(type) ? JSON.stringify(params) :
	/urlencoded/.test(type) ? urlencoded(params) :
	params.toString(),
	
urlencoded = obj => new URLSearchParams( Object.entries(obj)
	.filter(([name,value]) => value!=null )
	.map(([name,value]) => typeof value === 'object' ? [name,JSON.stringify(value)] : [name,value] )
).toString();



export const

api = (base,options) => {
	
	const interpret = params =>{
		const	key = Object.keys(params)[0];
		if(key && key===key.toUpperCase()){
			const url = base + params[key],
				req = new Object(options);
			delete params[key];
			req.method=key;
			req.body = encode(req.headers.get("Content-type"),params);
			return [ url, req ];
		}
		return [ base + urlencoded(params), options ]
	};
		
	return {
		HttpJson : params => fetch( ...interpret(params) ).then( r => r.ok && r.json() )//.catch ( console.warn )
	}
	
},

auth = headers => {
	
	const auth = user => (headers.authorization = user ? 'Token ${user.token}' : "" ) && user;
	
	return {
		save: user => localStorage.setItem("user",JSON.stringify(user))||auth(user),
		load: _=> auth(JSON.parse(localStorage.getItem("user"))),
		quit: _=> auth(localStorage.removeItem("user"))&&null
	}
},

dictFrom = {
	html:	elem => Object.fromEntries( [...elem.parentNode.removeChild(elem).children].filter(n=>n.id).map( n => [ n.id, n ] ) ), //Object.fromEntries( elems.map(el=>[ el.id||el.tagName, el ]) ),
	form:	form => Object.fromEntries( [...form.elements].filter(n=>n.name).map( n => [ n.name, n.value ]) ),
},

datasetFrom = {
	rows:	(tags,rows) => rows.map( row=>Object.fromEntries(tags.map((t,i)=>[t,row[i]]) ) )
};



export const

api = (base,options) => {
	
	const interpret = params =>{
		const key = Object.keys(params)[0];
		if(key && key===key.toUpperCase()){
			const url = params[key],
				req = new Object(options);
			delete params[key];
			req.method=key;
			req.body=JSON.stringify(params);
			return [ base+url,req ];
		}
		return [ base + new URLSearchParams(params).toString(), options ]
	}
	
	return {
		httpJson : params =>	fetch( ...interpret(params) )
						.then( r => r.ok && r.json() )//.catch ( console.warn )
	}
	
},

dictFrom = {
	html:	elem => Object.fromEntries( [...elem.parentNode.removeChild(elem).children].filter(n=>n.id).map( n => [ n.id, n ] ) ), //Object.fromEntries( elems.map(el=>[ el.id||el.tagName, el ]) ),
	form:	form => Object.fromEntries( [...form.elements].filter(n=>n.name).map( n => [ n.name, n.value ]) ),
},

datasetFrom = {
	rows:	(tags,rows) => rows.map( row=>Object.fromEntries(tags.map((t,i)=>[t,row[i]]) ) ),
}
		

;

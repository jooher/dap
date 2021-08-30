const

uid	= ((storage,uidkey)=>{
		let last=parseInt(storage.getItem(uidkey)||"1");
		return n=>n||storage.setItem(uidkey,++last)||last;
	})(localStorage,"uid"),
		
Persist	=(storage,box,unbox,single)=> // keeps the data coherent among several tabs via Storage
	key	=>{
		let	order=[],
			index={},
			stamp=-1,
			stampname=key+"_stamp";
			
		const
		
		keys	= key.indexOf("-")>0 && key.split("-"),
		ixkey	= r=>keys?keys.map(k=>r[k]).join("|"):uid(),
		
		ixrow	= r=>index[r[key]||(r[key]=ixkey(r))]=r,
		ixset	= s=>{ s.forEach&&s.length&&s.forEach(ixrow); },
		flush	= _=>{
				order=order.filter(r=>index[r[key]]==r && r.TIME);
				storage.setItem(key,box(order));
				storage.setItem(stampname,stamp);
				console.log(key+" saved, rows: "+order.length);
			},
		anew	= s=>{ index={}; ixset(order=s&&s.reduce?s:[]); ++stamp; flush(); },
		merge	= d=>{ order=order.concat(d); ixset(d); },
		sync	= r=>{
			if(stamp>0&&single&&!r)return;
			const saved=parseInt(storage.getItem(stampname))||0;
			if(stamp<saved){ //load
				anew(unbox(storage.getItem(key)));
				stamp=saved;
			}
			if(r){
				r.TIME=Date.now();
				ixrow(r);
				order.push(r);
				stamp++;
			}
			if(stamp>saved){ /// TODO: delay the save to page leave/enter
				flush();
			}
		};
			
		return	{
			anew,
			flush,
			merge,
			
			data	: _ => sync()	||order,
			take	: m => sync()	||index[m],
			save	: r => sync(r)||r,
			
			kill	: m => index[m].TIME=null,
			killr	: r => index[r[key]||ixkey(r)]=null
		}
},

P	= Persist(localStorage,JSON.stringify,JSON.parse,true),
tables= {},
T	= key=> tables[key]||(tables[key]=P(key)),
detach= r=> {r=Object.assign({},r);if(r[""])delete r[""];return r},

filter= (data,values,tags)	=> !values.length?data:values.reduce((a,v,i)=>a.length?a.filter(r=>r[tags[i]]==v):a,data),	// :[]
join	= (row,values,tags)	=> row&&Object.assign({}, row, ...values.map((v,i)=>T(tags[i]).take(v))),	// :{}
save	= (table,values)		=> { values.forEach(r=>table.save(detach(r)))||table.data()},
reset	= (values,tags)		=> { values.length ? values.forEach((v,i)=>T(tags[i]).anew(v)) : Object.keys(tables).forEach(t=>tables[t].anew()); },

hash	= //window.dap.Util.hash;
	(values,tags)=>{
		const hash={};
		for(let a,i=values.length;i--;)
			if((a=tags[i])!='.')
				hash[a]=values[i];
			else if(a=values[i])
				for(let j in a)
					if(j)hash[j]=a[j];
		return hash;
	};
			
export default { // Persist wrapped as dap flatteners 
	
	uid,

	P, T,
	
	basic	:(values,tags)=>{
			const	v=values.pop(),
				c=values.length,
				t=c&&tags[c-1],
				a=tags[c];
				
			return	!a&&!v ? reset(values,tags) :			// ( @ ... ) anew... 
					!a ? filter(T(v).data(),values,tags) :				// ( `key $x $y ... )
					!v&&!t ? save(T(a),values) :						// ( @key $row1@ $row2@ ... )
					!t ? c?T(a).take(v):join(T(a).take(v),values,tags) :		// ( $key `t1 `t2 ... )
					values.push(v) && T(a).save(hash(values,tags));	// ( $key $x $y ... ) | (@key $x $y)
		},
		
	multi	:(values,tags)=>{
			const add=values.pop(),
				key=tags[values.length],
				mul=values.pop();
				
			if(mul&&mul.length){
				const	ite=tags[values.length],
					tail=values.length&&hash(values,tags),
					t = T(key);
				mul.forEach(r=>{
					const row={[ite]:r};
					if(tail)
						Object.assign(row,tail);
					add
						?t.save(row)
						:t.killr(row);
				});
				t.flush();
			}
		}
}
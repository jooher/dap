const Persist=((storage,box,unbox)=>{ // keeps the data coherent among several tabs

	function P(name,pkey,keep,delay){//,autosync
		
		let	order,
			index,
			stamp=-1,
			stampname=name+"_stamp";
			
		const	ixrow	= (ix,r)=>(ix[r[pkey]]=r)&&ix,
			ixset	= (ix,s)=>s.reduce(ixrow,ix),		
			
			data	= ()=>order,
			find	= match=>(index?index[match]:order.find(r=>r[pkey]==match))||false,
			augment	= keys=> index && keys.map(k=>index[k]),
			
			update	= ()=>	{
					++stamp;
					if(!delay)sync();
				},
				
			anew	= d=>{
					order=d&&d.reduce?d:[];
					if(pkey)index=order?ixset({},order):{};
					update();
				},
				
			add	= r=>{
					if( !index || index[r[pkey]]!=r){
						order.push(r);
						if(index)ixrow(index,r);
					}
					update();
				},
				
			sync	= i=>{
				const saved=parseInt(storage.getItem(stampname))||0;
				if(saved<stamp){ //save
					if(index)order=order.filter(r=>index[r[pkey]]==r);
					if(keep)order=order.filter(keep);
					storage.setItem(name,box(order));
					storage.setItem(stampname,stamp);
				}
				if(saved>stamp){ //load
					anew(unbox(storage.getItem(name)));
					stamp=saved;
				}
			};
			
		sync();
		
		return	{data,find,anew,add,update,sync}
	}
	
	const	wrap	= p=>({p,data:p.data()});
	
	return	{
		convert	:{
			db	:o=>wrap(P(o.name||o.pkey,o.pkey,o.keep))
		},
		flatten	:{
			db	:(values,tags)=>{
				const p=values.pop().p;
				for(let i=values.length,a;i--;)
					if((a=p[tags[i]](values[i]))!=null)
						return a||null;
				return wrap(p);
			}
		}
	}
})(localStorage,dap.Env.Json.encode,dap.Env.Json.decode),
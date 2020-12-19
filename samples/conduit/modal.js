export default{
	
	convert:{
		wait: $ => new Promise((resolve,reject)=>{$.$post={resolve,reject};})
	},
	
	operate:{
		
		value:(value,name,node)=>{
			const
				data = node.$.getDataContext(),
				post = data.$post;
			if(post)
				post.resolve(value);
			else data[name||"value"]=value;
		},
		
		top	:(value,alias,node)=>{
			node.style.display="none";
			window.setTimeout(()=>{
				document.body.appendChild(node);
				node.style.display="";
			},0);
		},
		
		kill:(value,name,node)=>{ (value||node).remove(); }
	}
}
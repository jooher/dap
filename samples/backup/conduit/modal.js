export default{
	
	convert:{
		wait: ($,r) => 
			r && new Promise((resolve,reject)=>{$.$post={resolve,reject};})
	},
	
	operate:{
		
		value:(value,name,node)=>{
			const
				data = node.$.getDataContext(),
				post = data.$post;
			data[name||"value"]=value;
			if(post)
				post.resolve(value);
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
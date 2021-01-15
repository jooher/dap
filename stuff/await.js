export default{
	convert:{
		wait: $ => new Promise((resolve,reject)=>{$.$post={resolve,reject};}) // "Wait, yes"//
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
		kill:(value,name,node)=>{ (value||node).remove(); }
	}
}
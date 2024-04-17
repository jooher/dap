export default{
	convert:{
		wait: $ => new Promise((resolve,reject)=>{$.$post={resolve,reject};}) // "Wait, yes"//
	},
	operate:{
		value:(value,name,node)=>{
			let data=node.$.data;
			while(data&&!data[""].$post)data=data.$;//Fail("no $post")
			data[""].$post.resolve(value);
			delete data[""].$post;
		},
		kill:(value,name,node)=>{ (value||node).remove(); }
	}
}
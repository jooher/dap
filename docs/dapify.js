const dapify=

'dapify'.d("$code=.code $run=.code"
	,'PRE contenteditable'
		.d(".editor=#; ! .code; a!")
		.a("#.innerHTML=$code:dapify")
		.e("blur","$code=.editor.textContent")
	,'buttons'.d(""
		,'welcome'.d("? ($code .code)eq; ! welcome")
		,'BUTTON'.d("? ($code $run)ne; ! `Execute").ui("$run=$code")
		,'BUTTON'.d("? ($code .code)ne; ! `Reset").ui("$run=$code=.code")
	)
	,'run'.d("inline $run")
)
.DICT({
	welcome:"You're welcome to modify this code!"
})
.FUNC({
	convert	:{
		dapify	:code	=>code
				.replace(/</g,"&lt;").replace(/>/g,"&gt;")	// html
				.replace(/( \/\/.+?)$/gm,"<i>$1</i>")		// comments
				.replace(/('.+?')/g,"<em>$1</em>") 		// element signatures
				.replace(/(\$[^\s=.;@:"()`]*)/g,"<b>$1</b>")	// $status variables
	},

	operate	: {
		inline	:(value,alias,node)=>{
			try{
				eval(value)
				.RENDER(null,node);
			}
			catch(e){
				alert("error: ");
			}
		}
	}
});

[...document.getElementsByTagName("pre")]
	.filter	(pre=>pre.getAttribute("lang")=="dap")
	.forEach(pre=>dapify.RENDER({code:pre.textContent},null,pre));
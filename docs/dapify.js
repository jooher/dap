const dapify=

'dapify'.d("$code=. $run="
	,'PRE contenteditable'.d(".editor=#; ! .code; a!").a("#.innerHTML=#.textContent:dapify").e("blur","a!")
	,'buttons'.d(""
		,'BUTTON'.d("! `Execute").ui("$code=.editor:value")
		,'BUTTON'.d("! `Reset").ui("$code=.")
	)
	,'IFRAME src="sandbox.html"'.a("(# $code)inject")//.e("load","a!")
)
.FUNC({
	convert	:{
		dapify	:code	=>code
				.replace(/</g,"&lt;").replace(/>/g,"&gt;")	// html
				.replace(/( \/\/.+?)$/gm,"<i>$1</i>")		// comments
				.replace(/('.+?')/g,"<em>$1</em>") 		// element signatures
				.replace(/(\$[^\s=.;@:"()`]*)/g,"<b>$1</b>")	// $status variables
	},
	
	flatten	:{		
		inject	:values	=>{
			const	iframe	= values.pop().contentWindow;
			if(iframe){
				iframe.document.body.innerHTML="";
				values.forEach(value=>iframe.eval(value));
			}
			return iframe;
		}
	}	
});

[...document.getElementsByTagName("pre")]
	.filter	(pre=>pre.getAttribute("lang")=="dap")
	.forEach(pre=>dapify.RENDER({code:pre.textContent},pre));
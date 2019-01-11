const dapify=

'dapify'.d("$code=. $view=`pre"
	,'PRE contenteditable'.d(".editor=# #.innerHTML=$code:dapify")
	,'buttons'.d(""
		,'BUTTON'.d("! `Run").ui("$code=.editor:value")
		,'BUTTON'.d("! `Reset").ui("$code=.")
	)
	,'IFRAME src="sandbox.html"'.a("(# $code)inject")
)
.FUNC({
	convert	:{
		dapify	:code	=>code
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
//	.filter	(pre=>pre.getAttribute(lang)=="dap")
	.forEach(pre=>dapify.RENDER({code:pre.textContent},pre));
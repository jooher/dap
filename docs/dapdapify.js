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
				.replace(/( \/\/.+?)$/gm,"<i>$1</i>")		//comments
				.replace(/('.+?')/g,"<em>$1</em>") 		// elements
				.replace(/(\$[^\s=.;@:"()]*)/g,"<b>$1</b>")	// $status variables
	},
	
	flatten	:{
		injecth	:values	=>{
			const	iframe	= values.pop(),
				html	= values.reduce((html,value)=>html.concat(["<script>",value,"</script>"]),[]).join("\n"),
				doc	= iframe.contentWindow.document;
			if(doc)	
				return	doc.body.innerHTML=html;
		},
		
		inject	:values	=>{
			const	iframe	= values.pop().contentWindow;
			if(iframe)values.forEach(value=>iframe.eval(value));
			return iframe;
		}
	}	
});

[...document.getElementsByTagName("pre")]
//	.filter	(pre=>pre.getAttribute(lang)=="dap")
	.forEach(pre=>dapify.RENDER({code:pre.textContent},pre));
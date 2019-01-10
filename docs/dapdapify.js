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
				.replace(/( \/\/.+?)\n/g,"<i>$1</i>\n")		//comments
				.replace(/('.+?')/g,"<em>$1</em>") 		// elements
				.replace(/(\$[^\s=.;@:"()]*)/g,"<b>$1</b>")	// $status variables
	},
	
	flatten	:{
		inject	:values	=>{
			const	iframe=values.pop(),
				doc=iframe.contentWindow.document;
			if(doc)values.forEach(value=>{
				const created=doc&&doc.createElement("script");
				created.text=value;
				doc.appendChild(created);
				//tgt.parentNode.replaceChild(res,tgt);
			})
		}
	}
	
});

[...document.getElementsByTagName("pre")]
//	.filter	(pre=>pre.getAttribute(lang)=="dap")
	.forEach(pre=>dapify.RENDER({code:pre.textContent},pre));
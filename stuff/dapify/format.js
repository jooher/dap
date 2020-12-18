export const

format = code=>code
	.replace(/</g,"&lt;").replace(/>/g,"&gt;")	// html
	.replace(/( \/\/.+?)$/gm,"<i>$1</i>")		// comments
	.replace(/('.+?')/g,"<em>$1</em>") 		// element signatures
	.replace(/(\$[^\s=.;@:"()`]*)/g,"<b>$1</b>"),
	
applyToAllPreElements = _=>
	[...document.getElementsByTagName("pre")]
	.forEach(pre=>pre.innerHTML=format(pre.innerHTML);

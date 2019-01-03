[...document.getElementsByTagName("pre")].map(pre=>{
	pre.innerHTML=pre.innerHTML
});

'dapify'.d("$code=`Hello"
	,'PRE'.d("?? $view@pre; #.innerHTML=$code:dapify")
	,'run'.d("$?=sandbox($code)")
)
.DEF({
	sandbox: 'IFRAME src="mydap.html"'.d(".body=#:body body.innerHTML=.code")
})
.EXT({
	convert:{
		dapify : code=>code
				.replace(/( \/\/.+?)\n/g,"<i>$1</i>\n") //comments
				.replace(/('.+?')/g,"<em>$1</em>") // elements
				.replace(/(\$[^\s=.;@:"()]*)/g,"<b>$1</b>")	// $status variables
				,
		body : iframe=>iframe.getElementsByTagName("body")[0]
	}
})
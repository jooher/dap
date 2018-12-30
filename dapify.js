[...document.getElementsByTagName("pre")].map(pre=>{
	pre.innerHTML=pre.innerHTML
	.replace(/(\/\/.+?)\n/g,"<i>$1</i>\n") //comments
	.replace(/('.+?')/g,"<em>$1</em>") // elements
	.replace(/(\$[^\s=.;@:"()]*)/g,"<b>$1</b>") // $status variables
});
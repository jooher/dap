const	comment="<i>$1</i>\n",
	elem="<b>$1</b>";

[...document.getElementsByTagName("pre")].map(pre=>{
	pre.innerHTML=pre.innerHTML
	.replace(/(\/\/.+?)\n/g,comment)
	.replace(/('.+?')/g,elem);
});
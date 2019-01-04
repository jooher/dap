dap.NS("sample.js")

.EXT({
	convert	:{
		upper	:str=>str.toUpperCase(),
		lower	:str=>str.toLowerCase()
	},
	flatten	:{
		here	: (values,tags)=>tags.reduce((str,tag,i)=>str.split('{'+tag+'}').join(values[i]),values.pop())
	}
})

.DEF({
	linebreak: document.createElement('HR')
})
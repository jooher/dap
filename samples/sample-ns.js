dap.NS("sample.js")

.FUNC({
	convert	:{
		upper	:str=>str.toUpperCase(),
		lower	:str=>str.toLowerCase()
	},
	flatten	:{
		here	: (values,tags)=>tags.reduce((str,tag,i)=>str.split('{'+tag+'}').join(values[i]),values.pop())
	}
})

.DICT({
	linebreak: "linebreak"
})
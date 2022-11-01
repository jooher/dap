dap && //dap.NS("https://dap.js.org/stuff/dapify.dap.js")

'dapify'.d("$edit=.code $run=.code $dirty= $own="
	,'PRE contenteditable'
		.d("! .code; a!")
		.a("#.innerHTML=$run:hilite")
		.e("keyup","$edit=#.innerText")
	,'buttons'.d(""
		,'welcome'.d("? $own:!; ! welcome")
		,'BUTTON.reset'	.d("? $own; !! reset@title").ui("$run= $run=$edit=.code")
		,'BUTTON.render'.d("? $dirty; !! render@title").ui("$run=$edit")
	)
	,'run'.d("!! .style; inline $run")
).u("$dirty=($edit $run)ne $own=($edit .code)ne")

.DICT({
	welcome	:"You're welcome to modify this code!",
	render	:"Run this code",
	reset	:"Reset to original code",
})

.FUNC({
	convert	:{
		hilite:code=>code
			.replace(/</g,"&lt;").replace(/>/g,"&gt;")	// html
			.replace(/( \/\/.+?)$/gm,"<i>$1</i>")		// comments
			.replace(/('.+?')/g,"<em>$1</em>") 		// element signatures
			.replace(/(\$[^\s=.;@:"()`]*)/g,"<b>$1</b>")
	},

	operate	: {
		inline	:(value,alias,node)=>{
			try{
				const sample = eval(value);
				if(sample&&sample.RENDER)
					sample.RENDER(null,node);
			}
			catch(e){
				alert(e.message);
			}
		}
	}
})
(nodes=>{
	
const

hilite	= code=>code
	.replace(/</g,"&lt;").replace(/>/g,"&gt;")	// html
	.replace(/( \/\/.+?)$/gm,"<i>$1</i>")		// comments
	.replace(/('.+?')/g,"<em>$1</em>") 		// element signatures
	.replace(/(\$[^\s=.;@:"()`]*)/g,"<b>$1</b>"),	// $status variables
	
dapify	= dap &&

	'dapify'.d("$edit=.code $run=.code $dirty= $own="
		,'PRE contenteditable'
			.d("! .code; a!")
			.a("log `a; #.innerHTML=$run:hilite")
			.e("keyup","$edit=#.textContent")
		,'buttons'.d(""
			,'welcome'.d("? $own:!; ! welcome")
			,'BUTTON.reset'	.d("? $own; !! reset@title").ui("$run= $run=$edit=.code")
			,'BUTTON.render'.d("? $dirty; !! render@title").ui("$run=$edit")
			//,'BUTTON'.d("! submit").ui(".form:submit")
		)
		,'run'.d("!! .style; inline $run")
		,'FORM action="https://dapmx.org/playground.php" target="_blank" method="post"'.d(".form=#"
			,'INPUT type="hidden" name="code"'.d("#.value=$edit")
		)
	).u("$dirty=($edit $run)ne $own=($edit .code)ne")
	
	.DICT({
		welcome	:"You're welcome to modify this code!",
		render	:"Run this code",
		reset	:"Reset to original code",
		submit	:"Open in separate window"
	})
	.FUNC({
		convert	:{
			hilite,
			submit	:form	=>form.submit()
		},

		operate	: {
			inline	:(value,alias,node)=>{
				try{
					eval(value)
					.RENDER(null,node);
				}
				catch(e){
					alert(e.message);
				}
			}
		}
	});
	
	nodes.forEach(dapify
		? pre=>dapify.RENDER({code:pre.textContent,style:pre.getAttribute("data-style")},null,pre)
		: pre=>pre.innerHTML=hilite(pre.innerHTML)
	);

})(
	[...document.getElementsByTagName("pre")].filter(pre=>pre.getAttribute("lang")=="dap")
);
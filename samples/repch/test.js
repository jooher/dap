import "/./0.5.3.js"; //https://dap.js.org

const 
	Tabset =
		'TABSET'.d("* tab"
				,'TAB'.d("!? .tab; ! .tab; a!")
					.a("!? (.tab $tab)eq@selected")
					.ui("$tab=.; ?")
		)
	,

	unhead = url => url.replace(/^(=[^&]*)&*/, decodeURIComponent),
	jsonAPI = base => args => base + unhead(new URLSearchParams(args).toString()) // fetch().then( res => res.json() )

	;

'nav'.d("$tab=`lists"
	,'ROOF'.d("Tabset(tab)")
	,'H1'.d("! $tab")
	,'ETAGE'.d("$tab=`tags Tabset(tab)"
		,'U'.d("! (`http://get.the.tab? $tab):api")
	)
)
.FUNC({
	convert:{
		api: jsonAPI("")
	}
})
.DICT({
	Tabset,
	
	tab:[
		'tags',
		'links',
		'aspects',
		'discuss'
	]
})
.RENDER();


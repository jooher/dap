import "/./0.5.3.js"; //https://dap.js.org

const httpjson = base => params => 
		fetch( base + new URLSearchParams(params).toString() )
		.then( r => r.ok && r.json() )//.catch ( console.warn )
	;
	

'ETAGE'.d("$tab="
	,'tabs'.d("Tabset(tab)")
	,'i'.d("? $tab; ! (`data $tab):api")//:query
)

.FUNC({
	convert:{
		api	: httpjson('../heroes.json?')
	}
})

.DICT({
	
	Tabset:
		'TABSET'.d("* tab"
			,'TAB'.d("!? .tab; ! .tab; a!")
				.a("!? (.tab $tab)eq@selected")
				.ui("$tab=.")
		).u("?"),			
	
	tab:[
		'tags',
		'links',
		'aspects',
		'discuss'
	]
})
.RENDER();


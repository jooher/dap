import "/./0.5.3.js"; //https://dap.js.org

const 
	Tabset =
		'TABSET'.d("* tab"
				,'TAB'.d("!? .tab; ! .tab; a!")
					.a("!? (.tab $tab)eq@selected")
					.ui("$tab=.")
			).u("?")			
	;

'ETAGE'.d("$tab=`tags"
	,'tabs'.d("Tabset(tab)")
	,'i'.d("! $tab")
)


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


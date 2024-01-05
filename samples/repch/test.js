import "/./0.5.3.js"; //https://dap.js.org

const 
	Tabset =
		'TABSET'.d("* tab"
				,'TAB'.d("!? .tab; ! .tab; a!")
					.a("!? (.tab $tab)eq@selected")
					.ui("$tab=.")
			).u("?")			
	;

'nav'.d("$tab=`lists"

	,'ROOF'.d("Tabset(tab)")
	
	,'H1'.d("! $tab")
	
	
	,'ETAGE'.d("$tab=`tags Tabset(tab)"
	
		,'tabs'.d("Tabset(tab)"
			,'I'.d("! $tab")
		)
		
		,'tabs'.d("& tab; ! Tabset")
		
		,'tabs'.d(""
			,Tabset
		)
		
		,Tabset
		
		//,'H2'.d("! $tab")
	)
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


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
	
	
	,'ETAGE'.d("$tab=`tags Tabset(tab`)"//; & :split@tab`tags,links,aspects,discuss; ! Tabset:check"
	
		,'tab'.d("Tabset(tab)")
		
		,'tab'.d("& tab; ! Tabset")
		
		,'tab'.d(""
			,Tabset
		)
		
		,Tabset
		
		,'H2'.d("! $tab")
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


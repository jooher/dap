import "//dap.js.org/0.5.2.js";

const	dispatch = ops => (v,t) => v.reduceRight( (a,x,i) => ops[t[i]](a,x) ),
	trace = (obj,fields)=>obj&&fields.map(f=>f+": "+obj[f]).join("\n"),
	
	filters ={
		"All": null,
		"Active": todo => !todo.completed, 
		"Completed": todo => !!todo.completed
	}
	;

'#todoapp'.d("$server=default-server $todos= $filter= $recount="

	,'SELECT#todo-server'.d("*@server servers-list:query,lines"
	,'OPTION'.d("! .server")
	).ui("$server=(`// #.value)concat")

	,'#header'.d(""
		,'H1 `dap todos 0.5'.d("")
		,'INPUT#new-todo placeholder="What needs to be done?" autofocus'
			.ui("$todos=( $todos (#.value@title)@insert )op #.value=") 
	)
	,'#main'.d(""
	
		,'INPUT#toggle-all type=checkbox'
			.ui("*@ $todos=($todos (#.checked@completed)@assign )op; (@method`PATCH .url:dehttp headers (.completed)):query")
				
		,'UL#todo-list'.d("? $todos; * ( $todos $filter )op"
		
			,'LI'.d("$completed=.completed $editing= $patch=; a!"
	
				,'INPUT.toggle type=checkbox'
					.d("#.checked=.completed")
					.ui("$patch=(.completed=$completed=#.checked) $recount=()")
			
				,'LABEL.view'
					.d("? $editing:!; ! .title")
					.ui("log $editing=.url")//"dblclick",
			
				,'INPUT.edit'
					.d("? $editing; !! .title@value; #:focus")
					.ui("$patch=(.title=#.value)")
					.e("blur","$editing=")
			
				,'BUTTON.destroy'
					.ui("$todos=($todos $@remove)op (@method`DELETE .url:dehttp):query")
			)
			.a("!? $completed $editing; ? .url:!; & (@method`POST $server@url headers $):query")
			.u("? $patch; (@method`PATCH .url:dehttp headers headers $patch@):query $patch=")
		)
	)
	,'#footer'.d("$active=($todos @filter`Active)op $completed=($todos @filter`Completed)op $recount"
		,'#todo-count'.d("! (active $active.length)format")
		,'UL#filters'.d("* filter"
			,'LI'.d(""
				,'A'.d("!! (`# .filter)concat@href .filter@; !? (.filter $filter)eq@selected")
			)
		)
		,'#clear-completed'
			.d("! (completed $completed.length)format")
			.ui("$todos=$active; *@ $completed; (@method`DELETE .url:dehttp):query")
	)

	,'PRE#loader'
		.d("$request=($server@url); u")
		.u("? $todos:!=$request:query,array?; ! $request:debugrequest")//

	,'state'
		.d("$state=window.location; u@hashchange")
		.e("HASHCHANGE","$filter=$state.hash:afterhash")
		.a("$state.hash=$filter")
)

.DICT({
	"default-server"	: "//todo-backend-express.herokuapp.com/",
	"servers-list" : "servers.txt",
	
	headers: {"Content-type":"application/json"},
	filter: Object.keys(filters),
	active: "{length} items left",
	completed: "Clear completed items ({length})",
	
	window	
})

.FUNC({
	convert:{
		lines:	txt => txt.split("\n"),
		dehttp: url => url.replace(/^https?\:/,''),
		focus: (n,r)=> r&& setTimeout(_=>{n.focus()},0),
		afterhash: (h,r)=> r&& h.split("#").pop(), // get rid if a leading # in window.location.hash
		"array?": x => Array.isArray(x) && x,
				
		debugrequest : req => req.url+"\n"+ trace(req.debug,["status","statusText"])+"\n\n"
	},
	
	flatten:{
		
		op	:dispatch({
				insert: (a,v) => a?a.concat(v):v,
				remove: (a,v) => a&&a.filter(x=>x!=v),
				assign: (a,v) => a&&a.map(x=>Object.assign(x,v)),
				filter: (a,v) => a&&filters[v]?a.filter(filters[v]):a
			})
		
	}
})
//.COMPILE()
.RENDER();
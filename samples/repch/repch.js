import "/./0.5.3.js"; //https://dap.js.org
//import "https://dap.js.org/0.5.2.js"; //
import "https://dap.js.org/stuff/jsm/pwa.js";
//import "https://dap.js.org/stuff/html.jsm";

import Await from "/./stuff/await.js";
import Persist from "/./stuff/persist.js";
import multiselect from "/./stuff/multiselect.js";
import scrollfocus from "/./stuff/scrollfocus.js";	
import Starbar from "/./stuff/bricks/starbar.js";

import {untab} from "/./stuff/parse.js";

import Scan from "./scanner.js";
import guess from "./guess.js";

const
	grab	= src	=> [...src.children].reduce((a,n)=>{if(n.id)a[n.id]=src.removeChild(n); return a},{}),
	dataset	= (tags,raws)=>raws.map( raw=>{const row={};tags.forEach((t,i)=>row[t]=raw[i]); return row;} )	
;

const 
	Tabset =
		'TABSET'.d("* .tab"// :split`help,data"//
				,'TAB'.d("!? .tab; ! .tab; a!")
					.a("!? (.tab $tab)eq@selected")
					.ui("$tab=.")
			).u("?");

 
'client'.d("$Entity=; $aspects= $entities= $opinions= $lists!= $entities!="

	,'PAGE.nav'.d("$tab=`lists"
	
		,'ROOF'.d("Tabset(:split@tab`lists,categories)"
			,'DECK'.d(""
				,'ICON.settings'.ui("$Entity=")
			)
		)
		
		,'ETAGE'.d("?? $tab@lists; $list=`recent $checked=:checked.size"
		
			,'ATTIC'.d(""
				,'SELECT.lists'.d(""
					,'OPTGROUP.basic'.d("* :split@value`recent,favorite,offers"
						,'OPTION'.d("!! .value .value@")
					)				
					,'OPTGROUP.lists'.d("$lists!; * (`list)db"
						,'OPTION'.d("!! .title@ .list@value")
					)					
				).ui("$list=#:value; ? :checked.size,! Ask(dict.addtolist@.):wait,! (:!@list-entity :checked.all@entity $list)dbmul")//
			
				,'ICON.add_circle'.ui("? .title=Ask(dict.createlist@.):wait; (@list (.title))db $lists!=()")
				//.List=(@list (.title))db $list=List.list (:!@list-entity .entity:checked.items $list )dbmul
				,'ICON.share'.ui(":alert`share")
					
			)
			
			,'UL.entities'.d("$entities!; *@ ( (`list-entity $list)db @TIME`dsc )sort"
				,'LI'	.d("? .TIME; $=(.entity)db"
					,'desc'.d("! .desc")
					,'title'.d("! (.title .fallback)?; !? .title:!@fallback")
					,'credit'.d("! $!=.credit:starbar.disabled")
					,'tick'
						.d ("!? .entity:checked.?@checked")
						.ui("!? .entity:checked.!@checked; $checked=:checked.size,?; ?")
				)
				.a("!? ($ $Entity)eq@selected")
				.ui("$Entity=$")
				//.e("contextmenu",)	
			)
			
			,'DECK'.d(""
				,'multi'.d("? $checked"
					,'ICON.remove_circle_outline'.ui("? Ask(dict.remove@.):wait; log `remove; (@list-entity .entity:checked.items $list)dbmul")//
					,'ICON.delete'.ui("? Ask(dict.delete@.):wait; (@entity $:checked.items)dbmul")
					,'ICON.clear'.ui("")//ui("")
				).u("$checked=$:checked.clear $entities!=()")
			)
			
			
			,'ARTICLE'
				//.d("? $lists:!! $entities:?!)!; ! html.about-recent")
				.d("? $list:!; ! html.about-lists")
				//.d("? $lists:??; ! html.about-listitems")
		)
		
		,'VAULT'.d("$?= $entry="
			,'INPUT.key placeholder="🔎"'.d("!! $entry@value").ui("log $entry=#:value,scope.guess")//.d("textonly")
			,'BUTTON.center_focus_weak'.ui("log $entry=#:scan,scope.guess") //.camera
	
		).u(`	? $entry;
			? $Entity=
			  .Entry=($entry)db
			  ($Entity=(@entity $entry@fallback)db .Entry=(@entry $entry $Entity.entity)db)!;
			? $Entity $Entity=(.Entry.entity)db;
			(@list-entity @list"recent $Entity.entity)db $entry=;
		`) /// $Entity=(server@ $entry)uri:query 
	)
	
	,'PAGE.other'.d("? $Entity:!; focus #; $tab="
	
		,'ROOF'.d("Tabset(:split@tabs`help,data)"
/*
			,'TABSET'.d("*@tab "//
				,'TAB'.d("!? .tab; a!")
				.ui("$tab=.tab")
				.a("!? (.tab $tab)eq@selected")
			)
*/
		)
		
		,'ETAGE'
		.d("? $tab:!; ! html.welcome")
		.d("?? $tab@help; ! html.help")
		.d("?? $tab@data"
			,'cleardb'.d("! `Clear").ui("? Ask(dict.cleardb@.):wait; storage.clear")//(@)db
		)
		
	)
	
	,'PAGE.entity'.d("? $Entity; * $Entity@"//; scroll #; (`list-entity @list`recent .entity)db
	
		,'ROOF'.d("focus #@PAGE"
			,'desc contenteditable tabindex=0'
				.d("textonly; ! .desc; focus .desc:!@PAGE")
				.ui(".desc=#:value")
			,'title contenteditable tabindex=0'
				.d("textonly; ! .title; focus .title:!@PAGE")
				.ui(".title=#:value")
			,'credit'.d("! $!=.credit:starbar.enabled").ui(".credit=$!.value")
		).u("(@entity $)db $entities!=()")
		
		,'ETAGE'.d("$tab=`tags Tabset(:split@tab`tags,links,aspects,discuss)"
		
			,'SECTION.tags'.d("?? $tab@tags; $lists!; * (`list)db"

				,'tag'
					.d("! .title; $tagged=(`list-entity .list .entity=$Entity.entity)db:??; a!")
					.a("!? $tagged $tagged:!@unset")
					.ui("(@list-entity .list .entity $tagged:?uid=$tagged:!)db; ?")//? ($? $?=:!)eq;		
				
			)
		
			,'SECTION.opinions'.d("?? $tab@aspects; $?= $aspects!="
			
				
				,'present'.d("$aspects!; * (`entity-aspect .entity)db"
					,'opinion'.d("! Aspect").u("(@entity-aspect $)db")
				)
				
				,'append'.d("? $?; ? $aspects=((@custom`aspects)db).0.value $aspects=(`static/aspects.txt? .entity)uri:query; $edit="
				
					,'UL.addaspects'
						.d("? $edit:!; $!=; *@ $aspects:untab; ! AddAspect")
						.u("$aspects!=( @entity-aspect .entity $!.aspect)db; { ? .desc:!; .desc=$!.category (@entity $)db }")
						
					,'TEXTAREA'
						.d("? $edit; ! $aspects; autoindent")
						.ui("( @custom`aspects $aspects=#:value@value )db")
					
					,'ICON'.d("!? ($edit `done `edit)?!").ui("$edit=$edit:!")
				)
				
				,'BUTTON'.d("!? ($?:! `add `check)?!").ui("$?=$?:!")
			)
		
			,'SECTION.entries'.d("?? $tab@links; * (`entry .entity)db"
				,'A.entry target=_blank'.d(".href=.entry:scope.href; !! .entry@ .href .href@title")
			)
			

		)//.u("(@list-entity @list`recent .entity)db")
		
		,'VAULT'.d(""
			,'ICON.share'.ui("$:share")
		)
	)
)

.DICT({

	server	:"https://cookstat.dapmx.org/repch/query.php?",
	
	Tabset:
		'TABSET'.d("* .tab"
			,'TAB'.d("!? .tab; ! .tab; a!")
				.a("!? (.tab $tab)eq@selected")
				.ui("$tab=.")
		).u("?"),

	Aspect:
		'aspect'.d("$?="
			,'summary'.d(""
				,'name'.d("! .aspect").ui("$?=$?:!; ?")
				,'credit'.d("! $!=.credit:starbar.enabled").ui("$?=.credit=$!.value")
				,'IMG.stats'.d()
			)
			,'notes'.d(""
				,'public'.d("? $?; ? .ref; * (`notes .ref)db"
					,'note'.d("! .note").ui("..note=. ..publicnote=.")
				)
				,'note contenteditable'
					.d("? (.note $?)?; ! .note; focus (.note:! $?)!")
					.ui("? (.note .note=#:text)ne")//? (.note .publicnote:!)?;
			).u("$?=")
		),

	AddAspect:
		'LI'.d("$?=" //[sub-items,name]
			,'aspect'
				.d("? .0:!; ! .1") // if no sub-items - this is an aspect
				.ui("$!=(.1@aspect ..1@category)") // on click return the aspect name and nearest category
			,'category'.d("? .0" // if sub-items present - this is a category
				,'name'.d("! .1").ui("$?=$?:!; ?") // on click toggle open-close
				,'UL.aspects'.d("? $?; *@ .0; ! AddAspect") // show sub-items
			)
		),
/*
	Options	: 'OPTGROUP'.d("! (.selected:! Hint)!; * .options@value; Option( .value ..selected )"), 
	Option	: 'OPTION'.d("!! (.label .value)? .value (.value .selected)eq@selected"),
*/
	Ask	: 'modal'.d("top; $value="
			,'scrim'.ui("$value=")
			,'dialog'.d(""
				,'title'.d("! (.title .message)?")
				,'details'.d("! .details")
				,'INPUT'.d("? .pattern; !! .pattern; focus #")
					.e("blur","$value=#:value; ?") //change 
				,'actions'.d(""
					,'ACTION.cancel'.ui("$value=")
					,'ACTION.ok'.d("! .action")
						.ui("value ($value .action)?")//
						.a("!? (.pattern $value:!)!@disabled")
				)
			)
		).u("kill; ?"),//value $value; 

	dict	:{
		
		createlist	:{
			title:"Create a new list",
			details:"What will be its name?",
			pattern:".*",
			action:"Create list"
		},
		addtolist	:{
			title:"Add entities to the list?",
			details:"Marked entities can be now added to the list you selected.",
			action:"Add to list"
		},
		remove	:{
			title:"Remove entities?",
			details:"Marked entities will be removed from this list only. They will remain in other list and in the history.",
			action:"Remove"
		},
		"delete"	:{
			title:"Delete entities?",
			details:"Marked entities will be completely removed from all lists and deleted from the history",
			action:"Delete"
		},
		cleardb	:{
			title:"Clear all data?",
			details:"All local data will be deleted",
			action:"Сlear"
		}
	},
	
	html	:grab(document.getElementById("content"))

})

.FUNC({
	operate	:{
	
		hint	:(value,alias,node)=>{node.setAttribute("placeholder",value)},
		
		storage	:{
			clear	:()=>confirm("Clear all local data?")&&localStorage.clear()
		},
		
		top	:(value,alias,node)=>{
				node.style.display="none";
				window.setTimeout(()=>{
					document.body.appendChild(node);
					node.style.display="";
				},0);
			},
			
		focus	:(value,alias,node)=>{
				if(value)scrollfocus(node,alias);
			},
			
		textonly: (h=>(value,alias,node)=>node.addEventListener('paste', h))(e=>{
				e.stopPropagation();
				e.preventDefault();
				e.target.textContent=(e.clipboardData||window.clipboardData).getData('Text');
			}),
			
		autoindent:(h=>(value,alias,node)=>node.addEventListener('keyup',h))(e=>{
				if(e.keyCode != 13 || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)return;
				
				const	tgt	= e.target,
					val	= tgt.value,
					pos	= tgt.selectionStart,
					line	= val.slice(val.lastIndexOf('\n', pos - 2) + 1, pos - 1),
					indent = /^\s*/.exec(line)[0],
					st = tgt.scrollTop;
					
				if(!indent) return;
				tgt.value = val.slice(0, pos) + indent + val.slice(tgt.selectionEnd);
				tgt.selectionStart = tgt.selectionEnd = pos + indent.length;
				tgt.scrollTop = st;
			})			

	},
	
	flatten	:{
		db	:Persist.basic,
		dbmul	:Persist.multi,
		
		trace	:(values,names)=>console.log(values.map((v,i)=>names[i]+": "+v).join("; ")),

		alter	:(values,names)=>{
				const	src	=values.pop(),
					tail	=dap.Util.hash(values,names);
				return src&&src.map(row=>Object.assign(row,tail));
			},
			
		sort	:(
				ops=>(values,names)=>values.reduceRight((a,v,i)=>v?ops[v](a,names[i]):a)
			)({
				asc	:(a,v)=>a.sort((x,y)=>x[v]-y[v]),
				dsc	:(a,v)=>a.sort((x,y)=>y[v]-x[v])
			})
/**/
	},
	convert	:{
	
		untab,
		
		starbar	: Starbar(document.createElement("stars"),10),
		"?uid"	: bool	=> bool?Persist.uid():"-",
		split		: str		=> str.split(/,/g),
		share		: ( share => share ? data => share(data) : _ => alert ("Can't share") )(window.navigator.share),
		
		checked	: multiselect,
		
		
		timestamp	: _ => +Date.now(),
		
		scope		: guess,
			
		scan	: (_,r) => r&& Scan()
	}
})

.FUNC(Await)
.RENDER()

;
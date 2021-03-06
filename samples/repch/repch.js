import "https://dap.js.org/0.5";

import Await from "/./stuff/await.js";
import Persist from "/./stuff/persist.js";
import {untab} from "/./stuff/parse.js";

import Scan from "./scanner.js";
import Starbar from "/./stuff/bricks/starbar.js";	

const
	grab	= src	=> [...src.children].reduce((a,n)=>{if(n.id)a[n.id]=src.removeChild(n); return a},{}),
	dataset	= (tags,raws)=>raws.map( raw=>{const row={};tags.forEach((t,i)=>row[t]=raw[i]); return row;} )
	
;

export default

'client'.d("$Entity=; $aspects= $entities= $opinions= $lists!= $entities!="

	,'PAGE.nav'.d("$tab=`lists"
	
		,'ROOF'.d(""
			,'TABSET'.d("*@tab :split`lists,categories"//
				,'TAB'.d("!? .tab@; a!")
				.ui("$tab=.tab")
				.a("!? (..tab $tab)eq@selected")
			)				
			,'ICON.settings'.ui("$Entity=")
		)
		
		,'ETAGE'.d("?? $tab@lists; $list= $checked=$:checked.set,??"
		
			,'ATTIC'.d(""
			
				,'UL.lists'.d(""
					,'LI.recent'.d("a!").ui("$list=`recent").a("!? (`recent $list)eq@selected")
					//,'LI.favorite'.ui()
					//,'LI.offers'.ui()
				)
			
				,'UL.lists'.d("$lists!; * (`list)db"
					,'LI'.d("! .title; a!")
					.ui("$list=.; ? $:checked.set,?! Ask(dict.addtolist@.):wait,! (:!@list-entity .entity:checked.set .list)dbmulti ")//
						.a("!? (.list $list)eq@selected")
				)
				
				,'BAR'.d(""
					,'ICON.add_circle'.ui("? .title=Ask(dict.createlist@.):wait; (@list (.title))db $lists!=()")//.List=(@list (.title))db $list=List.list (:!@list-entity .entity:checked.set $list )dbmulti
					,'ICON.share'.ui(":alert`share")
					,'multi'.d("? $checked"
						,'ICON.remove_circle_outline'.ui("? Ask(dict.remove@.):wait; log `remove; (@list-entity .entity:checked.set $list)dbmulti")//
						,'ICON.delete'.ui("? Ask(dict.delete@.):wait; (@entity $:checked.set)dbmulti")
						,'ICON.clear'.ui("")//ui("")
					).u("$checked=$:checked.clear $entities!=()")
				)
			)
			
			,'UL.entities'.d("$entities!; *@ ( (`list-entity $list)db @TIME`dsc )sort"
				,'LI'	.d("? .TIME; $=(.entity)db; ! (.title .fallback)?; !? .title:!@fallback"
					,'tick'
					.d ("!?@checked .entity:checked.?")
					.ui("$checked=.entity:checked.!; !?@checked .entity:checked.?; ?")
				)
				.a("!? ($ $Entity)eq@selected")
				.ui("$Entity=$")
				//.e("contextmenu",)	
			)
			
			,'ARTICLE'
				//.d("? $lists:!! $entities:?!)!; ! html.about-recent")
				.d("? $list:!; ! html.about-lists")
				//.d("? $lists:??; ! html.about-listitems")
		)
		
		,'VAULT'.d("$?= $entry="
			,'INPUT.key'.d("!! $entry@value").ui("log $entry=#:value,scope.guess")//.d("textonly")
			,'BUTTON.camera'.ui("log $entry=#:scan,scope.guess")
	
		).u("? $entry; ? $Entity= .Entry=($entry)db ($Entity=(@entity $entry@fallback)db .Entry=(@entry $entry $Entity.entity)db)!; ? $Entity $Entity=(.Entry.entity)db; (@list-entity @list`recent $Entity.entity)db $entry=") /// $Entity=(server@ $entry)uri:query 
	)
	
	,'PAGE.other'.d("? $Entity:!; scroll #; $tab="
	
		,'ROOF'.d(""
			,'TABSET'.d("*@tab :split`help,data"//
				,'TAB'.d("!? .tab; a!")
				.ui("$tab=.tab")
				.a("!? (.tab $tab)eq@selected")
			)
		)
		
		,'ETAGE'
		.d("? $tab:!; ! html.welcome")
		.d("?? $tab@help; ! html.help")
		.d("?? $tab@data"
			,'cleardb'.d("! `Clear").ui("? Ask(dict.cleardb@.):wait; storage.clear")//(@)db
		)
		
	)
	
	,'PAGE.entity'.d("? $Entity; scroll #; * $Entity@"//; (`list-entity @list`recent .entity)db
	
		,'ATTIC'.d(""
			,'ICON.share'.ui("$:share")
		)
		
		,'ETAGE'.d(""
		
			,'editables'.d(""
				,'title contenteditable tabindex=0'.d("textonly; ! .title; focus .title:!").ui(".title=#:value")
				,'desc contenteditable tabindex=0'.d("textonly; ! .desc; focus (.title .desc:!)!").ui(".desc=#:value")
			).u("(@entity $)db $entities!=()")
			
			,'SECTION.entries'.d("* (`entry .entity)db"
				,'A.entry target=_blank'.d(".href=.entry:scope.href; !! .entry@ .href .href@title")
			)
			
			,'SECTION.tags'.d("$lists! $?=:!"
			
				,'tagslist.short'.d("* (`list)db"
					,'tag'
						.d("! .title; $tagged=(`list-entity .list .entity=$Entity.entity)db:??; a!")
						.a("!? $tagged $tagged:!@unset")
						.ui("(@list-entity .list .entity $tagged:?uid=$tagged:!)db")//
				).a("!? $?@short")
				
				,'BUTTON'.d("!? ($? `add `check)?!").ui("$?=$?:!")
				
			)


			,'SECTION.opinions'.d("$?= $aspects!="
			
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
		).u("(@list-entity @list`recent .entity)db")
	)
)

.DICT({

	server	:"https://cookstat.dapmx.org/repch/query.php?",

	Aspect:
		'aspect'.d("$?="
			,'summary'.d(""
				,'IMG.stats'.d()
				,'credit'.d("! $!=.credit:starbar.enabled").ui("$?=.credit=$!.value")
				,'name'.d("! .aspect").ui("$?=$?:!; ?")
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
			
		focus	:(value,alias,node)=>{if(value)window.setTimeout(_=>node.focus(),1000)},
		
		scroll:(value,alias,node)=>{
				if(value);
				window.setTimeout( _=>{
					node.scrollIntoView({behavior:"smooth",inline:"end"});
				},200);
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
		dbmulti:Persist.multi,
		
		trace	:(values,names)=>console.log(values.map((v,i)=>names[i]+": "+v).join("; ")),

		alter	:(values,names)=>{
				const	src	=values.pop(),
					tail	=dap.Util.hash(values,names);
				return src&&src.map(row=>Object.assign(row,tail));
			},
			
		sort	:(
				ops=>(values,names)=>values.reduce((a,v,i)=>v?ops[v](a,names[i]):a,values.pop())
			)({
				asc	:(a,v)=>a.sort((x,y)=>x[v]-y[v]),
				dsc	:(a,v)=>a.sort((x,y)=>y[v]-x[v])
			})
	},
	convert	:{
	
		untab,
		
		starbar	: Starbar(document.createElement("stars"),10),
		"?uid"	: bool	=> bool?Persist.uid():"-",
		split		: str		=> str.split(/,/g),
		share		: ( share => share ? data => share(data) : _ => alert ("Can't share") )(window.navigator.share),
		
		checked	: ((set,count)=>({
				"?"	: key	=> set[key],
				"!"	: key => (set[key]=set[key]?null:Date.now())? ++count : --count,
				all	: _=>Object.keys(set),
				set	: _=>Object.keys(set).filter(k=>set[k]),
				clear	: _=>{ set={}; count=0 }
			}))({},0),
		
		
		timestamp	: _ => +Date.now(),
		
		scope		:(function(){
				const
					web	=[
							[ /^(?:www.youtube.com\/watch\?v=)([a-zA-Z0-9-]+)/, "youtube"],
							[ /^(?:youtu.be\/)([a-zA-Z0-9-]+)/, "youtube"],
							[ /^(?:www.facebook.com\/)([^?]+)/, "facebook" ]
						],
						
					nonweb={
							gtin		:/^\d{13}$/
						},
						
					redir	={
							gtin		: gtin=>"http://srs.gs1ru.org/id/gtin/"+gtin,
							youtube	: v	=>"https://youtu.be/"+v, // https://www.youtube.com/watch?v=
							facebook	: id	=>"https://www.facebook.com/"+id
						};
					
				return	{
				
					guess	: entry => {
					
						if(!entry)
							return entry;
					
						if(entry.startsWith("https://")){
							const	key=entry.substring(8);									
							for(let i=web.length; i--;){
								const match=web[i][0].exec(key);
								if(match)return web[i][1]+":"+match[1];
							};
							return decodeURI(entry);
						}
					
						const	parts	= entry.split(":"),
							key	= parts.pop(),
							f	= parts.length&&parts.pop();
							
						if(f)return key.match(nonweb[f])?entry:console.log("format mismatch:"+entry);
						else for(let f in nonweb)if(key.match(nonweb[f]))return f+":"+key;
						console.log("Can't recognize key format");
					},
					
					href	: entry =>{
						const parts	= entry.split(":"),
							urltp	= redir[parts[0]];
						return urltp ? urltp(parts[1]) : parts[1];
					}
				};
			})(),
			
		scan	: (_,r) => r&& Scan()
	}
})

.FUNC(Await);
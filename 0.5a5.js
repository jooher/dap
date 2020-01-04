// 0.4

function Check(value,r){
	return r && value;
}

const	dap=(Env=>
{
	"use strict";
	
	const

	Fail	= reason=>{throw new Error("dap error: "+reason)},
	
	Canonical= ()=>({

	convert	:{
	
		""	:()=>null,
		"check"	:Check,
	
		"?"	:bool=>!!bool,	/// test
		"!"	:bool=>!bool,	/// test inverse
		"#"	:bool=>bool?"+":"-",	/// test as +/-
		
		"+?"	:num=>parseFloat(num)>0,	/// test positive
		"-?"	:num=>parseFloat(num)<0,	/// test negative
		"0?"	:num=>parseFloat(num)===0,	/// test zero
		"!0"	:num=>parseFloat(num)||"",	/// non-zero only
		
		"!!"	:arr=>!isArray(arr),			/// not an array
		"!?"	:arr=>!isArray(arr)&&arr!=null,	/// anything but an array
		"?!"	:arr=>isArray(arr)&&!arr.length,	/// empty array
		"??"	:arr=>isArray(arr)&&arr.length,	/// non-empty array
		
		"+"	:num=>Math.abs(parseFloat(num)||0),	/// abs
		"-"	:num=>-(parseFloat(num)||0),		/// neg
		"~"	:num=>num?(num>0?"+":"-"):0,		/// sgn
		
		"++"	:num=>++num,
		"--"	:num=>--num
	},
	
	flatten	:{
	
		""	: Util.hash,
		
		"&"	: values=> values.reduce(Object.assign,values.pop()),
		
		"?"	: values=>{ for(let i=values.length;i--;)if(values[i])return values[i]; },			/// any - first non-empty //return false; 
		"!"	: values=>{ for(let i=values.length;i--;)if(!values[i])return null; return values[0]; },	/// all - succeeds if empty token found
		"?!"	: values=>values.pop() ? values[1] : values[0], // if-then-else
			
		"~"	: values=>{ const a=values[values.length-1]; let i=0;while(a!=values[++i]);return values[i-1]},	/// next in a row
		eq	: values=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return null;return true; },
		ne	: values=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return true;return null; },
		asc	: values=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a>(a=parseFloat(values[i])))return null;return a; },
		dsc	: values=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a<(a=parseFloat(values[i])))return null;return a; },
				
		join	: values=>values.reverse().join(values.shift()),
		concat	: values=>values.reverse().join(""),
		spaced	: values=>values.reverse().join(" ").replace(/\s\s+/g," ").trim(),
		
		"case"	: (values,tags)=>{ const match=values.pop(); for(let i=values.length; i--;)if(tags[i]==match)return values[i]; },
		"pull"	: (values)=>{const a=values.pop();for(let i=values.length,v; i--;)if(v=a[values[i]])return v;}
	},
	
	operate	:{
	
		// null		- keep on
		// array	- subscope
		// true		- skip to next step
		// false	- next operand, but not next step
		
		"!"	:Print,
		"#!"	:(value,alias,node)=>	{ Env.state(value)},//if()Execute.u(node){if(location.hash!=value){location.hash=value;Execute}}
		
		"#"	:(value,alias,node)=>	{ node[alias]=value; },
		"&"	:(value,alias,node)=>	{ const data=node.$.getDataContext(); if(alias)data[alias]=value; else Object.assign(data,value); },

		//"d!"	:(value,alias,node)=>	{ Execute.update(value||node); },
		"a!"	:(value,alias,node)=> 	{ Execute.a(value||node); },
		"u!"	:(value,alias,node)=>	{ Execute.u(value||node); },
		"d"	:(value,alias,node)=>	{ Execute.Rebuild(value||node) },
		"a"	:(value,alias,node)=>	{ Env.delay(_=>Execute.a(value||node,alias)) },
		"u"	:(value,alias,node)=>	{ 
		Env.delay(
		_=>
		 Execute.u(value||node,alias))
		},
		
		"*"	:(value,alias)=>	value && (alias ? value.map(v=>Box(v,alias)) : value), //!value ? false : !alias ? value : Dataset.mapGrid( alias.split(","), value ),
		"?"	:(value,alias)=>	!!value,
		"??"	:(value,alias)=>	alias?alias==value:!value,
		"?!"	:(value,alias)=>	alias?alias!=value:!!value
		
		}
		
	}),
	
	Box	=(value,alias)=>{
		const r={};
		r[alias]=value;
		return r;
	},
	O	= [],
	E	= "",

	isArray = Array.isArray,
	
	Print	= (value,alias,place,$)=> {
		if(value!=null)
			isArray(value) ? value.forEach(v=>Print(v,null,place,$)) :
			value.spawn	? value.spawn($,place) :
			Env.Print(place,value);
		},
		
	Util	={
			
		merge	: Object.assign || ((tgt,mix)=>{for(let i in mix)tgt[i]=mix[i]; return tgt;}) ,//() ||
		union	: (...src)=>src.reduce(Util.merge,{}),

		stub	: (tgt,map)=>{for(let k in map)tgt=tgt.split(k).join(map[k]);return tgt},
		
		reach	: (entry,path)=>{//path.reduce(o,v=>o&&o[v],start),
				let i=path.length; 
				while(entry&&i--)entry=entry[path[i]];
				return entry;
			},
			
		hash	: (values,tags)=>{
			const hash={};
			for(let a,i=values.length;i--;)
				if((a=tags[i])!='%')
					hash[a]=values[i];
				else if(a=values[i])
					for(let j in a)
						if(j)hash[j]=a[j];
			return hash;
		}
	
	},
	
	Func	= Canonical(),
	
	Compile	= (function(){
		
		const
		
		makePath = (()=>{
		
			function This(route,where){
				this.route=route;
				this.where=where;
			}
			This.prototype={
				reach: function(context){
					return context[this.where] || Fail("Unknown mesh: #"+this.where);
				}
			};
		
			function Const(route){
				this.route=route;
				this.value=undefined;
			}
			Const.prototype={
				reach: function(context){
					if(this.value===undefined){
						const route = this.route.slice(0);
						this.value = Util.reach(context.ns.lookup(route),route) || null;
					}
					return this.value;
				}
			};
		
			function Datum(route){
				let lift=0;
				while(!route[route.length-1]){
						route.pop();
						++lift;
				}
				this.route=route;
				this.lift=lift;
			}
			Datum.prototype={
				reach: function(context){
					let
						target = context.$.data,
						i=this.lift;
					while(i-->0)
						target=target.$ || Fail("Out of data contexts: "+entry);
					return target[''];
				}
			};

			function Statum(route){
				this.route=route;
				this.entry=route[route.length-1];
			}
			Statum.prototype={
				reach: function(context, up){
					let target = up || context.$.state;
					if(up)
						while(!(this.entry in target))
							target=target.$ || Fail("Statum not declared: $"+this.entry);
					return target;
				}
			};
			
			const
				cache = {
					"$" : new This(['','data'],"$"),
					"#" : new This([],"node")
				},
				
				parse = route=>{
					
					const entry = route.pop();
					
					if(!entry)
						return new Datum(route);
					else
						switch(entry.charAt(0)){
								// $.datum => .datum (TODO: traced?)
							
							case'$':
								// $statum
								if(entry.length==1){
									return new Datum(route);
								}
								route.push(entry.substr(1));
								return new Statum(route);
								
							case'#':
								return new This(route,entry.substr(1)||"node"); 

							default:
								route.push(entry);
								return new Const(route)
								
						};					
				}
		
			return (str,tag)=>{
				if(str.slice(-1)==".")
					str += tag || Fail("Invalid shorthand: "+str);
				return cache[str] || (cache[str]=parse(str.split(".").reverse()));
			}
			
		})();
		
		
		function Namespace(uri){
			
			Env.log("New namespace: "+uri);
			
			this.uri	= uri;
			this.func	= Func;
			this.dict	= {};
			this.uses	= {};
			
			this.inherit	= null;
			
			namespaces[uri]	= this;
		}
		Namespace.prototype={
			
			USES	: function(uses){
					for(let ns in uses)
						this.uses[ns]=uses[ns]//Env.Uri.absolute(,this.uri);
					return this;
				},

			FUNC	: function(func){
					for(let d in this.func)
						func[d]=Util.union(this.func[d],func[d]);
					this.func=func;
					return this;
				},
				
			DICT	: function(dict){
					for(let i in dict){
						var p=(this.dict[i]=dict[i]);
						if(p instanceof Proto)p.ns=this;
					}
					return this;
				},
				
			reach	:function(route,domain){
					const
						path = route.split(".").reverse(),
						entry = this.lookup(path,domain);
					return Util.reach(entry,path)||Fail( domain+" not found: "+route);
				},

			lookup	: function(path,domain,key){
			
				if(!key)
					key= path.pop();
				
				const	
					scope	= domain ? this.func[domain] : this.dict,
					xtrn	= this.uses[key],
					entry	= xtrn
						? (path.length?require(xtrn).lookup(path,domain):require(xtrn))
						: scope&&scope[key] || this.inherit&&this.inherit.lookup(path,domain,key);
				return entry;
			}						
				
		};
		
		const		
		namespaces={},//stdns	= new Ns("http://dapmx.org/",true).Func(Func);
		evaluate= js	=> Function('return '+js)(dap),
		require	= uri	=> {
			let	a = namespaces[uri];
			return	a||(namespaces[uri]=
				a=document.getElementById(uri) ? evaluate(a.textContent) :
				Env.require(uri,true) || Fail("Can't resolve namespace: "+uri) //Env.Uri.absolute(uri)
			)
		},
		rootns	= new Namespace(Env.base).FUNC(Env.Func);//Uri.absolute()

		function Proto(ns,utag){
			this.ns	= ns||rootns;
			this.utag	= utag;
			this.stuff	= {};
			this.reacts	= [];
			
			this.elem	= null;
			this.rules	= null;
			this.events = null;
			
			this.tgt	= null;
		}
		Proto.prototype={
			
			$	:function(utag,stuff){
					this.utag = utag; // TODO: TABLE>TBODY,
					return stuff&&stuff.length?this.d(stuff):this;
				},
				
			$$	:function(){ return this.tgt=this },

			set	:function(key,stuff,react){
					const	p = this.tgt || new Proto(this.ns,this.utag).$$();
					if(stuff.length)
						(p.stuff[key]||(p.stuff[key]=[])).push(stuff);
					if(react)
						p.reacts.push(key);
					return p;
				},
				
			d	:function(...stuff)		{ return this.set("d",stuff) },
			a	:function(...stuff)		{ return this.set("a",stuff) },
			u	:function(...stuff)		{ return this.set("u",stuff) },
			ui	:function(...stuff)		{ return this.set("",stuff,true) },//
			e	:function(events,...stuff)	{ return this.set(events,stuff,true) },
			
			r	:function(rule)			{ return new Rule(this.ns,rule) },
			
			DICT	:function(dict){
					this.ns.DICT(dict);
					return this;
				},
				
			FUNC	:function(func){
					this.ns.FUNC(func);
					return this;
				},
				
			USES	:function(uses){
					this.ns.USES(uses);
					return this;
				},
				
			//NS	:function(uri)	{ return Namespace(uri) && this },//Uri.absolute()
			
				
			FOR	:function(stub){
					this.utag=Util.stub(this.utag,stub);
					for(let a in this.stuff)
						this.stuff[a].forEach(stuff=>stuff[0]=Util.stub(stuff[0],stub));
					return this;
				},
				
			
			into	:function(ns){
					this.ns=ns;
					return this;
				},
		
			prepare	:function(ns){
			
				if(!this.rules){
					const	ns	= this.ns,
						stuff	= this.stuff;

					this.rules = {};				
					for(let i in stuff)
						this.rules[i] = new Rule(ns,stuff[i]);
							
					if(this.utag)
						this.elem=Env.Native(this.utag,!!this.rules[""]);					
					
					if(this.reacts.length)
						this.events=this.reacts.reduce((a,k)=>{
							const
								rule	= this.rules[k]||rules[""],
								react	= k||this.elem.getAttribute("ui");
							react.split(" ").forEach(e=>{this.rules[e]=rule});
							return !react ? a : (a+" "+react);
						},
						"").split(" ");					
				}
				return this.rules;
			},
			
			spawn	:function($,place,instead){
				const	rules	= this.rules||this.prepare(),
					d	= rules.d,
					todo	= d ? d.todo||d.engage().todo : null,
					node	= Env.Spawn(this.elem,this.events,Execute.React),
					a	= rules.a;
					
				a&&(a.todo||a.engage());					
					
				node.P	= this;
				node.$ = d&&d.defs ? $.subState() : $;
					
				new Execute.Branch(null,node).runDown(todo,place,instead);//  
				
				return node;
			},
			
			ubind	:function(key){
				this.prepare();
				return this.rules[key]||this.rules.u;//||Fail("No rule for "+key);
			},
			
			RENDER	:function(data,place,instead){Env.render(this,data,place,instead)}
			
		};
					
		function Context(ns,branchStack,uses,defs){
			this.ns	  = ns;
			this.branchStack = branchStack;
			this.uses = uses;
			this.defs = defs;
		}

		function Step(branch,operate,feed,todo){
			this.branch	= branch;
			this.operate= operate;
			this.feed	= feed;
			this.todo	= todo;
		}
		
		function Feed(values,tags,tokens){
			this.values = values;
			this.tags = tags;
			this.tokens = tokens;
		}
		
		function Token(lvalues,rvalue){
			this.lvalues	= lvalues;
			this.rvalue	= rvalue;
			this.value = null;
		};
		
		function Rvalue(convert,flatten,feed,path){
			this.convert = convert
			this.flatten = flatten;
			this.feed	= feed;
			this.path	= path;
		};
		
		function Lvalue(path,convert){
			this.path=path;
			this.convert=convert;
		}
				
		function Rule(ns,branches,rulestring){
			this.ns	= ns;
			this.branches	= branches;
			
			this.todo	= null;
			this.defs	= null;
			this.uses	= null;
		}
		Rule.prototype=(function(){
			
			const	CLEANUP	= new RegExp([		
					/^[;\s]+/,		// leading semicolons
					/[;\s]+$/,		// trailing semicolons
					/\/\*.*?\*\//,		// C-style /* inline comments */
					/[;\s]*\/\/\*.*$/,	// comments to end of line //*
					/\s+(?==)/		// whitespace in front of assignment sign
					].map(s=>"(?:"+s.source+")").join("|"),"g"
				),
				SHRINK	= /\s\s+/g,		// shrink spaces
				BRACKETS=/[({[][;\s]*([^(){}\[\]]*?)[;\s]*[\]})]/g,

				Parse	= str=> {
						str	= str.replace(CLEANUP,'').replace(SHRINK,' ');
						const	branchStack=[],
							stub=(match,inner)=> "<"+branchStack.push(inner.trim())+">";
						while(str!=(str=str.replace( BRACKETS, stub )));
						branchStack.unshift(str.trim());
						return branchStack;
					},
				
				STEPS	= /(?:;\s+)+/,
				TOKENS	= /\s+/,
				
				FUNCS	= {
					OPERATE	: "operate",
					FLATTEN	: "flatten",
					CONVERT	: "convert"
				},
				
				REUSE	= Env.REUSE;
				
			
			// makers
			
			const
/*
			resolveMesh = path => {
				const entry=path.pop().substr(1);
				if(entry)switch(entry){
					// #anything?
				}else{
					if(!path.length)path = REUSE.THENODE;
					else path.push(REUSE.NODE);
				}
				return path;
			},
*/			
			make = context => {
				
				function branchSteps(n){ return context.branchStack[n].split(STEPS); }
				
				function makeTodo(steps,todo){
				
					const
						stepstr = steps.pop(),
						isbranch = stepstr.match(/^(<\d+>)$/);

					if(isbranch){
						const branch = makeTodo(branchSteps(isbranch[1]),null);
						todo = new Step(branch,null,null,todo)
					}
					else{
						const
							tokens= stepstr.split(TOKENS),
							head	= !/[<$=`]/.test(tokens[0]) && tokens.shift().split("@"),
							operate = head[0] && context.ns.reach(head[0],FUNCS.OPERATE),
							alias	= head[1],
							feed	= tokens.length && makeFeed( tokens.reverse(), alias );
						
						todo = new Step(null,operate,feed,todo);
					}

					return steps.length ? makeTodo(steps,todo) : todo;
				};

				function makeFeed(tokens,defaultalias){
					
					let
						count	= tokens.length;
						
					const
						values= new Array(count),
						tags	= new Array(count);
					
					while(count--){
						
						let
							a	= tokens[count],
							tag	= null,
							rvalue = null,
							literal	= (a=a.split("`")).length>2 ? decodeURI(a[2]) : a.length>1 ? a[1] : null,
							alias	= (a=a[0].split("@")).length>1 ? a[1] : null;

						const
							rval = (a=a[0].split("=")).pop(),
							lvalues	= a.length>0 && a.map( lvalue=> {
								const
									a = lvalue.split(":"),
									convert	= a[1] && makeConverts(a[1]),
									path	= a[0] && makePath(a[0],tag) || Fail("Zero-length path (check for ==)");
									
								if(path){						
									if(!tag)
										tag=path.route[0];
									if(path.entry)
										context.defs[path.entry]=true; //=context	// console.warn("Assignment to .DICT entry: "+a[0]);
								}
								return new Lvalue(path,convert);
							});
						
						if(rval){
							
							let
								value = literal,
								a;
								
							const
								convert = (a=rval.split(":")).length>1 && makeConverts(a[1]),
								flatten = (a=a[0].split(">")).length>1 && (context.ns.reach(a[1],FUNCS.FLATTEN) || Util.hash),
								feed = (a=a[0].split("<")).length>1 && makeFeed(context.branchStack[a[1]].split(TOKENS).reverse()),
								path = (a=a[0]) && makePath(a,tag);
								
								let resolved = !feed;
								
							if(path){
								if(!tag)
									tag=path.route[0];
								
								if("value" in path)
									literal = path.reach(context) || literal;
								else{
									resolved=false;
								if(path.entry)
									context.uses[path.entry]=true;
								}
							}
								
							if( literal!=undefined && !feed && convert ){
								while(convert.length){
									const
										c=convert.pop(),
										value=c(literal);
									if(value!==undefined)
										literal=value;
									else { // run-time converter
										convert.push(c);
										resolved = false;
										break;
									}
								}
							}
							if(!resolved)
								rvalue = new Rvalue(convert,flatten,feed,path);
						}
						
						if(alias==null)
							alias = defaultalias;
						
						values[count]	= literal;
						tags	[count]	= alias!=null ? alias : ( tag || REUSE.EMPTY );
						tokens[count]	= (lvalues||rvalue) ? new Token(lvalues,rvalue) : null;
					}
					
					// TODO: test for constant feeds
					
					return new Feed(values,tags,tokens);
				};
				
				
				function makeConverts(str){ return str.split(",").reverse().map(path=>context.ns.reach(path,FUNCS.CONVERT)); }
				
				return epilog => makeTodo(branchSteps(0),epilog);
			}

			return {		
				engage	: function(){
					
						const 
							branches = this.branches,
							uses = {},
							defs = {};
							
						let todo=null;
						
						if(branches)
							for(let i=branches.length; i-->0;){
								const
									stuff=branches[i],
									rulestring = stuff.length&&stuff[0].replace&&stuff.shift(),
									epilog	= stuff.length ? new Step(null, Print, new Feed([stuff],REUSE.DUMMY,REUSE.DUMMY), null ) : null,
									context = rulestring && new Context(this.ns,Parse(rulestring),uses,defs); //

								todo	= context ? make(context)(epilog) : epilog;
							}
									
						this.todo = todo;
						this.uses = Object.keys(uses).length ? uses : null;
						this.defs = Object.keys(defs).length ? defs : null;
						return this;
					},
					
				spawn	: function($,node){
						new Execute.Branch($,node).run(this.todo||this.engage().todo);
					},
					
				ubind	: function(event){ return this }

			}
		})();		
				
		const	EMPTY={
			Feed	: new Feed([],[],[]),
			Rule	: new Rule()
		}

		return	{ Namespace, Proto, Rule, Step, Feed, Token, Rvalue }
		
	})(),
	
	Execute	= (function(){
		
		function Context(data,state){
			this.data=data;
			this.state=state;
		}
		Context.prototype={
			
			getDataContext:
				function(){return this.data['']},
			
			subState:
				function(){return new Context(this.data, {$:this.state})}, // $$x => outer x
				
			subData:
				function(data){return new Context({'':data,$:this.data},this.state)} // ..y => outer y
		}
		
	
		const
		
		REUSE	= Env.REUSE,
		Perf	= (info,since)=>Env.log("PERF "+(Date.now()-since)+" ms : "+info),
		
		
		
		recap	=(arr,i,v)=>{const a=arr.slice(0,i); if(v)a.push(v); return a;},
			
		Append	=(node,$,todo)	=>{ new Branch($,node).run(todo) },
		
		Rebuild	=(node,$)	=>{ node.P.spawn($||node.$,node.parentNode,node) },				
	
		Update	=(node,ev)	=>{
			new Branch(node.$,node,{},ev&&ev.type,ev).checkUp(node)
		},
	
		React	= ev=>{
			Env.stopEvent(ev);
			Perf(ev.type,Date.now(),Update(ev.target,ev));
		};
			
		let	stackDepth	= 0;		

		function Branch($,node,up,route,event){
			this.$ = $||node.$;
			this.node = node;
			this.up = up;
			this.route = route;
			this.event = event;
		}
		Branch.prototype={

			execBranch: //returns true if empty
			function(step){
				
				const	
					isArray	= Array.isArray,
					node	= this.node,
					$	= this.$;
					
				let
					empty	= true,
					flow	= null;
					
				if(++stackDepth>100)
					Fail("Suspicious recursion depth: "+node.P.rules.d.rulestring);
				
				this.postpone=null;
				
				while(step){

					const
						todo = step.todo,
						branch =step.branch;

					if(branch){
						new Branch($,node,this.up).execBranch(branch); // node.$ ?
						if(this.postpone){
							this.postpone.assign({
								branch: this,
								todo: new Step(postpone.todo,null,null,step.todo)
							})
							return;
						}
					}
					else{									
						flow	= null;
							
						const
							operate	= step.operate,
							feed		= step.feed;

						if(!feed)
							flow=operate(null,null,node,$);
						
						else{
							const
								tokens	= feed.tokens,
								values	= feed.values,
								tags		= feed.tags;
								
							let	i	= tokens ? tokens.length : 0;
								
							while(i-->0 && !flow){
								// null		- keep on
								// false	- next operand, but not next step
								// true		- skip to next step
								// array	- rowset subscopes
								// number	- loop
								// object	- subscope
								const
									value = this.execToken(values[i],tokens[i]),
									postpone = this.postpone;
								
								if(postpone){
									if(postpone.blocking(!!operate)){ // 
										postpone.assign({
											branch:this,
											todo:new Compile.Step(null,operate,new Compile.Feed(values,tags,recap(tokens,i,postpone.token)),todo)
										})
										return;
									}
									else this.postpone=null; // ignore non-blocking postpones							
								}
								else if(operate)
									flow = operate(value,tags[i],node,$);
							}
							
							if(flow===true)
								flow = null; // skip to next step
							
							if(flow){
								const
									rows	= isArray(flow) ? flow : !isNaN(-flow) ? Array(flow) : [flow];
								empty = rows.reduce(
									(empty,row)=>
										new Branch($.subData(row),node,this.up).run(todo) && empty,
									empty
								);
							}
						}
					}
					step = (flow==null) && todo;
				}
				--stackDepth;
				
				if(isArray(flow))
					return	empty;
				else
					return flow===false;
			},

			execToken:
			function(literal,token){
			
				if(!token)
					return literal;
				
				const
					$ = this.$,
					up = this.up,
					rvalue = token.rvalue,
					lvalues = token.lvalues;
					
				let value	= token.value;

				if(rvalue && value==null){ 
				
					const
						path = rvalue.path,
						feed = rvalue.feed,
						flatten = rvalue.flatten;
						
					if(path){
						value = path.reach(this, $.state);
						for(let route=path.route, i = route.length; value && i-->0; ){
							const k=route[i];
							value = value[k];
						}
							
					}
					
					if(feed){
						const	
							values = feed.values.slice(0),
							tags = feed.tags,
							tokens = feed.tokens,
							proto = value||literal;
							
							for(let i = tokens.length;i-->0;){
								const
									value	=this.execToken(values[i],tokens[i]),
									postpone=this.postpone;
									
								if(postpone){
									if(postpone.blocking(true)) // in a feed - always blocking?      !!i
										postpone.assign({
											token:
												new Compile.Token(
													recap(parts,p,new Compile.Rvalue(
														values.length && new Compile.Feed(values,tags,recap(tokens,i,postpone.token)),flatten,path)
													),converts
												)
										});
									return;
								}
								values[i]=value;
							}
						
						value = flatten(values,tags);
						
						if(proto)
							Print(proto,null,this.node,this.$.subData(value));
					}
				}

				if(value==null)
					value = literal || "";
				
				let 
					p = lvalues ? lvalues.length : 0,
					convert = rvalue && rvalue.convert;
					
				if(p||convert)
					while(p>=0){
						if(convert)
							for(let c=convert.length; c--; ){
								value=convert[c](value,true);
								if(value instanceof Promise){
									const
										rvalue = c>0 && new Compile.Rvalue(convert.slice(0,c)),
										lvals = p==lvalues.length ? lvalues : p>0 ? recap(lvalues,p) : null,
										token = new Compile.Token(lvals,rvalue)
									
									this.postpone = new Postpone(value,!!p,token);
/*									
										new Compile.Token( //lvalues,rvalue
											recap(parts,p,REUSE.STUB),
											recap(converts,p,c>0 && convert.slice(0,c))
										)
*/
									return;
								}
							}
						if(value==null)
							value="";
				
						if(p--){
							
							const
								lvalue = lvalues[p],
								path = lvalue.path,
								route = path.route,
								entry = path.entry;
								
							let
								target = path.reach(this),
								update = up && entry && target,
								i = route.length,
								key = route[--i];
								
							while(i){
								target=target[key]||(target[key]={});
								key=route[--i];
							}
								
							if(target[key]!==value){
								target[key]=value;
								if(update)
									up[entry]=update[entry];
							}
								
							convert = lvalue.convert;
						}
					};
				
				return value;
			},
			
			run:
			function(todo){
				const isEmpty = todo && this.execBranch(todo) && !this.node.childNodes.length; // is empty?
				return isEmpty;
			},

			runDown:
			function(todo,place,instead){
				const postpone = this.postpone,
					elem = Env.Adopt(place,instead,this.node,this.run(todo),postpone);//
				if(postpone)postpone.locate(elem);
			},
						
			checkUp:
			function(snitch,todo){
			
				const	node	= this.node,
					P	= node.P,
					d	= P.rules.d,
					defs	= d&&d.defs,
					parent	= node.parentNode;
					
				let
					route	= this.route, // this.event && this.event.type,
					rule	= route==true ? null : /*( node.events && node.events[route] ) || */ P.rules[route] || P.rules.u,
					up	= {};
					
				if(rule)
					route	=this.execBranch(todo||rule.todo||rule.engage().todo)||route;
					
				for(const i in this.up)
					if(!defs||!defs[i])
						up[i]=this.up[i];
							
				if(this.postpone){
					 this.postpone.locate(snitch);
					 return up;
				}
					
				up = (parent && parent.P) ? new Branch(parent.$,parent,up,route).checkUp(node) : {};

				for(const i in up)
					this.up[i]=up[i];//if(!(defs&&defs[i]))
					
				return this.checkDown(node,this.up,snitch);
			},
			
			checkDown:
			function (node,dn,snitch){
			
				const
					P=node.P,
					d=P.rules.d,
					a=P.rules.a;
					
				if(d||a){
				
					const
						$	= node.$,
						state	= $.state,
						defs	= !snitch&&d&&d.defs,
						uses	= d&&d.uses,
						affs	= a&&a.uses;
						
					let
						rebuild	= false,
						repaint	= false,
						sift	= null;
					
					for(const i in dn){
						if(!defs||!defs[i])(sift||(sift={}))[i]=state[i]=dn[i];
						if(uses&&uses[i])rebuild=true;
						if(affs&&affs[i])repaint=true;
					}
					
					if(rebuild)
						Rebuild(node);
					
					else	{
						if(sift)
							[...node.children].forEach(n=>n!=snitch&&n.P&&this.checkDown(n,sift));
						if(repaint)
							Append(node,$,a.todo);
						
						return  sift||{};
					}
				}
			}
		};
		
		function Postpone(promise,block,token){//(info,handle)
			this.token	= token;
			this.target	= token;
			this.block	= block;
			this.time	= Date.now();
			
			this.instead= null;
			this.place	= null;
			this.branch	= null;
			this.todo	= null;
			
			promise.then(value => 
				this.resolve(value)
			);
		};
		Postpone.prototype = {
			
			blocking	:function(bool){return this.block || (this.block=bool)},
			
			assign	:function(changes){return Object.assign(this,changes)},
			
			locate	:function(instead){
					if(this.instead=instead){
						if(instead.replacer)instead.replacer.branch=null;
						instead.replacer=this;
					}
					if(this.branch)
						this.branch.postpone=null;
					return this;
				},
				
			resolve	:function(value){
					if(this.branch){
						Perf("wait: ",this.time);
						this.target.value=value;
						Perf("work: "+this.info,Date.now(),
							this.branch.up
							? this.branch.checkUp(this.instead,this.todo) /// [0] hack
							: this.branch.runDown(this.todo,this.place,this.instead)
						);
					}
					this.instead=null;
				}
		};

		return	{ Context, Branch, Postpone, Perf, React,
			Update,
			Append,
			Rebuild,
			
			d	:Print,
			u	:Update,
			a	:(node,rule)=>{ if(!rule)rule=node.P.rules.a; if(rule) new Branch(node.$,node).run( rule.todo||rule.engage().todo ); else Fail("no a rule",node); },
		};

	})();
	
	
	return	{ Env, Util, Execute,
			
		Infect	:function(typePrototype,rules){
				(rules||"d a u ui e r").split(" ").forEach(a=>typePrototype[a]=
					function(...x){return new Compile.Proto(null,this)[a](...x)}
				);
			},
			
		fromjs	:(proto,data)=>proto((utag,...stuff)=>new Compile.Proto().$(utag,stuff)).RENDER(data),
		
		NS	: uri => new Compile.Namespace(uri)

	}
			
})((function(){ // Environment
	
	const
	
	doc	= window.document,
	isArray	= Array.isArray,
	newElem	=	e=> doc.createElement(e),

	DEFAULT	= {
		TAG	: "DIV",
		ELEMENT	: newElem("DIV"),
		EVENT	: "click",
		UIEVENTS : {
			SELECT :'change',
			INPUT :'change',
			TEXTAREA :'change'
		},
		UIEVENT: node => DEFAULT.UIEVENTS[node.nodeName] || ( node.isContentEditable ? 'blur' : DEFAULT.EVENT ),
	},
	
	REUSE	={
		EMPTY	: "",
		STUB	: {},
		
		NONE	: [],
		DUMMY	: [null],
		DUMMIES	: {},
		
		NODE	: null,
		THENODE	: [null],
		SCOPE	: ['']
	},
	
	log	=	m=>{ console.log("DAP "+m);return m; },
	
	parseWithExtra= (dummy => (tag,extra)=>{
		dummy.innerHTML="<"+tag+" "+extra+"></"+tag+">";
		return dummy.firstChild;			
	})(newElem("div")),			
	
	QueryString = (function(){
		
		const
		
		regx =/(?:&|^)([^&=]+)=([^&]*)/g,
		encode = encodeURIComponent,
		decode = c=>decodeURIComponent(c.replace(/\+/g,' ')),
		
		parse	={
			
			pairs	:function(str,tgt){
				if(!tgt)tgt=[];
				str&&str.replace(regx,($0,$1,$2)=>{
					tgt.push({name:$1,value:decode($2)})
				});
				return tgt;
			},
			hash	:function(str,tgt){
				if(!tgt)tgt={};
				str&&str.replace(regx,($0,$1,$2)=>{
					if($1)tgt[$1]=decode($2)
				});
				return tgt;
			},
			feed	:function(str,tgt){
				if(!tgt)tgt={values:[],tags:[]};
				str&&str.replace(regx,($0,$1,$2)=>{
					tgt.values.push(decode($2));
					tgt.tags.push($1);
				})
				return tgt;
			}
		},
		
		build	={
			
			hash	:(qstr,target)=>{
				if(!target)target={};
				if(qstr)
					for(let tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i-->0;){
						var	nv = tups[i].split('='),
							key = nv[0]; //(remap&&remap[key])||
						if(nv.length>1)target[key]=decode(nv[1]);
						else target['!']=key;
					}
				return target;
			},
			
			feed	:(qstr,tgt)=>{
			
				if(!tgt)tgt={values:[],tags:[]};

				if(qstr)
					for(let tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i-->0;)
						if(tups[i]){
							const	nv = tups[i].split('='),
								value = decode(nv.pop()),
								key = nv.length&&nv[0];
							tgt.values.push(value);
							tgt.tags.push(key);//(remap&&remap[key])||
						}
				return tgt;
			},

			neutral	:(hash)=>{
				const arg=[];
				hash.keys().map((k,i)=>{if(k&&hash[k]!=null)arg.push(k+"="+encode(hash[k]))});
				return arg.join('&').replace(/%20/g,'+');
			},
			
			ordered	:(values,tags,emptytoo)=>{
				let uri="";
				for(let i=values.length,v,t;i-->0;)
					if((v=values[i])||(v===0)||emptytoo)
						uri+=(t=tags[i]) ? "&"+t+"="+ encode(v) : v;
				return uri.replace(/%20/g,'+');
			}
		
		},

		merge	=(...strs)=> strs.reduce((tgt,str)=>parse.hash(str,tgt),{});
		
		return	{ parse, build, merge }		
	})(),

	Http	= (function(){

		const

		makeXHR = (req,sync)=>{
			
			if(typeof req === "string") req={url:req};//url,body,headers,method,contentType,)
			else if(req[""])req.body=Mime.prepareContent(req,req[""]);
		
			const	
				request	= window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Msxml2.XMLHTTP'),
				method	= req.method || ( req.body ? "POST" : "GET" );
			
			request.open( method,req.url,!sync ); //Uri.absolute(req.url)
			
			if(req.headers)
				for(const i in req.headers)
					request.setRequestHeader(i,req.headers[i]);
			
			try	{request.send(req.body||null);}
			catch(e){console.warn(e.message);}
			
			return request;
		};
		
		return {			
			request: makeXHR,
			
			execAsync: (req,sync)=>{
				const request=makeXHR(req,sync);
				return sync?request:
				new Promise((resolve,reject)=>{
					request.onreadystatechange = e =>
						(request.readyState == 4) &&
							(Math.floor(request.status/100)==2 ? resolve(request) : reject(request));
				})
			}
		}
	
	})(),
	
	Mime	= (function(){
		
		const
		
		decode = {
			"text/plain"		: request => request.responseText,
			"application/json"	: request => JSON.parse(request.responseText),
			"application/javascript": request => eval(request.responseText),
			"application/xml"		: request => request.responseXML.documentElement
		},
		
		encode = {
			"application/json"	: content=>JSON.stringify(content)		
		},
		
		prepareContent= (req,content) => {
			const
				ctype	= req&&req.headers['Content-type'],
				h	= ctype&&encode[ctype.split(";")[0]];
			return h ? h(content) : null;
		},
		
		parseResponse= req => {
			const	
				ctype=req&&req.getResponseHeader('Content-type'),
				h=ctype&&decode[ctype.split(";")[0]];
			return h ? h(req) : req.responseText;
		};
		
		return {encode,decode,parseResponse,prepareContent}
		
	})(),

	Style	= {
	
		attach	:(node,cls)=>Style.mark(node,cls,true),
		detach	:(node,cls)=>Style.mark(node,cls,false),
			
		mark	:(node,cls,on)=>{
				const	c	= " "+node.className+" ",
					found	= c.indexOf(" "+cls+" ")>-1; //styled(c,cls);
				if(!on!=!found)
					node.className = (on ? (c+cls) : c.replace(new RegExp("\\s+"+cls+"\\s+","g")," ")).trim();
				return node;
			}
	},

	Blend	={
		
		change	:(elem,instead)=>{
			
			const	place=instead.parentNode,
				time=instead.getAttribute("fade");
				
			if(!place)return;
				
			place.insertBefore(elem,instead);
			if(time){
				console.log("fade time: "+time);
				instead.$=null;
				setTimeout(()=>{
					place.removeChild(instead);
				},time);
			}
			else
				place.removeChild(instead);
		}
		
	};
	
	
	return	{ DEFAULT, REUSE, 
		
		base: location.href,
		
		doc, log, 
		Style, Http, Mime, QueryString, Blend,
	
		Native : (str,ui)=>{
			if(!str)return DEFAULT.ELEMENT;
			const	space	= str.indexOf(" "),
				extra	= space<0 ? null : str.substr(space),
				head	= (extra ? str.substr(0,space) : str).split('#'),
				id	= head&&head[1],
				type	= head[0]&&head[0].split("."),
				tag	= (type&&type.length&&type[0]==type[0].toUpperCase()) ? type.shift() : DEFAULT.TAG,
				elem	= extra ? parseWithExtra(tag,extra) : newElem(tag);
			
			if(ui)elem.setAttribute("ui",DEFAULT.UIEVENT(elem));
			if(type.length)elem.className = type.join(" ");//.toLowerCase();
			if(id)elem.id=id;
			return elem;
		},

		Spawn	: (elem,events,handler)=>{
			const el = elem.cloneNode(false);
			if(events)
					events.forEach(e=>e&&el.addEventListener(e,handler));
			return el;
		},
		
		Print	:(place,P)=>{
			place.appendChild(P.nodeType ? P : doc.createTextNode(P));
		}, //P.cloneNode(true)
		
		Adopt	:(place,instead,elem,empty,postponed)=>{
			if(!!empty)Style.attach(elem,"EMPTY");
			if(postponed){
				instead	? Style.attach(instead,"STALE") :
				place	? place.appendChild(Style.attach(instead=elem.cloneNode(true),"AWAIT")) :
				console.log('orphan postponed');
				return instead;
			}
			instead	? Blend.change(elem,instead) ://instead.parentNode.replaceChild(elem,instead) : //
			place	? place.appendChild(elem) :
			console.log('orphan element '+elem);
		},
			
		stopEvent	: e=>{
			e.stopPropagation(); e.preventDefault();
			return e;
		},
		
		require: (url,sync)=>sync
			? Mime.parseResponse(Http.request(url,sync))
			: Http.execAsync(url).then(Mime.parseResponse),
				
		render	:(proto,data,place,instead)=>{
				if(!place){
					if(!instead)instead = document.currentScript;
					place = instead ? instead.parentNode : document.body;
				}
				if(!data)
					data=QueryString.parse.hash(location.hash);
				const	ready = proto.spawn((new dap.Execute.Context()).subData(data),place);//||newStub("dap"); ||State.read()
				instead ? place.replaceChild(ready,instead) : place.appendChild(ready);
				return 0;
			},
			
		delay	:f=>setTimeout(f,200),
			
		Func	:{
			
			convert	:{ log,
				
				value	: node=>(node.value||node.textContent||node.innerText||"").trim(),
				text	: node=>(node.innerText||node.textContent||node.value||"").trim(),
				
				script	: url	=>dap.Util.merge(newElem("script"),{src:url,async:true,onload:()=>{doc.body.appendChild(el)}}),
				copy	: item	=>isArray(item)?item.slice(0):Object.assign({},item),
				now	: elem	=>document.body.appendChild(elem),
				focus	: elem	=>setTimeout(()=>elem.focus(),5),
				
				
				//run-time converters
				
				alert : (msg,r) => r&& alert(msg),
				prompt: (msg,r) => r&& prompt(msg),
				confirm:(msg,r) => r&& confirm(msg),
				
				request:(req,r) => r&& Http.execAsync(req),
				query	: (req,r) => r&& Http.execAsync(req).then(Mime.parseResponse, debug=>{if(req instanceof Object) req.debug=debug})
			},
			
			flatten	:{
				uri	: QueryString.build.ordered,
				format	: (values,tags)=>tags.reduce((str,tag,i)=>str.split('{'+tag+'}').join(values[i]),values.pop())
			},
			
			operate	:{
				log	:(value,alias)	=>{ log(alias+": "+value); },
				
				"!!"	:(value,alias,node)=>{
						if(alias)value?node.setAttribute(alias,value):node.removeAttribute(alias);
						else node.innerHTML+=value;
					},
					
				"!?"	:(value,alias,node)=>{ Style.mark(node,alias,!!value); },			
				"!class":(value,alias,node)=>{ value && node.classList.add(value); },
				
				listen : (value,alias,node)=> {
						(value||window).addEventListener(alias,e=>{node.dispatchEvent(new Event(e.type))}); //Execute.u(target,e.type)
					}
			}
		}
	}		
		
})()
);

dap.Infect(String.prototype);

(inline=>inline&&eval(inline.replace(/\/\/.*$/gm,' ').replace(/\s\s+/g,' ')))(document.currentScript.text);
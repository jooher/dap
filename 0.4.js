// 0.4

function Check(value){
	return value;
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
		"?"	: values=>{ for(let i=values.length;i--;)if(values[i])return values[i]; },			/// any - first non-empty //return false; 
		"!"	: values=>{ for(let i=values.length;i--;)if(!values[i])return null; return values[0]; },	/// all - succeeds if empty token found
		"?!"	: values=>values.pop() ? values[1] : values[0], // if-then-else
		
		"~"	: values=>{ const a=values[values.length-1]; let i=0;while(a!=values[++i]);return values[i-1]},		
		eq	: values=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return null;return true; },
		ne	: values=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return true;return null; },
		asc	: values=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a>(a=parseFloat(values[i])))return null;return a; },
		dsc	: values=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a<(a=parseFloat(values[i])))return null;return a; },
				
		join	: values=>values.reverse().join(values.shift()),
		concat	: values=>values.reverse().join(""),
		spaced	: values=>values.reverse().join(" ").replace(/\s\s+/g," ").trim(),
		
		"case"	: (values,tags)=>{ const match=values.pop(); for(let i=values.length; i--;)if(tags[i]==match)return values[i]; },
		"pull"	: (values)=>{const a=values.pop();for(let i=values.length,v; i--;)if(v=a[values[i]])return v;},
		"merge"	: (values,tags)=>{ const a=values.pop();for(let i=values.length,t;i--;)if(t=tags[i])a[t]=values[i];else Object.assign(a,values[i]);return a;}
	},
	
	operate	:{
	
		// null		- keep on
		// array	- subscope
		// true		- skip to next step
		// false	- next operand, but not next step
		
		"!"	:Print,
		"#!"	:(value,alias,node)=>	{ Env.state(value)},//if()Execute.u(node){if(location.hash!=value){location.hash=value;Execute}}
		
		"#"	:(value,alias,node)=>	{ node[alias]=value; },
		"%"	:(value,alias,node)=>	{ Execute.inject(value,alias,node); }, // DEPRECATED
		"&"	:(value,alias,node)=>	{ Execute.inject(value,alias,node); },
		
		"u"	:(value,alias,node)=>	{ Env.react(node,alias,value,Execute.React); },
		"ui"	:(value,alias,node)=>	{ Env.react(node,alias,value,Execute.React,"ui"); },
		
		//"d!"	:(value,alias,node)=>	{ Execute.update(value||node); },
		"a!"	:(value,alias,node)=> 	{ Execute.a(value||node); },
		"u!"	:(value,alias,node)=>	{ Execute.u(value||node); },
		"d"	:(value,alias,node)=>	{ Execute.Rebuild(value||node) },
		"a"	:(value,alias,node)=>	{ Env.delay(_=>Execute.a(value||node,alias)) },
		"u"	:(value,alias,node)=>	{ Env.delay(_=>Execute.u(value||node,alias)) },
		
		"*"	:(value,alias)=>	value && (alias?value.map(v=>Box(v,alias)):value), //!value ? false : !alias ? value : Dataset.mapGrid( alias.split(","), value ),
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
			isArray(value)	? value.forEach(v=>Print(v,null,place,$)) :
			value.spawn	? value.spawn($,place) :
			Env.print(place,value,alias)			
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
		
		makePath= str=>str.split(".").reverse(), //str&&
		append	=(obj,key,value)=>(obj[key]=obj[key]&&(value.charAt(0)===';')?obj[key]+value:value); /// ???
		
		
		
		function Namespace(uri){
			
			Env.console.log("New namespace: "+uri);
			
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
					const path=makePath(route);
					return Util.reach(this.lookup(path,domain),path)||Fail( domain+" not found: "+route);
				},

			lookup	: function(path,domain,key){
			
				if(!key)
					key= path.pop();
				
				const	scope	= domain ? this.func[domain] : this.dict,
					xtrn	= this.uses[key],
					entry	= xtrn
						? (path.length?require(xtrn).lookup(path,domain):require(xtrn))
						: scope&&scope[key] || this.inherit&&this.inherit.lookup(path,domain,key);
				
//				if(entry instanceof Ns)
//					entry = ns.dict[key] = require(entry);
				
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
		rootns	= new Namespace(Env.Uri.base).FUNC(Env.Func);//Uri.absolute()

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
							const	rule	= this.rules[k]||rules[""],
								react	= k||this.elem.getAttribute("ui");
							react.split(" ").forEach(e=>{this.rules[e]=rule});
							return a+" "+react;
						},
						"").split(" ");					
				}
				return this.rules;
			},
			
			spawn	:function($,place,instead){
				const	rules	= this.rules||this.prepare(),
					d	= rules.d,
					todo	= d ? d.todo||d.engage().todo : null,
					node	= Env.clone(this.elem),
					a	= rules.a;
					
				a&&(a.todo||a.engage());					
					
				node.P	= this;
				node.$	= d&&d.defs ? [{'':$[0]['']},$,$[2]] : $;
					
				if(this.events)
					this.events.forEach(e=>{Env.Event.attach(node,e,Execute.React);})
					
				new Execute.Branch(node.$,node).runDown(todo,place,instead);//  
				
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

		function Step(feed,todo){
			this.feed	= feed;
			this.todo	= todo;
		}
		
		function Feed(values,tags,tokens,op,branch){
			this.values	= values;
			this.tags	= tags;
			this.tokens	= tokens;
			this.op		= op;
			this.branch	= branch;
		}
		
		function Token(parts,converts){
			this.parts	= parts;
			this.converts	= converts;
		};
		
		function Rvalue(feed,path){
			this.feed	= feed;
			this.path	= path;
		};
				
		function Rule(ns,branches,tail){
			this.ns		= ns;
			this.branches	= branches;
			this.tail	= tail;
			
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
				
				//INHRT	= ":: ",// /(?:;\s+)*\s*::\s*(?:;\s+)*/,
				STEPS	= /(?:;\s+)+/,
				TOKENS	= /\s+/,
				
				FUNCS	= {
					OPERATE	: "operate",
					FLATTEN	: "flatten",
					CONVERT	: "convert"
				},
				
				REUSE	= Env.REUSE;
				
			
			// makers
			
			function List(arr,list){
				if(arr)for(let a,i=arr.length;i--;)if(a=arr[i])list=[a,list];
				return list;
			}
						
			function resolveMesh(path){
				const entry=path.pop().substr(1);
				if(entry)switch(entry){
					// #anything?
				}else{
					if(!path.length)path = REUSE.THENODE;
					else path.push(REUSE.NODE);
				}
				return path;
			}			
			
			function makeBranch(context,n,epilog,todo){
				
				if(!context)
					return epilog&&[epilog];

				const	steps = context.branchStack[n].split(STEPS);

				for(let i=steps.length; i--; )
					steps[i]=makeStep(context,steps[i]);				
				
				if(epilog)
					steps.push(epilog);
				
				return List(steps,todo);
			}
			
			function makeStep(context,str){
			
				if(/^<\d+>$/.test(str))
					return {branch:makeBranch(context,str.substr(1,str.length-2))};
				
				const	tokens	= str.split(TOKENS),
					head	= !/[<$=`]/.test(tokens[0]) && tokens.shift(),// operate:convert@alias
					bare	= !tokens.length,
					reuse	= bare&&REUSE.DUMMIES[head];
					
				if(reuse)
					return reuse;
					
				let	a	= head;
				const	alias	= a&&(a=   a.split("@")).length>1 ? a[1] : null,
					convert	= a&&(a=a[0].split(":")).length>1 ? makeConverts(context,a[1]) : null,
					operate	= a&&(a=a[0]) ? context.ns.reach(a,FUNCS.OPERATE) : null,
					feed	= bare ? new Feed(REUSE.DUMMY,alias?[alias]:REUSE.DUMMY,REUSE.DUMMY,operate) :
						 makeTokens( context, tokens.reverse(), operate, (convert || alias!=null)?{alias,convert}:null );
					
				if(bare)REUSE.DUMMIES[head]=feed;
				
				return feed;
			}
			
			function makeTokens(context,tokens,op,head){
				
				let	count	= tokens.length;
				const	values	= new Array(count),
					tags	= new Array(count);
				
				while(count--){
					
					let	a	= tokens[count],
						tag	= null,					
						literal	= (a=a.split("`")).length>2 ? decodeURI(a[2]) : a.length>1 ? a[1] : null,
						alias	= (a=a[0].split("@")).length>1 ? a[1] : null,
						rval	= (a=a[0].split("=")).pop(),	// makeValue( , liter, context ),
						lvals	= a.length>0 ? a : null,	// List(makeValue,parts) : null;
						parts	= [],
						converts= [];
						
					if(lvals)
					for(let i=0; i<lvals.length; i++){
					
						let	convert	= (a=lvals[i].split(":")).length>1 ? makeConverts(context,a[1]) : null,
							path	= a[0] && makePath(a[0]) || Fail("Zero-length path (check for ==)");
							
						if(path){
						
							let	top	= path.length-1,
								entry	= path[top];
							
							if(entry)
							switch(entry.charAt(0)){
							
								case'$'	:
									if(entry=entry.substr(1))
										(context.defs||(context.defs={}))[entry]=true;
									else entry=REUSE.SCOPE;
									path[top]=entry;
									break;
									
								case'#'	:
									path=resolveMesh(path,context);
									break;
								
								default	:// resource as lvalue ?
								
							}// else it is a .dentry.path
							
							if(!tag)tag=path[0];
						}
						
						parts.push(path);
						converts.push(convert);				
					}
					
					if(rval){
						const	convert = (a=rval.split(":")).length>1	? makeConverts(context,a[1]) : (head && head.convert) || null,
							feed	= (a=a[0].split("<")).length>1	? makeArgsFeed(context,a[1]) : null;
							
						let	path	= a[0] ? makePath(a[0]) : null;
							
						if(path){
							
							let	top	= path.length-1,
								entry	= path[top];
							
							if(!path[0]&&lvals)// like, $the.code=. is short for $the.code=.code
								path[0] = tag || Fail("Invalid short: "+tokens[count], context); 

							if(entry)
								switch(entry.charAt(0)){
								
									case'$'	:
										if(entry=entry.substr(1))
											(context.uses||(context.uses={}))[entry]=true;
										//else entry=SCOPE;
										path[top]=entry;
										break;
										
									case'#'	:
										path=resolveMesh(path,context);
										break;
										
									default	:
										if(!tag)tag=path[0];
										literal	= Util.reach(context.ns.lookup(path),path) || literal;
										path	= null;	
								}
								
							if(!tag)tag=path[0];
						}

						if( literal!=null && !feed && convert ){
							while(convert.length){
								const	c=convert.pop(),
									prep=c(literal);
								if(prep!==undefined)
									literal=prep;
								else { // it was run-time converter
									convert.push(c);
									break;
								}
							}
						}
						
						parts.push(new Rvalue(feed,path));
						converts.push(convert);
					}else{
						if(literal==null)
							literal=rval;
						parts.push(null);
						converts.push(null);
					}
					
					if(alias==null)
						alias = head && head.alias;
					
					values	[count]	= literal;
					tags	[count]	= alias!=null ? alias : ( tag || REUSE.EMPTY );
					tokens	[count]	= parts.length ? new Token(parts,converts) : null;
				}
				
				// TODO: test for constant feeds
				
				return new Feed(values,tags,tokens,op);
			}
						
			const
			makeArgsFeed = (context,str)=>{
					let	a	= str.split(">");
					const	flatten	= a[1] && ( a[1].charAt(0)=="."
							? makeAccessor(makePath(a[1].substr(1)))
							: context.ns.reach(a[1],FUNCS.FLATTEN)
						),// : Util.hash,
						tokens	= a[0] && (a=context.branchStack[a[0]]) && a.split(TOKENS);
						
					return	tokens ? makeTokens( context, tokens.reverse(), flatten ) : EMPTY.Feed;
				},			
			makeAccessor = path => values=>
				Util.reach(values,path)
			,
			makeConverts =(context,str)=>str.split(",").reverse().map(path=>context.ns.reach(path,FUNCS.CONVERT));
			
			return {		
				engage	: function(){
					
						const 	uses = {},
							defs = {},
							branches = this.branches;
							
						let todo=null;
						
						if(branches)for(let i=branches.length; i--;){
							const	stuff=branches[i],
								rulestring = stuff.length&&stuff[0].replace&&stuff.shift(),
								epilog	= stuff.length && new Feed([stuff],REUSE.DUMMY,REUSE.DUMMY,Print),
								branch	= makeBranch( rulestring && new Context(this.ns,Parse(rulestring),uses,defs), 0, epilog);
							todo = todo ? [{branch},todo] : branch;
						}
									
						this.todo = todo;
						this.uses = uses;
						this.defs = defs;
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
	
		const
		
		REUSE	= Env.REUSE,
		Perf	= (info,since)=>console.log("PERF "+(Date.now()-since)+" ms : "+info),
	
		ctx	=(data,$,rowset,updata)=>{
			const datarow = data instanceof Object ? data : {"~":data}
			datarow['']=updata;
			return [{'':datarow},$,rowset];
		},

		inject	=(value,alias,node)=>{
			const $=node.$[0][''];
			if(alias) $[alias]=value;
			else Object.assign($,value);
		},
		
		trace	=($,entry)=>$ && ( $[0][entry]==null ? $[0][entry]=trace($[1],entry) : $[0][entry] ),
		
		recap	=(arr,i,v)=>{const a=arr.slice(0,i); if(v)a.push(v); return a;},
			
		Append	=(node,$,todo)	=>{ new Branch($,node).run(todo) },
		
		Rebuild	=(node,$)	=>{ node.P.spawn($||node.$,node.parentNode,node) },				
	
		Update	=(node,event)	=>{ new Branch(node.$,node,{},event).checkUp(node) },		
		React	= e=>{
			e=Env.Event.normalize(e);
			Perf(e.type,Date.now(),Update(e.target,e.type));
			return true;
		};
			
		let	
			stackDepth	= 0;

		function Branch($,node,up,route){
			this.$		= $||node.$;
			this.node	= node;
			this.up		= up;
			this.route	= route;
		}
		Branch.prototype={

			execBranch: //returns true if empty
			function(todo){
				
				const	isArray	= Array.isArray,
					node	= this.node,
					$	= this.$;
					
				let	empty	= true,
					flow	= null;
					
				if(++stackDepth>100)
					Fail("Suspicious recursion depth: "+node.P.rules.d.rulestring);
				
				this.postpone=null;
				
				for(let step;todo&&(step=todo[0]);todo=(flow==null)&&todo[1]){
					if(step.branch){
						new Branch($,node,this.up).execBranch(step.branch); // node.$ ?
						if(this.postpone){
							this.postpone.assign({
								branch : this,
								todo : [{branch:postpone.todo},todo[1]]
							})
							return;
						}
					}else{									
						flow	= null;
							
						const	operate	= step.op,
							tokens	= step.tokens,
							values	= step.values,
							tags	= step.tags;
							
						let	i	= tokens ? tokens.length : 0;
							
						while(i-- && !flow){
							// null		- keep on
							// false	- next operand, but not next step
							// true		- skip to next step
							// array	- rowset subscopes
							// number	- loop
							// object	- subscope
							const value = this.execToken(values[i],tokens[i]),
								postpone = this.postpone;
							
							if(postpone){
								if(postpone.blocking(!!operate)){ // 
									postpone.assign({
										branch:this,
										todo:[new Compile.Feed(values,tags,recap(tokens,i,postpone.token),operate,postpone.todo),todo[1]]
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
							const	updata	= $[0][''],
								rows	= isArray(flow) ? flow : !isNaN(-flow) ? Array(flow) : [flow];
							empty = rows.reduce(
								(empty,row)=>
									new Branch(ctx(row,$,flow,updata),node,this.up).run(todo[1]) && empty,
								empty
							);
						}
					}
				}
				--stackDepth;
				
				if(isArray(flow))
					return	empty;
				else
					return flow===false;
			},

			execToken:
			function(literal,token){
			
				if(!token)return literal;
				
				let	converts= token.converts,
					parts	= token.parts;
			
				let	value	= token.value, // || null, // might had been set as async target
					p	= parts.length-1,
					rvalue	= value==null && parts[p],
					convert	= converts[p];
									
				if(rvalue){ 
				
					const	feed	= rvalue.feed,
						path	= rvalue.path;
						
					if(path){
						let	i	= path.length,
							entry	= path[--i];
						if(entry){
							if(this.up){
								value=this.up[entry];
								if(value==null)for(let $=this.$;$&&(value=$[0][entry])==null;)$=$[1];
							}
							else value=trace(this.$,entry);
							if(value==null)
								Fail("Entry not found: "+entry);
						}
						else value = entry==null ? this.node : this.$[0][''];
						
						while( value && i-- )
							value = value[path[i]];
					}
					
					if(feed){
						const	values	= feed.values.slice(0),
							tags	= feed.tags,
							tokens	= feed.tokens,
							proto	= value||literal;
							
							for(let i = tokens.length;i--;){
								const value	=this.execToken(values[i],tokens[i]),
									postpone=this.postpone;
									
								if(postpone){
									if(postpone.blocking(true)) // in a feed - always blocking?      !!i
										postpone.assign({
											token:
												new Compile.Token(
													recap(parts,p,new Compile.Rvalue(
														values.length && new Compile.Feed(values,tags,recap(tokens,i,postpone.token),feed.op),
														path)
													),converts
												)
										});
									return;
								}
								values[i]=value;
							}
						
						value = (feed.op||Util.hash)(values,tags);
						
						if(proto)
							Print(proto,null,this.node,ctx(value,this.$,this.$[2],this.$[0]['']));
					}
					
				}
				
				if(value==null){
					value = literal || "";
				}
				
				while(p>=0){
				
					if(convert)
						for(let c=convert.length; c--; ){
							value=convert[c](value,true);
							
							if(value&&value instanceof Promise){
								this.postpone=new Postpone(value,!!p,
									new Compile.Token(
										recap(parts,p,REUSE.STUB),
										recap(converts,p,c>0 && convert.slice(0,c))
									)
								);
								return;
							}
						}
						if(value==null)value="";
						
					if(p--){
						let	path	= parts[p],
							i	= path.length,
							entry	= path[i-1],
							up	= entry&&this.up,
							$	= this.$,
							target;
							
						if(entry==null)
							target=this.node,--i;
						else	{
							if(up||i>1)
								while($[0][entry]==null)
									$ = $[1] || Fail("$"+entry+" not declared",this);
							target=$[0];
						}
						
						while(--i)
							target=target[path[i]]||(target[path[i]]={});
							
							
						if(target[path=path[0]]!==value){// ||(up&&up[entry]!==null)
							target[path]=value;
							if(up&&entry)up[entry]=$[0][entry];
						}

						convert = converts&&converts[p];
					}
				}
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
					elem = Env.adopt(place,instead,this.node,this.run(todo),postpone);//
				if(postpone)postpone.locate(elem);
			},
			
			
			checkUp:
			function(snitch,todo){
			
				const	node	= this.node,
					P	= node.P,
					d	= P.rules.d,
					defs	= d&&d.defs,
					parent	= node.parentNode;
					
				let	route	= this.route,
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
			
				const	P=node.P,
					d=P.rules.d,
					a=P.rules.a;
					
				if(d||a){
				
					const	$	= node.$,
						$0	= $[0],
						defs	= !snitch&&d&&d.defs,
						uses	= d&&d.uses,
						affs	= a&&a.uses;
						
					let	rebuild	= false,
						repaint	= false,
						sift	= null;
					
					for(let i in dn){
						if(!defs||!defs[i])(sift||(sift={}))[i]=$0[i]=dn[i];
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

		return	{ Branch, Postpone, Perf, React, inject,
		
			Update,
			Append,
			Rebuild,
			
			d	:Print,
			u	:Update,
			a	:(node,rule)=>{ if(!rule)rule=node.P.rules.a; if(rule) new Branch(node.$,node).run( rule.todo||rule.engage().todo ); else Fail("no a rule",node); },
		};

	})();
	
	
	return	{ Env, Util, Execute,
			
		Async	:(promise,info,handle) => promise,
		
		Infect	:function(typePrototype,rules){
				(rules||"d a u ui e r").split(" ").forEach(a=>typePrototype[a]=
					function(...x){return new Compile.Proto(null,this)[a](...x)}
				);
			},
			
		fromjs	:(proto,data)=>proto((utag,...stuff)=>new Compile.Proto().$(utag,stuff)).RENDER(data),
		
		NS	: uri => new Compile.Namespace(uri)

	}
			
})((function(){ // Environment
	
	const	doc	= window.document,
		isArray	= Array.isArray,
		
		DEFAULT	= {
			TAG	: "div",
			ELEMENT	: doc.createElement("div"),
			EVENT	: "click"
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
		
	log	=	m=>{if(window.console)window.console.log("DAP "+m);return m;},
	
	newStub	= 	c=> doc.createComment(c),
	newElem	=	e=> doc.createElement(e),
	newText	=	t=> doc.createTextNode(t),
	
	

	unHTML=newElem("div"),
	parseWithExtra=(tag,extra)=>{
		unHTML.innerHTML="<"+tag+" "+extra+"></"+tag+">";
		return unHTML.firstChild;			
	},	
			
	Native	=(str,ui)=>{
		if(!str)return DEFAULT.ELEMENT;
		const	space	= str.indexOf(" "),
			extra	= space<0 ? null : str.substr(space),
			head	= (extra ? str.substr(0,space) : str).split('#'),
			id	= head&&head[1],
			type	= head[0]&&head[0].split("."),
			tag	= (type&&type.length&&type[0]==type[0].toUpperCase()) ? type.shift().toLowerCase() : DEFAULT.TAG,
			elem	= extra ? parseWithExtra(tag,extra) : newElem(tag);
		
		if(ui)elem.setAttribute("ui",Event.ui(elem));//type.push(ui);
		if(type.length)elem.className = type.join(" ").toLowerCase();
		if(id)elem.id=id;
		return elem;
	};
	
	
	const

	Event	= (function(){
		
		const
		
		stop	= window.Event 
			? (e)=>{ e.stopPropagation(); e.preventDefault(); return e; }
			: ( )=>{ const e=window.event; e.cancelBubble=true; e.returnValue=false; return e; }
				
		return	{
			attach	: doc.addEventListener	? (node,event,handler,capture)=>{node.addEventListener(event,handler,capture||false)}:
					  doc.attachEvent	? (node,event,handler)=>{node.attachEvent("on"+event,handler,false)}
						: console.warn("Can't listen to events"),//(node,event,handler)=>{node["on"+event]=handler},
						
			normalize 	: e=>{ stop(e); return {type:e.type, target:e.currentTarget||e.srcElement} },
		
		
			ui	:(elems => node=>elems[node.nodeName.toLowerCase()] || ( node.isContentEditable ? 'blur' : DEFAULT.EVENT ) //'click',
				)({
					select	:'change',
					input		:'change', // blur
					textarea	:'change'
				})
		}
	})(),
	
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
					for(let tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i--;){
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
					for(let tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i--;)
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
				for(let i=values.length,v,t;i--;)
					if((v=values[i])||(v===0)||emptytoo)
						uri+=(t=tags[i]) ? "&"+t+"="+ encode(v) : v;
				return uri.replace(/%20/g,'+');
			}
		
		},

		merge	=(...strs)=> strs.reduce((tgt,str)=>parse.hash(str,tgt),{});
		
		return	{ parse, build, merge }		
	})(),

	Uri	= (function(){
	
		const
		
		base = window.location.href.replace(/[?!#].*$/,""),

		keys = ["source","origin","protocol","authority","userinfo","username","password","host","hostname","port","relative","path","directory","file","query","anchor"],
		regx = /^(([^:\/?#]+:)?\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?(([^:\/?#]*)(?::(\d*))?))?)((((?:[^?#\/]*\/)*)([^?#]*))(\?[^#]*)?(#.*)?)/,
			
		parse	= str=>{// based on code from http://blog.stevenlevithan.com/archives/parseuri
			const uri = {};
			regx.exec(str).map((val,i)=>{uri[keys[i]]=val});
			return uri;
		},
		
		absolute=(href,rel)=>{	// evaluate absolute URL from relative to base URL
			
			if(!rel)rel=base;
			if(!href)return rel;
			if(/^\w*:\/\//.test(href))return href;
							
			const	uri	= parse(rel);
			
			switch(href.charAt(0)){
				case'*': return base;
				case'/': return uri.origin+href;
				case'?': return uri.origin+uri.path+href;
				case'#': return uri.origin+uri.path+uri.query+href;
				case'.': 
					const up = href.match(/\.\.\//g);
					if(up){
						uri.directory=uri.directory.split("/").slice(0,-up.length).join('/');
						href=href.substr(up.length*3);
					};
			}
			return uri.origin+uri.directory+href;
		}
		
		return	{ base, parse, absolute }

	})(),
	
	Http	= (function(){

		const

		makeXHR = (req,sync)=>{
			
			if(typeof req === "string") req={url:req};//url,body,headers,method,contentType,)
			else if(req[""])req.body=Mime.prepareContent(req,req[""]);
		
			const	request	= window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Msxml2.XMLHTTP'),
				method	= req.method || ( req.body ? "POST" : "GET" );
			
			request.open( method,req.url,!sync ); //Uri.absolute(req.url)
			
			if(req.headers)
				for(let i in req.headers)
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
					request.onreadystatechange = ()=> 
						(request.readyState == 4) &&
						(request.status>=200 && request.status < 300
							? resolve(request)
							: (reject&&reject(request))
						);
				})
			}
		}
	
	})(),
	
	Mime	= (function(){
		
		const
		
		decode	={
			"text/plain"		: request => request.responseText,
			"application/json"	: request => Json.decode(request.responseText),
			"application/javascript": request => eval(request.responseText),
			"application/xml"		: request => request.responseXML.documentElement
		},
		
		encode	={
			"application/json"	: content=>Json.encode(content)		
		},
		
		prepareContent= (req,content) =>{
			const	ctype	= req&&req.headers['Content-type'],
				h	= ctype&&encode[ctype.split(";")[0]];
			return h ? h(content) : null;
		},
		
		parseResponse= req=>{
			const	ctype=req&&req.getResponseHeader('Content-type'),
				h=ctype&&decode[ctype.split(";")[0]];
			return h ? h(req) : req.responseText;
		};
		
		return {encode,decode,parseResponse,prepareContent}
		
	})(),

	Request= (function(){

		function Post(url){
			this.url=url;
			this.body=null;
			this.mime=null;
		};
		
		Post.prototype={
			addForm	: function(values,tags){
					var body="";
					for(let i=values.length,v,t;i--;)
						if(v=values[i])
							body += (t=tags[i])
							? "&"+t+"="+ encodeURIComponent( typeof v=="object" ? Json.encode(v) : v ) 
							: Json.encode(v);
					this.body=body;
					v=body.charAt(0);
					this.mime= v=='<'?"text/xml" : v=='&'?"application/x-www-form-urlencoded" : "text/plain";
					return this;
				},
				
			addBlob	: function(value,tag){
					this.body=value;
					this.mime=tag||"blob";
					return this;
				}
		}
		
		return	{
			post	:(url,values,tags)=>	new Post(url).addForm(values,tags),
			blob	:(url,value,tag)=>	new Post(url).addBlob(value,tag)
		}
		
	})(),

	Json	={
		encode	:value	=>{let r=0; return value&&JSON.stringify(value,(k,v)=>(k||!r++)?v:undefined)},
		decode	:value	=>value&&JSON.parse(value)
		},

	Storage	={
		put	:data	=>{if(!localStorage)return; for(let key in data)localStorage.setItem(key,JSON.stringify(data[key]));},
		get	:key	=>{try{return JSON.parse(localStorage.getItem(key))}catch(e){return null};}
		},
	
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
	
	
	return	{
		
		doc, DEFAULT, REUSE, 
	
		Native, Event, Style, Http, Uri, Mime, QueryString, Json, Storage, Blend, //, State

		console	:window.console,
		
		print	:(place,P,alias)=>{place.appendChild(P.$ ? P : P.nodeType ? P : newText(P));}, //P.cloneNode(true)
			
		adopt	:(place,instead,elem,empty,postponed)=>{
			
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
			
		clone	:elem=>elem.cloneNode(false),
		
		error	:(elem,e)	=>{Style.attach(elem,"ERROR");elem.setAttribute("title",e.message);console.error(e.message)/*throw e*/},

		open	:(url,frame)	=>{if(frame)window.open(url,frame);else location.href=url; },
		
		require: (url,sync)=>sync
			? Mime.parseResponse(Http.request(url,sync))
			: Http.execAsync(url).then(Mime.parseResponse),
				
		render	:function(proto,data,place,instead){
				if(!place){
					if(!instead)instead = document.currentScript;
					place = instead ? instead.parentNode : document.body;
				}
				const	ready = proto.spawn([{'':data}],place)||newStub("dap"); //||State.read()
				instead ? place.replaceChild(ready,instead) : place.appendChild(ready);	
			},
			
		delay	:f=>setTimeout(f,200),
			
		Func	:{
			
			convert	:{ log, Json, 
				
				value	: node=>(node.value||node.textContent||node.innerText||"").trim(),
				text	: node=>(node.innerText||node.textContent||node.value||"").trim(),
				data	: elem=>[...elem.children].map(ch=>ch.$[0]['']),
		
				script	: url	=>dap.Util.merge(newElem("script"),{src:url,async:true,onload:()=>{doc.body.appendChild(el)}}),
				copy	: item	=>isArray(item)?item.slice(0):Object.assign({},item),
				now	: elem	=>document.body.appendChild(elem),
				focus	: elem	=>setTimeout(()=>elem.focus(),5),
				
				plused	: QueryString.plused,
				json		: Json,
				
				//run-time converters
				alert : (msg,r) => r&& alert(msg),
				request:(req,r) => r&& Http.execAsync(req),
				query	: (req,r) => r&& Http.execAsync(req).then(Mime.parseResponse),
				
				urlhash : (_,r) => r && location.hash.substr(1)
			},
			
			flatten	:{
				uri	: QueryString.build.ordered,
				
				alert	:(values)	=>values.reverse().forEach(alert),
				
				confirm	:(values,tags)	=>{ for(let i=values.length;i--;)if(confirm(values[i]))return tags[i]||true; },
				prompt	:(values)	=>{ for(let i=values.length,a;i--;)if(a=prompt(values[i]))return a;},

				format	: (values,tags)=>tags.reduce((str,tag,i)=>str.split('{'+tag+'}').join(values[i]),values.pop())
			},
			
			operate	:{
				title	:(text)		=>{ doc.title=text; },
				log	:(value,alias)	=>{ log(alias+": "+value); },
				
				"!!"	:(value,alias,node)=>{
						if(alias)value?node.setAttribute(alias,value):node.removeAttribute(alias);
						else node.innerHTML=value;//appendChild(newText(value));
					},
					
				"!?"	:(value,alias,node)=>{ Style.mark(node,alias,!!value); },
				
				"!class":(value,alias,node)=>{ value && node.classList.add(value); },
				
				listen : (value,alias,node)=> {
						const target=value||node;
						if(target.dispatchEvent)
							window.addEventListener(alias,e=>{target.dispatchEvent(new window.Event(e.type))}); //Execute.u(target,e.type)
					},
				
				urlhash	: str => location.hash=str
			}
		}
	}		
		
})()
);

dap.Infect(String.prototype);

(inline=>inline&&eval(inline.replace(/\/\/.*$/gm,' ').replace(/\s\s+/g,' ')))(document.currentScript.text);
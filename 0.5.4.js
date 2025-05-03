// not backwards safe with 0.5 !!!

function check(value,r){
	return r && value;
}

const	dap=(Env=>
{
	"use strict";
	
	const

	Fail	= (reason,$) => {
		throw new Error("dap error: "+reason)
	},
	
	Canonical= ()=>({

	convert	:{
	
		check,
	
		""	:promise=>promise,/// good to run Promises
	
		"?"	:bool=>!!bool,	/// test
		"!"	:bool=>!bool,	/// test inverse
		
		"!!"	:arr=>!isArray(arr),			/// not an array
		"!?"	:arr=>!isArray(arr)&&arr!=null,	/// anything but an array
		"?!"	:arr=>isArray(arr)&&!arr.length,	/// empty array
		"??"	:arr=>isArray(arr)&&arr.length,	/// non-empty array
		
		"+?"	:num=>parseFloat(num)>0,	/// test positive
		"-?"	:num=>parseFloat(num)<0,	/// test negative
		"0?"	:num=>parseFloat(num)===0,	/// test zero
		"!0"	:num=>parseFloat(num)||"",	/// non-zero only
		
		"+"	:num=>Math.abs(parseFloat(num)||0),	/// abs
		"-"	:num=>-(parseFloat(num)||0),		/// neg
		"~"	:num=>num?(num>0?"+":"-"):0,		/// sgn
		
		"++"	:num=>++num,
		"--"	:num=>--num,
		
		"|"	:str => str && str.split("|")
	},
	
	flatten	:{
	
		"&"	: values=> Object.assign(values.pop(),...values),
		"^"	: values=> {
				const a = values.pop(),
					p = Object.assign({},...values),
					inherit = r => Object.assign(Object.create(p),r);
				return Array.isArray(a) ? a.map(inherit) : inherit(a); 
			},
			
		"^"	: values => values.reduce( (up,o) => Object.assign(Object.create(up),o) ),
		
		"*"	: values=>values.reverse(),
		
		"?"	: values=>{ for(let i=values.length;i--;)if(values[i])return values[i]; },			/// any - first non-empty //return false; 
		"!"	: values=>{ for(let i=values.length;i--;)if(!values[i])return null; return values[0]; },	/// all - succeeds if empty token found
		"?!"	: values=>values.pop() ? values[1] : values[0], // if-then-else
			
		"~"	: values=>{ const a=values[values.length-1]; let i=0;while(a!=values[++i]);return values[i-1]},	/// next in a row
		eq	: values=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return null;return true; },
		ne	: values=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return true;return null; },
		asc	: values=>{ let a=parseFloat(values.pop());for(let i=values.length;i--;)if(a>(a=parseFloat(values[i])))return null;return a; },
		dsc	: values=>{ let a=parseFloat(values.pop());for(let i=values.length;i--;)if(a<(a=parseFloat(values[i])))return null;return a; },
				
		join	: values=>values.reverse().join(values.shift()),
		concat	: values=>values.reverse().join(""),
		spaced	: values=>values.reverse().join(" ").replace(/\s\s+/g," ").trim(),

		"case"	: (values,tags)=>{ const match=values.pop(); for(let i=values.length; i--;)if(tags[i]==match)return values[i]; },
		"pull"	: (values)=>{const a=values.pop();for(let i=values.length,v; i--;)if(v=a[values[i]])return v;}
	},
	
	operate	:{
	
		// null	- keep on
		// array	- subscope
		// true	- skip to next step
		// false	- next operand, but not next step
		
		"!"	:Print,
		"?"	:(value,alias)=>	!!value,
		"??"	:(value,alias)=>	alias?alias==value:!!value,
		"?!"	:(value,alias)=>	alias?alias!=value:!value,
		
		"#"	:(value,alias,node)=>	{ node[alias]=value; },
		"&"	:(value,alias,node)=>	{ const data=node.$.getDataContext(); if(alias)data[alias]=value; else Object.assign(data,value); },
		"&?"	:(value,alias,node)=>	{ if(value==null)return; const data=node.$.getDataContext(); if(alias)data[alias]=value; else Object.assign(data,value); },

		"d"	:(value,alias,node)=>	{ Update.Rebuild(value||node); },
		"a!"	:(value,alias,node)=>	{ Update.Append(value||node); },
		"u!"	:(value,alias,node)=>	{ Update.onDemand(value||node); },
		
		"a"	:(value,alias,node)=>	{ Env.delay(_=>Update.Append(value||node,alias)); },
		"u"	:(value,alias,node)=>	{ Env.delay(_=>Update.onDemand(value,alias,node)); },
		
		"*"	:(value,alias)=> !value ? false :
			Array.isArray(value) ? rowsArray(value,alias) :
			Number.isInteger(value) ? rowsNumber(value,alias) :
			value
			
		}
		
	}),
	
	isArray = Array.isArray,
	
	range = length => Array.from({length}).map((a,i)=>i),
		
	rowsArray = (value,alias) => 
		!alias ? value : value.map(namify(alias.split(','))),
		
	rowsNumber = (value,alias) => 
		!alias ? range(value) : range(value).map(n=>({[alias]:n})),
	
	namify = fields => 
		row => isArray(row) ? Object.fromEntries(fields.map((name,i)=>[name,row[i]])) : {[fields[0]]:row},
	
	namespaces = {},
		
	O	= [],
	E	= "",
	
	inherit = o => Object.create(o),
	
	Print	= (value,alias,place,$)=> {
		if( value != null )
			isArray(value) ? value.forEach(v=>Print(v,null,place,$)) :
			value.print	? value.print(place,$) :
			Env.Print(place,value);
		},
		
	Util	={
			
		reach	: (entry,path)=>{//path.reduce(o,v=>o&&o[v],start),
				let i=path.length; 
				while(entry&&i--)entry=entry[path[i]];
				return entry;
			},
			
		hash	: (values,tags)=>{
			const hash={};
			for(let a,i=values.length;i--;)
				if((a=tags[i])!='.')
					hash[a]=values[i];
				else if(a=values[i])
					for(let j in a)
						if(j)hash[j]=a[j];
			return hash;
		}
	
	},
	
	Func	= Canonical(),
	
	Compile = (function(){
		
		const
		
		makePath = (()=>{

			const
			
			cache = {
				'' :{path:null,resolved:true}
			},
			
			runtime = {
				"$" : branch => branch.$.data,
				"#" : branch => branch.node
			};
			
	
			return str => { //: [path,resolved]
				if(!str)return cache[''];
				
				if(!(str in cache)){
					const path = str.split("."),
						entry = path[0];//.shift();

					path[0] =
						!entry ? null :
						runtime[entry] ? runtime[entry] :
						entry[0] === '$' ? entry.slice(1) :
						entry;
					
					cache[str] = path[0]===entry ? null : path;
				}
				return cache[str];
			}
			
		})();
		
				
		function Namespace(uri){
			
			Env.log("New namespace: "+uri);
			
			this.uri	= uri;
			this.func	= {};
			this.dict	= {};
			this.uses	= {};
			
			namespaces[uri]	= this;
		}
		Namespace.prototype={
			
			inherit:
			function(stuff){
				
				if(!stuff)
					return this;
				
				const ns = Object.create(this);
				
				if(stuff.uses.length)
					ns.uses = Object.assign(Object.create(this.uses),...stuff.uses);
				
				if(stuff.dicts.length)
					ns.dict = Object.assign(Object.create(this.dict),...stuff.dicts);
				
				if(stuff.funcs.length){
					ns.func = Object.create(this.func);
					stuff.funcs.forEach( func => {
							for(const f in func){
								if(!ns.func.hasOwnProperty(f))
									ns.func[f]=Object.create(ns.func[f]||null);
								Object.assign(ns.func[f],func[f]);
							}
						}
					)
				}
				
				return ns;
			},

			reach	:function(route,domain){
					const path = route.split("."),
						entry = this.lookup(path.shift(),domain);
					return path.length ? Util.reach(entry,path) : entry ||Fail( domain+" not found: "+route);
				},

			lookup	: function(entry,domain,key){
				const	scope	= domain ? this.func[domain] : this.dict;
				return scope[entry];
			}
			
		};
		
		const

		rootns	= new Namespace("",{}).inherit(
			{
				uses	:[],
				dicts	:[],
				funcs	:[Func,Env.Func]
			});
			
		let ids=0;

		function Scope(scope){
			this.up = scope;
			this.defines = null;
			this.depends = null;
			
			//this.id= ++ids;
		}
		Scope.prototype = {
			
			rvalue: function(entry,depend){ // =$x
				let found=null;
				for(let scope=this; scope&&!found; scope=scope.up){
					if((scope.depends && entry in scope.depends)||(scope.defines && entry in scope.defines))
						found = this;
					if(depend) // bit 0=down 1=append 2=rebuild
						(scope.depends||(scope.depends={}))[entry] |= scope==this ? depend : 1;
				}
				return found ||
					Fail("Statum (rvalue) not found: $"+entry);
			},
		
			lvalue: function(entry,define){ //$x=
				if(define){
					(this.defines||(this.defines={}))[entry]=null; // or init value
					return this;
				}
				for(let scope=this; scope; scope=scope.up)
					if(scope.defines && entry in scope.defines)
						return scope;
				Fail("Statum (lvalue) not found: $"+entry);
			},
			
			depend: function(changes){
				let depend = 0;
				for(const k in changes)
					if(this.depends && k in this.depends)
						depend |= this.depends[k];
					else delete changes[k];
				return depend;
			},

			sift:function(changes){
				if(!this.defines)
					return Object.assign({},changes);//;
				const pass={};
				for(const k in changes)
					if(!(k in this.defines))
						pass[k]=changes[k];
				return pass;
			},

		};
					
		function Proto(ns,utag){
			this.utag	= utag;
			this.stuff	= {};
			this.reacts	= [];
			
			this.scope = null;
			this.nsraw	= null;
			
			this.elem	= null;
			this.ns	= null;
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
			u	:function(...stuff)		{ return this.set("u",stuff) },
			ui	:function(...stuff)		{ return this.set("",stuff,true) },//
			a	:function(...stuff)		{ return this.set("a",stuff) },
			e	:function(events,...stuff)	{ return this.set(events,stuff,true) },
			
			getns	:function() { return this.nsraw || ( this.nsraw = { uses:[], dicts:[], funcs:[] } ) },
			
			USES	:function(uses){
					this.getns().uses.push(uses);
					return this;
				},
				
			DICT	:function(...dicts){
					//this.getns().dicts.push(...dicts);
					this.getns().dicts.push(...dicts);
					return this;
				},
				
			FUNC	:function(...funcs){
					this.getns().funcs.push(...funcs);
					return this;
				},
				
			//NS	:function(uri)	{ return Namespace(uri) && this },//Uri.absolute()
			
				
			FOR	:function(stub){
					this.utag=Util.stub(this.utag,stub);
					for(const a in this.stuff)
						this.stuff[a].forEach(stuff=>stuff[0]=Util.stub(stuff[0],stub));
					return this;
				},
			
			into	:function(ns){
					this.ns=ns;
					return this;
				},
		
			prepare	:function(P,greedy){

				const
					rules = this.rules = {},
					scope = this.scope = new Scope(P&&P.scope),
					ns	= this.ns = (P ? P.ns : rootns).inherit(this.nsraw),
					stuff	= this.stuff;
					

				for(const i in stuff)
					rules[i] = new Rule(ns,scope,stuff[i],i);
				
				this.elem = Env.Native(this.utag,!!rules[""]);
				
				if(greedy)
					for(const i in rules)
						try{
							rules[i].engage(greedy);
						}catch(e){
							console.error(e.message,"in",this.utag);
							this.elem.setAttribute("dap-error",e.message);
						}
						
				if(this.reacts.length)
					this.events=this.reacts.reduce((a,k)=>{
						const
							rule	= rules[k]||rules[""],
							react	= k||this.elem.getAttribute("ui");
						if(react)react.split(" ").forEach(e=>{rules[e.toLowerCase()]=rule});
						return (a&&react) ? (a+" "+react) : (react || a) ;
					},
					"").split(" ");
			},
			
			print	:function(place,$,data,instead){
				
				if(!this.scope)
					this.prepare(place.P);
				
				const
					rules	= this.rules,
					d	= rules.d,
					a	= rules.a,
					node = Env.Spawn(this.elem,this.events,Update.onEvent),
					todo = d&&d.engage();
				
				if(a)
					a.engage();
					
				node.P = this;
				node.$ = Execute.context($,data,this.scope.defines);
					
				new Execute.Branch(node).runDown(todo,place,instead); 
				
				return node;
			},
			
			COMPILE :function(){this.prepare(null,true); return this},

			RENDER	:function(data,place,instead){Env.render(this,data,place,instead)}
			
		};

		function Step(branch,operate,feed,todo){
			this.branch	= branch;
			this.operate= operate;
			this.feed	= feed;
			this.todo	= todo;
		};
		Step.prototype={
			print: function(place){new Execute.Branch(place).execBranch(this)}
		};
		
		function Feed(values,tags,tokens){
			this.values = values;
			this.tags = tags;
			this.tokens = tokens;
		};
		
		function Token(lvalues,rvalue){
			this.lvalues = lvalues;
			this.rvalue	= rvalue;
			this.value = null;
		};
		
		function Expr(feed,flatten){
			this.feed = feed;
			this.flatten = flatten;
		};
		
		function Rvalue(convert,expr,path){
			this.convert = convert
			this.expr = expr;
			this.path	= path;
		};
		
		function Lvalue(path,convert){
			this.path=path;
			this.convert=convert;
		};
				
		function Rule(ns,scope,threads,type){
			this.ns	= ns;
			this.scope = scope;
			this.threads	= threads;
			this.define = // type=='d';
			this.depend = this.dependency[type];
		};
		Rule.prototype=(function(){
			
			const
				CLEANUP	= new RegExp([		
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
						str	= str.replace(CLEANUP,'').replace(SHRINK,' ').replace(/"/g,"`");
						const	brackets=[],
							stub=(match,inner)=> "<"+brackets.push(inner.trim())+">";
						while(str!=(str=str.replace( BRACKETS, stub )));
						brackets.unshift(str.trim());
						return brackets;
					},
				
				STEPS	= /(?:;\s+)+/,
				TOKENS	= /\s+/,
				
				FUNCS	= {
					OPERATE	: "operate",
					FLATTEN	: "flatten",
					CONVERT	: "convert"
				},
				
				oneNull=[null];
				
			// makers
			
			const
			
			make = (rule,brackets) => {

				function makeTodo(steps,epilog){//branches
				
					if(!steps.length)
						return epilog;
				
					const
						stepstr = steps.shift(),
						isbranch = stepstr.match(/^<(\d+)>$/);

					if(isbranch)
						return new Step(makeTodo(branchSteps(isbranch[1])),null,null,makeTodo(steps,epilog))//epilog

					const
						tokens= stepstr.split(TOKENS),
						head	= !/[<$=:`]/.test(tokens[0]) && tokens.shift().split("@"),
						operate = head[0] && rule.ns.reach(head[0],FUNCS.OPERATE),
						alias	= head[1],
						feed	= tokens.length && makeFeed( tokens.reverse(), alias);
					
					return new Step(null, operate, feed, makeTodo(steps,epilog));// steps.length ? : epilog
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
									convert = a[1] && makeConverts(a[1]),
									path = a[0]
										? makePath(a[0]) || Fail("Const can't be lvalue: "+path)
										: Fail("Bad lvalue (check for ==)"),
									entry = path[0];
									
								if(entry)
									if(typeof entry==='string')// statum
										if(path.length===1) // $foo.bar doesn't fire... Hmm...
											rule.scope.lvalue(entry,rule.define);
									//else, runtime
								//else, datum
								if(!tag)tag = path.at(-1);
								return new Lvalue(path,convert);
							});
						
						if(rval){
							
							let a = rval;
								
							const
								convert = (a=a.split(":")).length>1 && makeConverts(a[1]),
								expr = (a=a[0].split("<")).length>1 && makeExpr(a[1]);
							
							let path, resolved = !expr;
							
							if(a=a[0]){
								
								if(a.at(-1)==='.')
									a += tag || Fail("Invalid shorthand: "+a);
								
								if(path = makePath(a)){
									resolved = false;
									const entry = path[0];
									if(entry)
										if(typeof entry==='string')//statum
											rule.scope.rvalue(entry,rule.depend);
										//else, runtime
									//else, statum
								}else //const
									literal = rule.ns.reach(a) || literal;
							}
							
							tag = alias || tag || a.split(".").pop();
								
							if( resolved && convert )
								while(convert.length){
									const
										bak = literal,
										c = convert.pop();
									if((literal=c(literal)) === undefined){ // run-time converter
										literal = bak;
										convert.push(c);
										resolved = false;
										break;
									}
								}
							
							if(!resolved)
								rvalue = new Rvalue(convert,expr,path);
						}
						
						if(alias==null)
							alias = defaultalias;
						
						//if(literal instanceof Proto){} // TODO: sneak scope.depends
							
						
						values[count]	= literal;
						tags	[count]	= alias!=null ? alias : (tag||"");
						tokens[count]	= (lvalues||rvalue) ? new Token(lvalues,rvalue) : null;
					}
					
					// TODO: test for constant feeds
					
					return new Feed(values,tags,tokens);
				};
				
				function makeExpr(str){
					const
						a = str.split(">"),
						tokens = brackets[a[0]],
						feed = makeFeed(tokens ? tokens.split(TOKENS).reverse() : O ),
						flatten = a[1] && ( a[1].charAt(0)=="."
							? makeAccessor(a[1].substr(1))
							: rule.ns.reach(a[1],FUNCS.FLATTEN)
						);
						
					return new Expr(feed,flatten)
				};
				
				function makeConverts(str){return str.split(",").reverse().map(path=>rule.ns.reach(path,FUNCS.CONVERT))}
				function makeAccessor(path){return values=> Util.reach(values,path)}
				
				function branchSteps(n){return brackets[n].split(STEPS)}
				
				return makeTodo(branchSteps(0));//,epilog)
			},
			
			makeBranch = (rule,greedy,rulestring,stuff)=>{
					const
						todo = rulestring && make(rule,Parse(rulestring));
						
					if(stuff){
						const
							subnodes = stuff.map(branch => typeof branch === "string" ? makeBranch(rule,greedy,branch) : branch), //  new Rule(rule.ns,rule.scope,branches,type)
							epilog = new Step(null, Print, new Feed([subnodes],oneNull,oneNull), null );
							
						if(greedy)
							stuff.forEach(ch => ch.prepare && ch.prepare(rule,greedy) );
						
						if(!todo)
							return epilog;
						
						let tail=todo;
						while(tail.todo)tail=tail.todo;
						tail.todo=epilog;
					}

					return todo;
			};

			return {
				
				dependency : {
					a: 2, //Update.Append
					d: 4	//Update.Rebuild
				},
					
				engage: function(greedy){
					
					if(!this.todo){
						const 
							branches = this.threads.map(thread =>
								makeBranch(
									this,
									greedy,
									thread.length && thread[0].replace && thread.shift(),
									thread.length && thread
								)
							);
						
						this.todo = (branches.length==1) ? branches[0] : branches.reverse().reduce(
							(todo,branch)=>new Step(branch,null,null,todo),
							null
						);
					}
					return this.todo;
				},
			}
		})();		
			
		return	{ Namespace, Proto, Rule, Step, Feed, Token, Rvalue, Expr }
		
	})(),
	
	Execute	= (function(){
		
		const
		context = ($,data,stata) => {
			if(data!=undefined || stata){
				$ = Object.create($);
				if(data) $[""] = data;
				if(stata) Object.assign($,stata);
			}
			return $;
		};
		
		function Postpone(promise,block,token){//(info,handle)
			this.time	= Date.now();
			
			this.token = token;
			this.target	= token;
			this.block = block;
			this.instead= null;
			this.place	= null;
			this.branch	= null;
			this.todo	= null;
			
			promise.then(value => this.resolve(value));
		};
		Postpone.prototype = {
			
			blocking	:function(bool){return this.block || (this.block=bool)},
			
			assign	:function(changes){return Object.assign(this,changes)},
			
			locate	:function(instead){
					if(this.instead=instead){
						if(instead.replacer)instead.replacer.branch=null;
						instead.replacer=this;
					}
					return this;
				},
				
			resolve	:function(value){
					if(this.branch){
						Perf("Postpone wait",this.time);
						this.target.value=value;
						Perf("Postpone resolve",new Date(),
							this.branch.up
							? Update.checkUp(this.branch.node,this.branch.up,false,null,this.todo)
							: this.branch.runDown(this.todo,this.place,this.instead)
						);
					}
					this.instead=null;
				}
		};

		function Branch(node,up,data){
			this.node = node;
			this.$ = context(node.$,data);
			this.up = up;
		}
		Branch.prototype={

			execBranch:
			function(step){
				
				const	
					isArray	= Array.isArray,
					node	= this.node;
					
				let
					flow	= null;
					
				this.postpone=null;
				
				while(step){

					const
						todo = step.todo,
						branch =step.branch;

					if(branch){
						const value = new Branch(node,this.up).execBranch(branch); // node.$ ?
						if(value instanceof Postpone)
							return value.assign({
								branch: this,
								todo: new Compile.Step(value.todo,null,null,step.todo)
							});
					}
					else{
						flow	= null;
							
						const
							operate	= step.operate,
							feed		= step.feed;

						if(!feed)
							flow=operate(null,null,node);//,$,this.$.data
						
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
									value = this.execToken(values[i],tokens[i]);
								
								if(value instanceof Postpone)
									return value.blocking(!!operate) && value.assign({
										branch:this,
										todo:new Compile.Step(null,operate,new Compile.Feed(values,tags,recap(tokens,i,value.token)),todo)
									});

								if(operate)
									flow = operate(value,tags[i],node,this.$);//,$.data
							}
							
							if(flow===true)
								flow = null; // skip to next step
							
							if(flow){
								const rows = isArray(flow) ? flow : !isNaN(-flow) ? Array(flow) : [flow];
								rows.forEach( row =>
									new Branch(node,this.up,row).execBranch(todo)
								);
							}
						}
					}
					step = (flow==null) && todo;
				}
				return flow;
			},

			execToken:
			function(literal,token){
			
				if(!token)
					return literal;
				
				const
					up = this.up,
					$ = this.$||this.node.$,
					rvalue = token.rvalue,
					lvalues = token.lvalues;
					
				let
					value	= token.value,
					p = lvalues ? lvalues.length : 0,
					convert = rvalue && rvalue.convert;

				if(rvalue && value==null){ 
				
					const
						path = rvalue.path,
						expr = rvalue.expr;
						
					if(path){
						const entry = path[0],
							stata = entry && (up && (entry in up) ? up : $);
							
						value =
							!entry ? $[""] :
							typeof entry === 'function' ? entry(this) :
							entry in stata ? stata[entry] :
							Fail("Statum not found: "+entry, $);
							
						for(let i=0; value!=null && ++i<path.length; ){
							const key = path[i];
							value =
								!key ? value._prototype :
								typeof value==='object' ? value[key] :
								null
						}
					}
					
					if(expr){
						const proto = value||literal;
						
						value = this.execExpr(expr);
						
						if(value instanceof Postpone)
							return value.assign({
								token: new Compile.Token(
									lvalues,
									new Compile.Rvalue(
										convert, // TODO: converts into postpone
										value.expr,
										path
									)
								)
							});
							
						if(proto)
							value = proto.print(this.node,this.$,value);//
				
					}
				}

				if( value == null )
					value = literal;// || ""
				
				if(p||convert)
					while(p>=0){
						if(convert)
							for(let c=convert.length; c--; ){
								value=convert[c](value,true);
								if(value instanceof Promise)
									return new Postpone(value,!!p,
										new Compile.Token(
											p==lvalues.length ? lvalues : p>0 ? recap(lvalues,p) : null, // lvals =
											c>0 && new Compile.Rvalue(convert.slice(0,c)) // rvalue = 
										)
									);
							}
				
						if(p--){
							
							const
								lvalue = lvalues[p],
								path = lvalue.path,
								entry = path[0],
								len = path.length-1;
								
							let	tgt = !entry ? $[""] :
									typeof entry === 'function' ? entry(this) :
									up || $,
								i = typeof entry === 'string' ? 0:1,
								key = path[i];
								
							while(i<len){
								tgt = key
									? tgt[key]||(tgt[key]={})
									: tgt._prototype;
								key = path[++i];
							}
							
							if(tgt[key]!==value)// || (typeof value === 'object')
								tgt[key]=value;
								
							convert = lvalue.convert;
						}
					};
				
				return value;
			},
			
			execExpr:
			function(expr,proto){
				const
					feed = expr.feed,
					values = feed.values.slice(0),
					tags = feed.tags,
					tokens = feed.tokens;
					
					for(let i = tokens.length;i-->0;){
						const
							value	= this.execToken(values[i],tokens[i]);
							
						if(value instanceof Postpone)
							return value.blocking(true) && value.assign({// in a feed - always blocking?      !!i
								expr: new Compile.Expr(
									new Compile.Feed(values,tags,recap(tokens,i,value.token)),
									expr.flatten
								)
							});
							
						values[i]=value;
					}
					
				return (expr.flatten||Util.hash)(values,tags);
			},

			runDown:
			function(todo,place,instead){
				const
					result = todo && this.execBranch(todo),
					postponed = result instanceof Postpone,
					elem = Env.Adopt(place,instead,this.node,postponed,result);// !this.node.childNodes.length

				if(postponed)
					result.locate(elem);
			}
			
		};
		
		const
		
		Perf	= (info,since)=>info,//Env.log("PERF "+(Date.now()-since)+" ms "+info),
		recap	=(arr,i,v)=>{const a=arr.slice(0,i); if(v)a.push(v); return a;};
			
		return	{ context, Branch, Postpone, Perf };

	})(),

	Update = (function(){
		
		const
		
		adopt = ($,defs,change,sift) => {
			for(const k in change)
				if(k in defs)
					if($[k]===change[k]&&(typeof change[k]!=='object'))
						delete change[k];
					else
						$[k]=change[k];
				else
					sift[k]=change[k];
			return sift;
		},

		checkUp = (node,change,result,snitch,todo) => {

			const parent = node.$parent || node.parentNode;
			
			if(result!==false){
				const rule = node.P.rules[Env.Classify(result)||"u"];
				todo = rule && rule.engage();
			}

			if(todo)
				result = new Execute.Branch(node,change).execBranch(todo);
			
			if(result instanceof Execute.Postpone)
				return !!result.locate(node);

			const
				defs = node.P.scope.defines,
				up = defs && (!parent || node.$!=parent.$)
					? adopt(node.$,defs,change,{})
					: change;
					
			return (parent && parent.P && checkUp(parent,up,result,node)) || checkDown(node,change,snitch)>3;
		},			
		
		checkDown = (node,change,snitch)=>{//
		
			const depend = node.P.scope.depend(change); // bit 0=down 1=append 2=rebuild
			
			if(!depend)
				return false;
			
			if(depend&4)
				return Rebuild(node)||true;
				
			if(depend&2)
				Append(node);
			
			if(depend&1){
				let
					scope = node.P.scope,
					dn = change,
					probe = true;
				for(const n of [...node.children])
					if(n!=snitch && n.P){
						if(n.P.scope!=scope){
							scope = n.P.scope;
							dn = scope.sift(change);
							probe = true;
						}
						if(probe)
							probe = checkDown(n,dn);//
					}
			}
			return depend;
		},
		
		Append = (node,rule)=>{
			if(!rule)
				rule=node.P.rules.a||Fail("no a-rule");
			new Execute.Branch(node).execBranch(rule.todo);
		},

		Rebuild	=(node)	=>{
			const place=node.parentNode;
			node.P.print(place,node.$,null,node);//(node.$.data!=place.$.data)&&node.$.data[""]
		};
		
		return {
			
			checkUp, Rebuild, Append,
			
			onDemand: (value,alias,node)=>{
				checkUp(value||node,{},alias);
			},
			
			onEvent: (event,target)=>{
				const
					node = target||event.currentTarget,
					value = event.type;
				Env.stopEvent(event);
				Execute.Perf(event.type,new Date(),checkUp(node,{},value));//{event}
			}
			
		};
		
	})();
		
	return	{ Env, Util, Execute, Update,
			
		Infect	:function(typePrototype,rules){
			(rules||"d a u ui e r").split(" ").forEach(  a => typePrototype[a] =
				function(...x){return new Compile.Proto(null,this)[a](...x)}
			);
		},
	
		NS	: uri => 'NAMESPACE'.d("")

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
			TEXTAREA :'change',
			FORM :'submit'
		},
		
		UIEVENT: node => 
			DEFAULT.UIEVENTS[node.nodeName] || ( node.isContentEditable ? 'blur' : DEFAULT.EVENT ),
	},
	
	log	=	m=>{ console.log("DAP "+m);return m; },
	
	parseWithExtra= (dummy => (tag,extra)=>{
		dummy.innerHTML="<"+tag+" "+extra+"></"+tag+">";
		return dummy.firstChild;
	})(newElem("div")),
	
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
		
	},

	Watch = (function(){

		const
			watchers ={},
			route = e=>{
				dap.Update.onEvent(e,watchers[e.type])
			};

		return (evtype,node)=> {
			if(!(evtype in watchers))
				window.addEventListener(evtype,route);
			watchers[evtype] = node;
		}

	})(),

	Element = str =>{
		const
			space	= str.indexOf(" "),
			extra	= space>=0 && str.substr(space),
			head	= (extra ? str.substr(0,space) : str).split('#'),
			id	= head && head[1],
			type	= head[0] && head[0].split("."),
			tag	= (type && type.length && type[0]==type[0].toUpperCase()) ? type.shift() : DEFAULT.TAG,
			elem	= extra ? parseWithExtra(tag,extra) : newElem(tag);
			
		if(type.length)elem.className = type.join(" ");//.toLowerCase();
		if(id)elem.id=id;
		
		return elem;
	},
	
	mime = res =>{
		const type = res.headers.get("content-type")?.toLowerCase();
		return res.ok && (
			type.startsWith("text/plain") ? res.text():
			type.startsWith("application/json") ? res.json():
			type.startsWith("application/x-www-form-urlencoded") ? res.formData():
			res
		);
	}
;
	
	return	{
		
		doc, log, 
//		Http, Mime, QueryString, -- extracted to stuff/jsm/xhr.js
		Blend,
		
		Element,
	
		Native: (str,ui)=>{
			const
				parts = str.split(/ `/g),
				head = parts.shift(),
				elem = head ? Element(head) : DEFAULT.ELEMENT;
				
			if(parts.length)
				elem.textContent = parts.join("\n");
			
			if(ui)
				elem.setAttribute("ui",DEFAULT.UIEVENT(elem));
			
			return elem;
		},

		Spawn: (elem,events,handler)=>{
			const el = elem.cloneNode(true);
			if(events)
				events.forEach( e=> {
					if(!e)
						whut();
					const evtype=e.toLowerCase();
					if(e===evtype)
						el.addEventListener(evtype,handler);
					else
						Watch(evtype,el);
				});
			return el;
		},
		
		Print:(place,P)=>{
			place.appendChild(P.nodeType ? P : doc.createTextNode(P));
		},
		
		Classify: result=>
			!result ? result :
			typeof result == 'object' ? result.constructor.name : result,

		Adopt	:(place,instead,elem,postponed,result)=>{

			const r = dap.Env.Classify(result)
			if(r!=null)
				elem.setAttribute('data-dap', r);//elem.classList.toggle("EMPTY",!!empty);
			
			if(postponed){
				instead ? instead.classList.add("STALE") :
				place ? place.appendChild(instead=elem.cloneNode(true)).classList.add("AWAIT") :
				console.log('orphan postponed');
				return instead;
			}

			instead ? Blend.change(elem,instead) ://instead.parentNode.replaceChild(elem,instead) : //
			place ? place.appendChild(elem) :
			console.log('orphan element '+elem);
		},
			
		require: url => fetch(url).then(mime),
				
		stopEvent	: e=>{
			e.stopPropagation();
			if(e.cancelable && !e.target.href)
				e.preventDefault();
			return e;
		},
				
		render	:(proto,data,place,instead)=>{
				if(!place){
					if(!instead)instead = document.currentScript;
					place = instead ? instead.parentNode : document.body;
				}
				if(!data)
					data=location.hash ? new URLSearchParams(location.hash.replace(/^#!?/,'')) : {};
				
				proto.print(place,{},data,instead);
				return 0;
			},
			
		delay	:f=>setTimeout(f,200),
			
		Func	:{
			
			convert	:{ 
			
				text	: node => (node.innerText||node.textContent||node.value||"").trim(),
				value	: node => (node.value||node.textContent||node.innerText||"").trim(),
				wait	: node => new Promise((resolve,reject)=>{node.$.post={resolve,reject}}),
				
				//run-time converters
				
				log	: (msg,r) => r&& console.log(msg),
				alert : (msg,r) => r&& alert(msg),
				prompt: (msg,r) => r&& prompt(msg),
				confirm:(msg,r) => r&& confirm(msg),
									
				fetch	: (req,r) => r && fetch(req),
				query	: (req,r) => r && fetch(req).then(mime)
			},
			
			flatten	:{
				format:(values,tags) => tags.reduce((str,tag,i)=>str.split('{'+tag+'}').join(values[i]),values.pop()),
				uri	:(values,tags) => values
						.map((v,i) => v==null ? null : tags[i] ? "&"+tags[i]+"="+encodeURIComponent(v) : v )
						.filter(v => v!==null)
						.reverse().join("")
			},
			
			operate	:{
				"!!"	:(value,alias,node) => {
						if(alias)
							value ? node.setAttribute(alias,value):node.removeAttribute(alias);
						else
							node.innerHTML+=value;
					},
					
				"!?"	:(value,alias,node) => { 
						if(alias) 
							node.classList.toggle(alias,!!value) 
						else
							value && node.classList.add(value)
					},
					
				log	:(value,alias) => { log(alias+": "+value) },
				
				value	:(value,name,node) => { node.$.post?.resolve(value) },
				remove:(value,name,node) => { (value||node).remove() }

			}
		}
	}

})()
);

dap.Infect(String.prototype);

window["https://dap.js.org/"] = dap;

if(document.currentScript&&document.currentScript.text)
	eval(document.currentScript.text.replace(/\/\/.*$/gm,' ').replace(/\s\s+/g,' '));
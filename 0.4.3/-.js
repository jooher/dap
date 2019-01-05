// 0.4.3

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
	
		"?"	:bool=>bool?true:false,	/// test
		"!"	:bool=>bool?false:true,	/// test inverse
		"#"	:bool=>bool?"+":"-",	/// test as +/-
		
		"+?"	:num=>parseFloat(num)>0,	/// test positive
		"-?"	:num=>parseFloat(num)<0,	/// test negative
		"0?"	:num=>parseFloat(num)===0,	/// test zero
		"!0"	:num=>parseFloat(num)||"",	/// non-zero only
		"??"	:arr=>arr&&arr.length,
		
		"+"	:num=>Math.abs(parseFloat(num)||0),	/// abs
		"-"	:num=>-(parseFloat(num)||0),		/// neg
		"~"	:num=>num?(num>0?"+":"-"):0,		/// sgn
		
		"++"	:num=>++num,
	},
	
	flatten	:{
	
		""	:Util.hash,
		"?"	:(values)=>{ for(let i=values.length;i--;)if(values[i])return values[i]; },			/// any - first non-empty //return false; 
		"!"	:(values)=>{ for(let i=values.length;i--;)if(!values[i])return false; return values[0]; },	/// all - succeeds if empty token found
		
		eq	:(values)=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return false;return true; },
		ne	:(values)=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return true;return false; },
		asc	:(values)=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a>(a=parseFloat(values[i])))return false;return true; },
		dsc	:(values)=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a<(a=parseFloat(values[i])))return false;return true; },
				
		join	:(values)=>values.reverse().join(values.shift()),
		concat	:(values)=>values.reverse().join(""),
		spaced	:(values)=>values.reverse().join(" ").replace(/\s\s+/g," ").trim(),
						
		alert	:(values)	=>{ for(let i=values.length;i--;)Env.alert(values[i]); },
		confirm	:(values,tags)	=>{ for(let i=values.length;i--;)if(Env.confirm(values[i]))return tags[i]||true; },
		
		"case"	: (values,tags)=>{ const match=values.pop(); for(let i=values.length; i--;)if(tags[i]==match)return values[i]; },
	},
	
	operate	:{
	
		// null		- keep on
		// array	- subscope
		// true		- skip to next step
		// false	- next operand, but not next step
		
		"!"	:Print,
		
		"!!"	:Env.attr,
		"!?"	:Env.mark,
		"#"	:(value,alias,node)=>	{ node[alias]=value; },
		
		"u"	:(value,alias,node)=>	{ React.bind(node,alias,value); },
		"ui"	:(value,alias,node)=>	{ React.bind(node,alias,value,"ui"); },
		
		
		"%"	:(value,alias,node,$)=>	{ const d=$[0]['']; if(alias)d[alias]=value; else for(let i in value)d[i]=value[i]; },
		"%%"	:(value,alias,node,$)=>	{ const d=$[0][''],f=alias.split(','); for(let i=f.length;i--;)d[f[i]]=value[i]; },	// example: %% str:split.colon@a,b,c

		"d!"	:(value,alias,node)=>	{ Execute.update(value||node); },
		"a!"	:(value,alias,node)=> 	{ Execute.a(value||node); },
		"u!"	:(value,alias,node)=>	{ Execute.u(value||node); },
		"a?"	:(value,alias,node)=>	{ After.put(Execute.a,value||node); },
		"u?"	:(value,alias,node)=>	{ After.put(Execute.u,value||node); },//{ Execute.u(value||node); }, //
		
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

	isArray = Array.prototype.isArray,
	Print	=(value,alias,place,$)=>{//(place,P,$)=>{
			if(value==null)return;
			if(isArray(value))value.forEach(v=>Print(v,null,place,$));
			else if(value.spawn)value.spawn($,place);
			else Env.print(place,value,alias)			
		},
		
	Util	={
			
		merge	: (tgt,mix)=>{for(let i in mix)tgt[i]=mix[i]; return tgt;},//(Object.assign) ||
		union	: (...src)=>src.reduce(Util.merge,{}),

		
		reach	: (path,start)=>path.reduce(o,v=>o&&o[v],start),
	
		stub	: (tgt,map)=>map.keys.reduce((tgt,k)=>tgt.split(k).join(map[k]),tgt),
		
		hash	: (values,tags)=>{
			const hash={};
			for(let a,i=values.length;i--;)
				if(a=tags[i])hash[a]=values[i];
				else for(let j in a=values[i])hash[j]=a[j];
			return hash;
		}
	
	},
	
	Monads	= Canonical(),
	
	Compile	= (function(){
		
		const
		makePath= str=>str.split(".").reverse(), //str&&
		append	=(obj,key,value)=>(obj[key]=obj[key]&&(value.charAt(0)===';')?obj[key]+value:value), /// ???
		
		
		Namespace = (function(){

			const	registry={};
				//stdns	= new Ns("http://dapmx.org/",true).Monads(Monads);
			
			require = uri=>Function(document.getElementById(uri).textContent)(dap),
			
			lookup	= function(ns,domain,path,key){
			
				if(!key)
					key= path.pop();
				
				const	scope	= domain ? this.monads[domain] : this.dict;
					xtrn	= this.refs[key],
					entry	= xtrn
						? lookup(Namespace(xtrn),domain,path.length&&path)
						: scope&&scope[key] || ns.inherit&&this.inherit.lookup(domain,path,key);
				
				if(entry instanceof Ns)
					entry = this.dict[key] = require(entry);
				
				return entry;
			},						
				
			function Ns(uri,ready){
				
				Env.console.log("New namespace: "+uri);
				
				this.uri	= uri;
				this.monads	= Monads;
				this.dict	= {};
				this.refs	= {};
				
				this.inherit	= null;
				this.ready	= ready;
			}
			Ns.prototype={
				
				USE	: function(refs){
						for(let ns in refs)
							this.refs[ns]=refs[ns]//Env.Uri.absolute(,this.uri);
						return this;
					},

				EXT	: function(monads){
						for(let d in this.monads)
							monads[d]=Util.union(this.monads[d],monads[d]);
						this.monads=monads;
						return this;
					},
					
				DEF	: function(dict){
						for(let i in dict){
							var p=(this.dict[i]=dict[i]);
							if(p instanceof Proto)p.ns=this;
						}
						return this;
					},
					
				reach	: function(path,domain){
						let entry = domain ? lookup(this,makePath(path),domain)||Fail( domain+" not found: "+path):.lookup(this,path);
						while( entry && path.length ) entry = entry[path.pop()];	
						return entry;
					},


				Inherit	: function(ns){
						this.inherit=ns;
						return this;
					},
					
				poke	: function(path,value){
						let	entry=this.dict,
							i=path.length,
							key;
						while(--i)
							entry=entry[key=path[i]]||(entry[key]={});
						return entry[path[0]]=value;
					}
					
					
			};
			
			return function(ref,base,ready){
				const uri = Env.Uri.absolute(ref,base);
				return registry[uri] || (registry[uri]=new Ns(uri,ready));
			}
			
		})(),
		
		rootns	= Namespace(null,null,true).EXT(Env.Monads);//Uri.absolute()

	
		function Proto(ns,utag){
			this.ns		= ns||rootns;
			this.utag	= utag;
			
			this.elem	= null;
			this.rules	= null;
			this.stuff	= {d:null,a:null};
			this.attrs	= {};
			this.react	= [];
			
			this.tgt	= null;
		}
		Proto.prototype={
			
			$	:function(utag,stuff){
					this.utag = utag; // TODO: TABLE>TBODY,
					return stuff&&stuff.length?this.d(stuff):this;
				},
				
			$$	:function(){ return this.tgt=this },
			
			d	:function(...stuff)		{ return this.set("d",stuff) },
			a	:function(...stuff)		{ return this.set("a",stuff) },
			u	:function(...stuff)		{ return this.set("u",stuff) },
			ui	:function(...stuff)		{ return this.set("",stuff,true) },//
			e	:function(event,...stuff)	{ return this.set(event,stuff,true) },
			
			r	:function(rule)			{ return new Rule(this.ns,rule) },
			
			DEF	:function(dict){
					this.ns.DEF(dict);
					return this;
				},
				
			EXT	:function(monads){
					this.ns.EXT(monads);
					return this;
				},
				
			USE	:function(refs){
					this.ns.USE(refs);
					return this;
				},
				
			//NS	:function(uri)	{ return Namespace(uri) && this },//Uri.absolute()
			
			set	:function(key,stuff,react){
					var p = this.tgt || new Proto(this.ns,this.utag).$$();
					if(stuff[0].replace)	append(p.attrs,key,stuff.shift());
					if(stuff)		append(p.stuff,key,stuff);
					if(react)		p.react.push(key);
					return p;
				},
				
				
			FOR	:function(stub){
					this.utag=Util.stub(this.utag,stub);
					for(let a in this.attrs)this.attrs[a]=Util.stub(this.attrs[a],stub);
					return this;
				},
				
			
			into	:function(ns){
					this.ns=ns;
					return this;
				},
		
			prepare	:function(ns){
			
				if(!this.rules){
					var	ns	= this.ns,
						attrs	= this.attrs,
						stuff	= this.stuff;

					this.rules = {};				
					for(let i in attrs)
						this.rules[i] = new Rule(ns,attrs[i],stuff[i]);
							
					var d=this.rules.d||(this.rules.d = stuff.d ? new Rule(ns,null,stuff.d) : new Rule()); // DEFAULT.RULE?
					
					if(!this.react.length)
						this.react=null;
					
					if(this.utag)
						this.elem=Env.Native(this.utag,this.rules[""]&&"ui");
					
					if(!this.elem && d && (d.defs||d.refs))
						Fail("Entry must be an element",this);
				}
				return this.rules;
			},
			
			spawn	:function($,place,instead){
				const	rules	= this.rules||this.prepare(),
					d	= rules.d,
					a	= rules.a,
					node	= Env.clone(this.elem),
					react	= this.react;
					
				node.P=this;
				if(d)node.$=!d.defs ? $ : [{'':$[0]['']},$,$[2]];
					
				if(react)
					for(let i=react.length; i-->0;){
						if(!react[i])rules[react[i]=Env.uievent(node)]=rules[""];
						React.bind(node,react[i]);
					}
					
				new Execute.Branch(node.$,node).exec(d.todo||d.engage().todo,place,instead);
				
				if(a)a.todo||a.engage();
				
				return node;
			},
			
			ubind	:function(key){
				this.prepare();
				return this.rules[key]||this.rules.u;//||Fail("No rule for "+key);
			},
			
			INLINE	:function(data){Env.inline(this,data)}
			
		};
					
		function Context(ns,branchStack){
			this.ns	  = ns;
			this.branchStack = branchStack;
			this.defs = null;
			this.refs = null;
		}

		function Step(feed,todo){
			this.feed	= feed;
			this.todo	= todo;
		}
		
		function Feed(values,tags,tokens,op){
			this.values	= values;
			this.tags	= tags;
			this.tokens	= tokens;
			this.op		= op;
		}
		Feed.prototype={
			EMPTY	: new Feed([],[],[]),
		};
		
		function Token(parts,converts){
			this.parts	= parts;
			this.converts	= converts;
		};
		
		function Rvalue(feed,path){
			this.feed	= feed;
			this.path	= path;
		};
				
		function Rule(ns,str,stuff){
			this.ns		= ns;
			this.rulestring	= str;
			this.stuff	= stuff;
			
			this.todo	= null;
			this.defs	= null;
			this.refs	= null;
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
				
				INHRT	= ":: ",// /(?:;\s+)*\s*::\s*(?:;\s+)*/,
				STEPS	= /(?:;\s+)+/,
				TOKENS	= /\s+/,
				
				MONADS	= {
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
			
			function makeBranch(context,n,epilog){

				const	branchstr	= context.branchStack[n],
					parts		= branchstr.split(INHRT),
					stepsstr	= parts[0],
					inherits	= parts[1],
					steps		= stepsstr.split(STEPS);
					
				let	todo= null;

				for(let i=steps.length; i--; )
					steps[i]=makeStep(context,steps[i]);				
				
				if(epilog)
					steps.push(epilog);

				if(inherits){
				
					const	donor	= inherits.split("#"),
						inherit	= context.ns.reach( donor[0] ) || Fail( "Can't find "+donor[0] ),
						rule	= inherit.ubind && inherit.ubind(donor[1]||"d") || Fail( "Can't inherit from "+donor[0] );
						
					if(rule){
						for(let i in rule.defs)(context.defs||(context.defs={}))[i]=true;
						for(let i in rule.refs)(context.refs||(context.refs={}))[i]=true;
						todo = rule.todo||rule.engage().todo;
					}
				}
				
				return List(steps,todo);
			}
			
			function makeStep(context,str){
			
				if(/^<\d+>$/.test(str))
					return new Step(null,makeBranch(context,str.substr(1,str.length-2),null));
				
				const	tokens	= str.split(TOKENS);
				let	a	= !/[<$=]/.test(tokens[0]) && tokens.shift();// operate:convert@alias
				const	alias	= a&&(a=   a.split("@")).length>1 ? a[1] : null,
					convert	= a&&(a=a[0].split(":")).length>1 ? makeConverts(context,a[1]) : null,
					operate	= a&&(a=a[0]) ? context.ns.reach(a,MONADS.OPERATE) : null;
			
				return new Step(
 					tokens.length
						? makeTokens( context, tokens, operate, (convert || alias!=null)?{alias,convert}:null ) 
						: new Feed( REUSE.DUMMY, REUSE.DUMMIES[alias]||(REUSE.DUMMIES[alias]=[alias]), REUSE.DUMMY, operate ) 
				);
			}
			
			function makeTokens(context,tokens,op,head){
				
				let	count	= tokens.length;
				const	tags	= new Array(count),
					values	= new Array(count);
				
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
											(context.refs||(context.refs={}))[entry]=true;
										//else entry=SCOPE;
										path[top]=entry;
										break;
										
									case'#'	:
										path=resolveMesh(path,context);
										break;
										
									default	:
										if(!tag)tag=path[0];
										literal	= context.ns.reach(path) || literal;
										path	= null;	
								}
								
							if(!tag)tag=path[0];
						}

						if( literal!=null && !feed && convert )
							for(let i=convert.length;i--;)
								literal=convert[i](literal);
						
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
				
				return new Feed( values.reverse(), tags.reverse(), tokens.reverse(), op );
			}
			
			function makeArgsFeed(context,str){
				let	a	= str.split(">");
				const	flatten	= a[1]	? context.ns.reach(a[1],MONADS.FLATTEN) : Util.hash,
					tokens	= a[0] && context.branchStack[a[0]].split(TOKENS);
					
				return	tokens ? makeTokens( context, tokens, flatten ) : Feed.prototype.EMPTY;
			}
			
			const
			
			makeConverts=(context,str)=>str.split(",").reverse().map(path=>context.ns.reach(path,MONADS.CONVERT));
			
			return {
				
				EMPTY	: new Rule(),
		
				engage	: function(){
						var	epilog	= this.stuff && new Step( new Feed([this.stuff],REUSE.DUMMY,REUSE.DUMMY,Print));//makeChildStep(this.ns,this.stuff);
				
						if(this.rulestring){
							var context=new Context(this.ns,Parse(this.rulestring));
							this.todo = makeBranch( context, 0, epilog );
							this.refs = context.refs;
							this.defs = context.defs;
						}
						else 	this.todo = epilog ? [epilog] : REUSE.DUMMY;
						
						return this;
					},
					
				spawn	: function($,node){
						new Execute.Branch($,node).exec(this.todo||this.engage().todo);
					},
					
				ubind	: function(event){ return this }

			}
		})();		
				
		return	{ Namespace, Proto, Rule, Step, Feed, Token, Rvalue }
		
	})(),
	
	Execute	= (function(){
	
		const	REUSE	= Env.REUSE,
			ctx	=(data,$,rowset,updata)=>{
				const datarow = data instanceof Object ? data : {"#":data}
				datarow['']=updata;
				return [{'':datarow},$,rowset];
			},			
			update	=(node,$)=>{ node.P.spawn($||node.$,node.parentNode,node) },
			trace	=($,entry)=>$ && ( $[0][entry]==null ? $[0][entry]=trace($[1],entry) : $[0][entry] ),
			
			recap	=(arr,i,v)=>arr.slice(0,i).concat(v)
			;
			
		let	postpone	= null,
			stackDepth	= 0;

		function Branch($,node,up,route){
			this.$		= $||node.$;
			this.node	= node;
			this.up		= up;
			this.route	= route;
		}
		Branch.prototype={

			exec:
			function(todo,place,instead){
				//Execute.async = !this.up;	// asynchronous stuff not allowed on u phase
				const	node	= this.node,
					branch	= todo && this.execBranch(todo),
					empty	= branch && !node.childNodes.length;
					
				if(postpone){
					if(instead)Env.dim(instead);
					postpone.branch=this;
					postpone.locate(place,instead,);
					postpone.ready();
				}
				else
					if(empty===true)
						Env.mute(node);
				
				if(place)//&&branch
					instead ? place.replaceChild(node,instead) : place.appendChild(node);
						
				return empty;
			},
			
			execBranch: //returns true if empty
			function(todo){
				
				var	node	= this.node,
					$	= this.$,
					isArray	= Array.prototype.isArray,
					empty	= true,
					flow	= null;
					
				if(++stackDepth>100)
					Fail("Suspicious recursion depth: "+node.P.rules.d.rulestring);
				
				for(let step;todo&&(step=todo[0]);todo=(flow==null)&&todo[1]){
					if(step.todo){
						const branch = new Branch($,node,this.up).execBranch(step.todo); // node.$ ?
						if(postpone){
							postpone.todo=[new Compile.Step(null,postpone.todo),todo[1]];
							return;
						}
					}else										
						flow	= null;
							
						const	feed	= step.feed,
							operate	= feed.op,
							tokens	= feed.tokens,
							values	= feed.values,
							tags	= feed.tags;

						let	i	= tokens.length;
							
						while(i-- && !flow){
							// null		- keep on
							// false	- next operand, but not next step
							// true		- skip to next step
							// array	- rowset subscopes
							// number	- loop
							// object	- subscope
							const value = this.execToken(values[i],tokens[i]);
							if(postpone){
								postpone.todo=[new Compile.Step(new Compile.Feed(values,tags,recap(tokens,i,postpone.token),operate),postpone.todo),todo[1]];//
								return;
							}
							if(operate)
								flow = operate(value,tags[i],node,$);
						}
						
						if(flow===true)
							flow = null; // skip to next step
						
						if(flow){
							const	updata	= $[0][''],
								rows	= isArray(flow) ? flow : !isNaN(-flow) ? Array(flow) : [flow];
							empty = rows.reduce(
								(empty,row)=>
									new Branch(ctx(row,$,flow,updata),node,this.up).exec(todo[1]) && empty,
								empty
							);
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
			
				var	value	= token.value || null, // might had been set as async target
					converts= token.converts,
					parts	= token.parts,
					p	= parts.length-1,
					rvalue	= value==null && parts[p],
					convert	= converts[p],
					a;
				
				if(rvalue){ 
				
					var	feed	= rvalue.feed,
						path	= rvalue.path,
						flat	= null;
						
					if(path){
						var	i	= path.length,
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
						var	values	= feed.values.slice(0),
							tags	= feed.tags,
							tokens	= feed.tokens,
							proto	= value||literal;
							
							for(let i = tokens.length;i--;){
								value=this.execToken(values[i],tokens[i]);
								if(postpone){
									postpone.token=new Compile.Token(
										recap(parts,p,new Compile.Rvalue(
											values.length && new Compile.Feed(values,tags,recap(tokens,i,postpone.token),feed.op),		
											path)
										),converts
									);
									return;
								}
								values[i]=value;
							}
						
						value = feed.op(values,tags);
						
						if(proto){
							value['']=this.$[0][''];
							Print(proto,null,this.node,[{'':value},this.$,this.$[2]]);
						}							
					}
					
				}
				
				if(value==null){
					value = literal || "";
					if(literal!=null)convert = null;// literal values are already pre-converted
				}
				
				while(p>=0){
				
					if(convert)
						for(let c=convert.length; c--; ){
							value=convert[c](value);
							if(postpone){
								postpone.token = postpone.target = 
								new Compile.Token(
									recap(parts,p,REUSE.STUB),
									recap(converts,p,c>0 && convert.slice(0,c))
								);
								return;
							}
						}
						if(value==null)value="";
				
					if(p--){
						var	path	= parts[p],
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

						convert = converts[p];
					}
				}
				return value;
			},

			checkUp:
			function(snitch,todo){
			
				var	node	= this.node,
					P	= node.P,
					defs	= P.rules.d.defs,
					up	= {},
					parent	= node.parentNode,
					route	= this.route,
					rule	= route==true ? null : ( node.reacts && node.reacts[route] ) || P.rules[route] || P.rules.u;
					
				if(rule)
					route	=this.execBranch(todo||rule.todo||rule.engage().todo)||route;
					
				if(postpone){
					postpone.branch=this;
					postpone.instead=snitch;
					return;
				}
					
				for(let i in this.up)
					if(!defs||!defs[i])
						up[i]=this.up[i];
							
				up = (parent && parent.P) ? new Branch(parent.$,parent,up,route).checkUp(node) : {};

				for(let i in up)
					this.up[i]=up[i];//if(!(defs&&defs[i]))
					
				return this.checkDown(node,this.up,snitch);
			},
			
			checkDown:
			function (node,dn,snitch){
			
				var	P=node.P,
					d=P.rules.d,
					a=P.rules.a;
					
				if(d||a){
				
					var	$	= node.$,
						$0	= $[0],
						defs	= !snitch&&d.defs,
						refs	= d&&d.refs,
						affs	= a&&a.refs,
						rebuild	= false,
						repaint	= false,
						sift;
					
					for(let i in dn)
						if($0[i]!=null){
							if(!defs||!defs[i])(sift||(sift={}))[i]=$0[i]=dn[i];
							if(refs&&refs[i])rebuild=true;
							if(affs&&affs[i])repaint=true;
						}
					
					if(rebuild)
						update(node);
					
					else	{
						if(sift)
							for(let nodes=node.childNodes,i=nodes.length,n;i--;)
								if((n=nodes[i])!=snitch && n.P )this.checkDown(n,sift);
						if(repaint)
							new Branch($,node).exec(a.todo);
						
						return  sift||{};
					}
				}
			}
		};
		
		function Postpone(info){
			this.instead	= null;
			this.place	= null;
			this.target	= null;
			this.branch	= null;
			this.todo	= null;
			this.token	= null;
			this.time	= Date.now();
			this.info	= info;
			
			if(postpone)
				Env.console.warn("Orphan postpone: "+postpone.info);
				
			postpone	= this;
		};
		Postpone.prototype = {
			locate	:function(place,instead){
					if(this.instead=instead){
						this.place=place;
						if(instead.replacer)instead.replacer.dismiss();
						instead.replacer=this;
					}
					return this;
				},
			ready	:function(){
					postpone=null;
				},				
			dismiss	:function(){
					this.branch=null;
				},
			resolve	:function(value){
					if(this.branch){
						perf("wait: "+this.info,this.time);
						this.target.value=value;
						After.hold();
						Env.perf("exec: "+this.info,Date.now(),
							this.branch.up
							?this.branch.checkUp(this.instead,this.todo)
							:this.branch.exec(this.todo,this.place,this.instead)
						);
						After.run();
					}
					this.instead=null;
				}
		};
		
		return	{
		
			d	:Print,
			a	:function(node,rule)	{ if(!rule)rule=node.P.rules.a; if(rule) new Branch(node.$,node).exec( rule.todo||rule.engage().todo ); else Fail("no a rule",node); },
			u	:function(node,event)	{ new Branch(node.$,node,{},event).checkUp(); },
			
			Postpone, Branch, update
		};

	})(),
	
	React	=(function(){
		
		function handle	(e){
			e=Env.Event.normalize(e);
			After.hold();
			Env.perf(e.type,Date.now(),Execute.u(e.target,e.type));
			After.run();				
			return true;
		}
			
		return	{
			bind	:function(node,alias,value,hilite){//,capture
			
				const	event	= alias||Env.DEFAULT.EVENT,
					donor	= value||node.P,
					rule	= donor.ubind ? donor.ubind(event) : donor[event] || donor.u;
					
				(node.reacts||(node.reacts={}))[event]=rule;
				hilite && Env.Style.attach(node,hilite);
				Env.Event.attach(node,event,handle);
			}
		}
	})(),

	After	= (function(){
		
		function Job(handler,subject,before){
			this.handler=handler;
			this.subject=subject;
		};

		let	phase	= 0; // 0:hold; 1:running; 2:finished
	
		const
		
		queue	= [],
			
		put	=function(job,before){
			if(before)queue.push(job);
			else queue.unshift(job);
			if(phase==2)run(); // afterdone
		},

		run	=function(){
			if(phase==1)return;
			phase=1; // being executed
			for(let job; job=queue.pop();)
				if(job.handler(job.subject))	// true -> suspend execution of the rest of the queue
					return phase=0;		// buffering
			return phase=2; // done
		};
		
		return	{
			hold	: function(){phase=0},
			put	: function(handler,subject,before){ put( new Job(handler,subject),before||false); },
			run	: run
		};

	})()
	
	return	{
		Env,
		Util,
		
		Execute,
		After,
		
		Async	:function(holder){
				const f=holder.resolve;
				holder.resolve=function(value){
					const	p=holder.post;
					holder.post=null;
					return p&&p.resolve(f?f(value):value);
				}
				return	function(value){
					holder.execute(value);
					holder.post = new Execute.Postpone();
				}
			},
		
		Infect	:function(typePrototype,rules){//dap().Inject(String.prototype)
				(rules||"d a u ui e r").split(" ").forEach((a)=>typePrototype[a]=
					function(...x){return Compile.Proto.prototype.$(this)[a](...x)}
				);
			},
			
		fromjs	:(proto,data)=>proto((utag,...stuff)=>new Compile.Proto().$(utag,stuff)).RUN(data)
	}
			
})((function(){ // Environment

	if(!String.prototype.trim)	String.prototype.trim	= function()		{return this.replace(/^\s+/g,"").replace(/\s+$/g,""); };
	if(!Array.prototype.isArray)	Array.prototype.isArray	= function(arr)		{return Object.prototype.toString.call(arr) === "[object Array]"; };
	if(!Array.prototype.indexOf)	Array.prototype.indexOf = function(x,from)	{for(let i=from||0,len=this.length;i<len;i++)if(this[i]==x)return i; return -1; };		
	
	const	doc	= window.document,
		isArray	= Array.prototype.isArray,
		
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
	newElemText=(e,t)=>{const et=newElem(e);et.appendChild(newText(t));return et; },
/*	
	newError=(e,$,P)=>{const n = newElemText("dap-error",e.message); n.$=$; n.P=P; return n; },// n.setAttribute("title",P.rules.d.rulestring);
	newMute	=($,P)	=>{const n = doc.createComment(P.elem?P.elem.nodeName:"*"); n.$=$; n.P=P; return n; },
*/	
	unHTML=newElem("div"),
	
	parseWithExtra=(tag,extra)=>{
		unHTML.innerHTML="<"+tag+" "+extra+"></"+tag+">";
		return unHTML.firstChild;			
	},	
			
	perf	= (info,since)=>console.log("PERF "+(Date.now()-since)+" ms : "+info),
	
	Native	=(str,ui)=>{
		if(!str)return DEFAULT.ELEMENT;
		const	space	= str.indexOf(" "),
			extra	= space<0 ? null : str.substr(space),
			head	= (extra ? str.substr(0,space) : str).split('#'),
			type	= (head.shift()).split("."),
			id	= head.length&&head[0],
			tag	= (type.length&&type[0]==type[0].toUpperCase()) ? type.shift().toLowerCase() : DEFAULT.TAG,
			elem	= extra ? parseWithExtra(tag,extra) : newElem(tag);
		
		if(ui)type.push(ui);
		if(type.length)elem.className = type.join(" ").toLowerCase();
		if(id)elem.id=id;
		return elem;
	};
	
	
	const

	Event	= (function(){
		
		const
		
		stop	= window.Event		? (e)=>{ e.stopPropagation(); e.preventDefault(); return e; }
						: ( )=>{ const e=window.event; e.cancelBubble=true; e.returnValue=false; return e; },
						
		attach	= doc.addEventListener	? (node,event,handler,capture)=>{node.addEventListener(event,handler,capture||false)}:
			  doc.attachEvent	? (node,event,handler)=>{node.attachEvent("on"+event,handler,false)}
						: console.warn("Can't listen to events"),//(node,event,handler)=>{node["on"+event]=handler},
						
		normalize = e=>{ stop(e); return {type:e.type, target:e.currentTarget||e.srcElement} }
				
		return	{ attach, normalize }
	})(),
	
	QueryString = (function(){
		
		const
		
		params =/(?:^|&)([^&=]*)=?([^&]*)/g,
		
		parse	={
			
			pairs	:function(str,tgt){
				if(!tgt)tgt=[];
				str&&str.replace(params,($0,$1,$2)=>{tgt.push({name:$1,value:decodeURIComponent($2)})});
				return tgt;
			},
			hash	:function(str,tgt){
				if(!tgt)tgt={};
				str&&str.replace( params,($0,$1,$2)=>{if($1)tgt[$1]=decodeURIComponent($2)});
				return tgt;
			},
			feed	:function(str,tgt){
				if(!tgt)tgt={values:[],tags:[]};
				str&&str.replace(params,($0,$1,$2)=>{
					tgt.values.push(decodeURIComponent($2));
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
						if(nv.length>1)target[key]=decodeURIComponent(nv[1]);
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
								value = decodeURIComponent(nv.pop()),
								key = nv.length&&nv[0];
							tgt.values.push(value);
							tgt.tags.push(key);//(remap&&remap[key])||
						}
				return tgt;
			},

			neutral	:(hash)=>{
				const arg=[];
				hash.keys().map((k,i)=>{if(k&&hash[k]!=null)arg.push(k+"="+encodeURIComponent(hash[k]))});
				return arg.join('&').replace(/%20/g,'+');
			},
			
			ordered	:(values,tags,emptytoo)=>{
				let uri="";
				for(let i=values.length,v,t;i--;)
					if((v=values[i])||(v===0)||emptytoo)
						uri+=(t=tags[i]) ? "&"+t+"="+ encodeURIComponent(v) : v;
				return uri.replace(/%20/g,'+');
			}
		
		},

		merge	=(...strs)=> strs.reduce(parse.hash,{});

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
		
		MimeHandlers={
			"text/plain"		: request => request.responseText,
			"application/json"	: request => Json.decode(request.responseText),//,request.getResponseHeader("X-Columns")//Dataset.unpack();
			"application/javascript": request => eval(request.responseText),
			"application/xml"	: request => request.responseXML.documentElement
		},
		
		consume	=(request)=>{
			//if(Math.floor(request.status/100)!=2)return;
			const handle=MimeHandlers[request.getResponseHeader('content-type').split(";")[0]];
			return handle ? handle(request) : request;
		},
	
		query	=(req,postpone)=>{//url,body,headers,method,contentType,)
		
			if(typeof req === "string") req={url:req};
		
			const	request	= window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Msxml2.XMLHTTP'),
				method	= req.method || ( req.body ? "POST" : "GET" );
			
			request.open( method,Uri.absolute(req.url),!!postpone );
			request.setRequestHeader("Content-Type",req.contentType);
			
			if(req.headers)
				for(let i in req.headers)
					request.setRequestHeader(i,req.headers[i]);
			
			if(postpone){
				postpone.info=request.url;
				request.onreadystatechange=function (){
					if(this.readyState==4)
						postpone.resolve(consume(this));
				}				
			}
			
			try	{request.send(req.body||null);}
			catch(e){console.warn(e.message);}
			
			return postpone||consume(request);
		};
		
		return { MimeHandlers, query }
	})(),
	
	Request	= (function(){

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
		put	:(data)=>{if(!localStorage)return; for(let key in data)localStorage.setItem(key,JSON.stringify(data[key]));},
		get	:(key)=>{try{JSON.parse(localStorage.getItem(key))}catch(e){return null};}
		},
	
	Style	= {
	
		attach	:(node,cls)=>{Style.mark(node,cls,true)},
		detach	:(node,cls)=>{Style.mark(node,cls,false)},
			
		mark	:(node,cls,on)=>{
				const	classes	= node.className.split(" "),
					found	= classes.findIndex(cls);
				if(found&&!on?classes.splice(found,1):!found&&on?classes.push(cls):null)
					node.className = have.join(" ");
			}
	},
	
	State	= (function(){
		
		var	historian = null,
			href = null, //window.location.href;
			
			refresh=function(){
				if(!historian)return;
				if(decodeURI(href)!=decodeURI(href=window.location.href)){
					var	proto=historian.P,
						instead=historian;
					historian=null;
					Env.inline(proto,instead);
				}
			};
			
			window.addEventListener("hashchange", refresh, false);
			
		function toHashbang(value,tag,node){
			if(!historian)historian=node;
			href=Uri.base+"#!"+value;
			if(decodeURI(href)!=decodeURI(window.location.href))
				window.location.href=href;
		};
			
		function fromUri(){

				const	full	= window.location.href.split(/#!?/),
					query	= full[0].split("?")[1],
					state	= full[1];
					
				if(query && query.indexOf("=")>0)
					window.location.href=Uri.base+"#!"+QueryString.merge(query,state);//QueryString.build.ordered(rewrite.values,rewrite.tags);
				else	
					return QueryString.parse.hash(state);
			};
			
		return	{
			read	: fromUri,
			write	: toHashbang					
		}
			
	})();

	return	{
		
		doc, perf, DEFAULT, REUSE, 
	
		Native, Event, Style, Http, Uri, QueryString, Json, Storage, State,

		console	:window.console,
		
		uievent	:node=>	node.nodeName.toLowerCase()=='input'	?'change':
				node.nodeName.toLowerCase()=='select'	?'change':
				node.isContentEditable	?'blur':
				DEFAULT.EVENT,//'click',
		
		print	:(place,P,alias)=>{place.appendChild(P.$ ? P : P.nodeType ? P.cloneNode(true) : newText(P));},
		clone	:elem=>elem.cloneNode(false),
		
		
		mute	:function(elem){Style.attach(elem,"MUTE"); return elem; },
		dim	:function(elem){Style.attach(elem,"DIM"); return elem; },
		error	:function(elem,e){Style.attach(elem,"ERROR");elem.setAttribute("title",e.message);console.error(e.message)/*throw e*/},
		
		open	:function(url,frame){if(frame)window.open(url,frame);else location.href=url; },
		
		inline	:function(proto,instead){
				if(!instead)instead = document.currentScript||document.script[document.script.length-1]||Fail("can't inline");
				const place = instead.parentNode;
				place.replaceChild( proto.spawn([{'':State.read()}],place) || newStub("dap"), instead );
			},
			
		NS	:(name)=>Compile.Namespace(name),
			
		Monads	:{
			
			convert	:{ log, Json, 
				
				value	: node=>(node.value||node.textContent||node.innerText||"").trim(),
				text	: node=>(node.innerText||node.textContent||node.value||"").trim(),
				
				copy	: item=>isArray(item)?item.slice(0):Object.assign({},item),
				script	: url=>Util.merge(newElem("script"),{src:"url",async:true,onload:()=>{doc.body.appendChild(el)}}),
				
				sync	: req=> Http.query(req,null),
				query	: req=> dap.Async(req=>Http.query(req,true)), // to be generalized
			},
			
			flatten:	{
				uri	: QueryString.build.ordered, // function(values,tags)	{ return Uri.encode( values,tags ); },
				post	: (values,tags)	=> Request.post( values.pop(),values,tags ),
				upload	: (values,tags)	=> Request.blob( values.pop(),values[0],tags[0] ),
				
				exec	: (path,values)=>{
						let tgt=Util.reach(path.split("."),window);
						if(tgt&&tgt.apply)return tgt.apply(null,values);
					},
					
				here	: (values,tags)=>tags.reduce((str,tag,i)=>str.split('{'+tag+'}').join(values[i]),values.pop()),
		
				//"uri*"	: Env.Uri.full
			},
			
			operate	:{
				title	:(text)			=>{ doc.title=text; },
				log	:(value,alias)		=>{ log(alias+" : "+value); },
				mark	:(value,alias,node)	=>{ Style.mark(node,alias,!!value); },
				
				attr	:(value,alias,node)	=>{ value ? node.setAttribute(alias,value) : node.removeAttribute(alias) }, //... 
			}
		}
	}		
		
})()
);

dap.Infect(String.prototype);
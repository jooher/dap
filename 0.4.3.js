// 0.4.3

function Check(value){
	return value;
}

const	dap=(function( Env ){

	"use strict";
	
	if(!String.prototype.trim)	String.prototype.trim	= function()		{return this.replace(/^\s+/g,"").replace(/\s+$/g,""); };
	if(!String.prototype.tuck)	String.prototype.tuck	= function(alias,value)	{return this.split('{'+alias+'}').join(value); };
	if(!String.prototype.stub)	String.prototype.stub	= function(map)		{var result=this; for(let k in map)result=result.split(k).join(map[k]); return result; }
	if(!Array.prototype.isArray)	Array.prototype.isArray	= function(arr)		{return Object.prototype.toString.call(arr) === "[object Array]"; };
	if(!Array.prototype.indexOf)	Array.prototype.indexOf = function(x,from)	{for(let i=from||0,len=this.length;i<len;i++)if(this[i]==x)return i; return -1; };		

	
	const

	Perf	= (text,since)=>console.log("PERF "+(Date.now()-since)+" ms : "+text),
	Log	= console.log,
	Warn	= reason=>console.warn("dap warn: "+reason),
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
		
		sync	:req=>Env.query(null,req),
		query	:req=>Env.query(new Execute.Postpone(),req),
		
		json	:Env.Json.decode,
		value	:Env.value,
		text	:Env.text,
		copy	:Env.copy,		
	},
	
	flatten	:{
	
		""	:Util.hash,
		"?"	:(values)=>{ for(let i=values.length;i--;)if(values[i])return values[i]; },			/// any - first non-empty //return false; 
		"!"	:(values)=>{ for(let i=values.length;i--;)if(!values[i])return false; return values[0]; },	/// all - succeeds if empty token found
		
		eq	:(values)=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return false;return true; },
		ne	:(values)=>{ const a=values.pop(); for(let i=values.length;i--;)if(values[i]!=a)return true;return false; },
		asc	:(values)=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a>(a=parseFloat(values[i])))return false;return true; },
		dsc	:(values)=>{ for(let a=parseFloat(values.pop()),i=values.length;i--;)if(a<(a=parseFloat(values[i])))return false;return true; },
				
		"case"	:(values,tags)=>{ const match=values.pop(); for(let i=values.length; i--;)if(tags[i]==match)return values[i]; },

		join	:(values)=>values.reverse().join(values.shift()),
		concat	:(values)=>values.reverse().join(""),
		space	:(values)=>values.reverse().join(" ").replace(/\s\s+/g," ").trim(),
						
		alert	:(values)	=>{ for(let i=values.length;i--;)Env.alert(values[i]); },
		confirm	:(values,tags)	=>{ for(let i=values.length;i--;)if(Env.confirm(values[i]))return tags[i]||true; },
		
		uri	: Env.Uri.ordered, // function(values,tags)	{ return Uri.encode( values,tags ); },
		"uri*"	: Env.Uri.full,
		
		post	: (values,tags)	=> Env.Request.post( values.pop(),values,tags ),
		upload	: (values,tags)	=> Env.Request.blob( values.pop(),values[0],tags[0] )
		
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
		
		"log"	:(value,alias,node)=>	{ Env.log(alias+" : "+value); },	
		
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
		

	
	Util	= (function(){
	
		function splitDeep(str,val){
			if(Array.prototype.isArray(val))
				for(let i=val.length;i--;)
					val[i]=splitDeep(val[i],separator);
			else if(value&&value.split)
				value=value.split(separator);
			return value;
		};
		
		return	{
		
			unescape: decodeURI,
			splitDeep: splitDeep,
			
			hash:	(values,tags)=>{
				const hash={};
				for(let a,i=values.length;i--;)
					if(a=tags[i])hash[a]=values[i];
					else for(let j in a=values[i])hash[j]=a[j];
				return hash;
			},
			
			multi	:{
			
				replace:(regs,value)=>{/// multiple regex replaces
					if(value)for(let i=regs.length;i--;)
						value=value.replace(regs[i][0],regs[i][1]);
					return value;
				}
			},
			
			multiRegex:(arr,modifiers)=>{
				for(let i=arr.length;i--;)arr[i]="(?:"+arr[i].source+")";
				return new RegExp(arr.join("|"),modifiers);
			},
	
			 indepth:(alias,value,todo,target)=>{
				if(value!=null)
					if(typeof value != 'object')target=todo(alias,value,target);
					else for(let i in value)if(i)target=indepth(i,value[i],todo,target);
				return target;
			}
		
		}
	
	})(),

	Parse	= (function(){
	
		function Brancher( cleanup, brackets ){
			this.cleanup	= cleanup;
			this.brackets	= brackets;
		};
		Brancher.prototype = (function(){ //alert("Brancher.prototype");
		
			const	replace	= Util.multi.replace,
				extract	= function( str, brackets ){
					const	branchStack=[],
						stub=(match,inner)=> "<"+branchStack.push(inner.trim())+">";
					while(str!=(str=str.replace( brackets, stub )));
					branchStack.unshift(str.trim());
					return branchStack;
				};			
			
			return	{
				Parse	:function(str){return extract( replace(this.cleanup,str), this.brackets)}
			}
			
		})();
		return	{
			Brancher: Brancher
//			Tree	: Tree
		};
		
	})(),
	
	Monads	= Canonical(),
	
	Compile	= (function(){
		
		const
			
		makePath= str=>str.split(".").reverse(), //str&&
		append	=(obj,key,value)=>(obj[key]=obj[key]&&(value.charAt(0)===';')?obj[key]+value:value), /// ???
		
		
		Namespace = (function(){

			function Ns(uri,ready){
				
				Log("New namespace: "+uri);
				
				this.uri	= uri;
				this.monads	= Monads;
				this.dict	= {};
				this.refs	= {};
				
				this.inherit	= stdns;
				this.ready	= ready;
			}
			Ns.prototype=(function(){
			
				function require(ns){
					if(!ns.ready){
					
						var	loaded	= Env.Http.GET(false,null,"text/plain",ns.uri) // application/javascript
								||Fail("Cannot load namespace "+ns.uri);
						ns.fromNode( loaded );
						ns.ready=true;
					}
					return ns.dict;
				};
				
				return	{
					
					Inherit	:function(ns){
							this.inherit=ns;
							return this;
						},
						
					Refs	:function(refs){
							for( var a = refs.trim().replace(/\s*::\s*/g,"::").split(/\s+/), i=a.length; i--; ){
								var	ref	= a[i].split("::"),
									alias	= ref[0],
									path	= ref[1],
									imported= Env.Uri.absolute(path,this.uri);
								
								if(this.refs[alias]!=null)Fail("Duplicate ref in "+this.uri+" for "+alias+" : "+imported, this);
								this.refs[alias] = imported;
							}
							return this;
						},

					Monads	:function(monads){
							this.monads=monads;
							return this;
						},
						
					Dict	:function(dict){
							for(let i in dict){
								var p=(this.dict[i]=dict[i]);
								if(p instanceof Proto)p.ns=this;
							}
							return this;
						},

					poke	:function(path,value){
							var	entry=this.dict,
								i=path.length,
								key;
							while(--i)
								entry=entry[key=path[i]]||(entry[key]={});
							return entry[path[0]]=value;
						},
						
					lookup	:function(domain,path,key){
						
							require(this);
							
							if(!key)
								key= path.pop();
							
							var	d	= domain?this.monads[domain]:this.dict,
								xtrn	= this.refs[key],
								entry	= xtrn
									? Namespace(xtrn).lookup(domain,path.length&&path)
									: d&&d[key] || this.inherit&&this.inherit.lookup(domain,path,key);
							
							if(entry instanceof Ns)
								entry = this.dict[key] = require(entry);
							
							return entry;
						},						
						
					reach	:function(path,domain){					
							var entry=this.lookup(domain,path) || domain&&Fail( domain+" not found: "+path, this );
							while( entry && path.length ) entry = entry[path.pop()];	
							return entry;
						},						
									
					}
			})();
			
			var	registry={},
				stdns	= new Ns("http://dapmx.org/",true).Monads(Monads);
			
			return function(ref,base,ready){
				var uri = Env.Uri.absolute(ref,base);
				return registry[uri] || (registry[uri]=new Ns(uri,ready));
			}
			
		})();
	
		function Proto(ns,utag){
			this.ns		= ns||STD.rootns;
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
			
			USE	:function(libs){
					return this;
				},
				
			NS	:function(uri)	{ return Namespace(uri) && this },//Uri.absolute()
			
			DEF	:function(dict){
					this.ns.Dict(dict);//=Namespace(dict.URI);
					return this;
				},
				
			EXT	:function(monads){
					this.ns.Monads(monads);
					return this;
				},
				
			set	:function(key,stuff,react){
					var p = this.tgt || new Proto(this.ns,this.utag).$$();
					if(stuff[0].replace)	append(p.attrs,key,stuff.shift());
					if(stuff)		append(p.stuff,key,stuff);
					if(react)		p.react.push(key);
					return p;
				},
				
				
			FOR	:function(stub){
					this.utag=this.utag.stub(stub);
					for(let a in this.attrs)this.attrs[a]=this.attrs[a].stub(stub);
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
						this.elem=Env.Native(this.utag,this.rules[""]&&".ui");
					
					if(!this.elem && d && (d.defs||d.refs))
						Fail("Entry must be an element",this);
				}
				return this.rules;
			},
			
			spawn	:function($,place,instead){
				var	rules	= this.rules||this.prepare(),
					d	= rules.d,
					a	= rules.a,
					node	= Env.clone( this.elem, !d ? null : !d.defs ? $ : [{'':$[0]['']},$,$[2]], this),
					react	= this.react;
					
				if(react)
					for(let i=react.length; i-->0;){
						if(!react[i])rules[react[i]=Env.uievent(node)]=rules[""];
						React.bind(node,react[i]);
					}
/**/					
				new Execute.Branch(node.$,node).exec(d.todo||d.engage().todo,place,instead);
				
				if(a)a.todo||a.engage();
				
				return node;
			},
			
			ubind	:function(key){
				this.prepare();
				return this.rules[key]||this.rules.u;//||Fail("No rule for "+key);
			},
			
			run	:function(data){Env.inline(this,data)}
			
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
		
			const	BRANCHER = new Parse.Brancher(
					[
						[Util.multiRegex([		
							/^[;\s]+/,		// leading semicolons
							/[;\s]+$/,		// trailing semicolons
							/\/\*.*?\*\//,		// C-style /* inline comments */
							/[;\s]*\/\/\*.*$/,	// comments to end of line //*
							/\s+(?==)/		// whitespace in front of assignment sign
							],"g"), ""],
						[/\s\s+/g, " "]			// shrink spaces
					],
					/[({[][;\s]*([^(){}\[\]]*?)[;\s]*[\]})]/g
				),
				
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
						inherit	= context.ns.reach( makePath(donor[0]) ) || Fail( "Can't find "+donor[0] ),
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
					operate	= a&&(a=a[0]) ? context.ns.reach(makePath(a),MONADS.OPERATE) : null;
			
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
						literal	= (a=a.split("`")).length>2 ? Util.unescape(a[2]) : a.length>1 ? a[1] : null,
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
				const	flatten	= a[1]	? context.ns.reach(makePath(a[1]),MONADS.FLATTEN) : Util.hash,
					tokens	= a[0] && context.branchStack[a[0]].split(TOKENS);
					
				return	tokens ? makeTokens( context, tokens, flatten ) : Feed.prototype.EMPTY;
			}
			
			function makeConverts(context,str){
				const vector = str.split(",").reverse();
				for(let i=vector.length,c; i--;)
					if('function' != typeof (vector[i]=context.ns.reach(makePath(c=vector[i]),MONADS.CONVERT)||Fail("converter not found "+vector[i],context)))
						Fail('convert '+c+' is not a function');
				return vector;
			}
			
			/*
			function makeChildStep(ns,stuff){
				if(!stuff)return null;
				for(let i=stuff.length; i--; )
					if(stuff[i] instanceof Proto)
						stuff[i].into(ns);
				return new Step( new Feed(stuff.reverse(),REUSE.DUMMY,REUSE.DUMMY,Print));
			}
			*/
									
			return {
				
				EMPTY	: new Rule(),
		
				engage	: function(){
						var	epilog	= this.stuff && new Step( new Feed(this.stuff.reverse(),REUSE.DUMMY,REUSE.DUMMY,Print));//makeChildStep(this.ns,this.stuff);
				
						if(this.rulestring){
							var context=new Context(this.ns,BRANCHER.Parse(this.rulestring));
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
				
		return	{
			Namespace : Namespace,
			
			Proto	: Proto,
			Rule	: Rule,
			Step	: Step,
			Feed	: Feed,
			Token	: Token,
			Rvalue	: Rvalue
		}
		
	})(),
	
	Execute	= (function(){
	
		const	REUSE	= Env.REUSE,
			ctx	=(data,$,rowset,updata)=>{
				const datarow = data instanceof Object ? data : {"#":data}
				datarow['']=updata;
				return [{'':datarow},$,rowset];
			},			
			update	=(node,$)=>{ node.P.spawn($||node.$,node.parentNode,node) },
			trace	=($,entry)=>$ && ( $[0][entry]==null ? $[0][entry]=trace($[1],entry) : $[0][entry] )
			;
			
		let	stackDepth	= 0;

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
				const	branch	= todo && this.execBranch(todo);
					
				if(branch instanceof Postpone){
					branch.locate(place,instead);
					return branch.put({branch:this});
				}
				
				let	node	= this.node,
					empty	= branch && !node.childNodes.length;// && !node.attributes.length;
					
				if(empty==true)node=Env.mute(node);
				if((empty==null)&&instead)Env.dim(instead);
				else if(place)
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
						let branch = new Branch($,node,this.up).execBranch(step.todo); // node.$ ?
						if(branch instanceof Postpone)
							return branch.put({todo:[new Compile.Step(null,postpone.todo),todo[1]]})
					}else					
						if(!step.feed)
							Warn("no feed");
					
						var	feed	= step.feed,
							operate	= feed.op,
							tokens	= feed.tokens,
							values	= feed.values,
							tags	= feed.tags,

							i	= values.length;//tokens.length;
							
						flow	= null;
							
						if(operate){
							while(i-- && !flow){
								flow = operate(this.execToken(values[i],tokens[i]),tags[i],node,$);
								// null		- keep on
								// false	- next operand, but not next step
								// true		- skip to next step
								// array	- rowset subscopes
								// ? object	- subscope
								if(flow instanceof Postpone){
									//if(--stackDepth<0)throw Fail("stack underflow");
									tokens	= tokens.slice(0,i);// no need to slice values and tags
									tokens[i] = flow.token;
									return flow.put({todo:[
										new Compile.Step(
											values && new Compile.Feed(values,tags,tokens,operate),
											flow.todo
										),todo[1]
									]});
								}
							}
								
							if(flow)
								if(isArray(flow)){
									var	updata = $[0][''];
									for(let r=0,rows=flow.length; r<rows; r++)//if(flow[r]!=null)
										empty	= new Branch(ctx(flow[r],$,flow,updata),node,this.up).exec(todo[1]) && empty;

								}else
									flow	= null;
						}else
							while(i--)this.execToken(values[i],tokens[i]);
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
							proto	= value||literal,
							i	= values.length; //tokens.length;
							
							while(i--){
								value=this.execToken(values[i],tokens[i]);
								if(value instanceof Postpone){
									tokens = tokens.slice(0,i);
									tokens[i]=postpone.token;
									
									feed = values.length && new Compile.Feed(values,tags,tokens,feed.op);
									
									parts = parts.slice(0,p);
									parts[p] = new Compile.Rvalue(feed,path);
									
									return value.put({token:new Compile.Token(parts,converts)});
								}
								values[i]=value;
							}
						
						value = feed.op(values,tags);
						
						if(proto){
							value['']=this.$[0][''];
							Print(this.node,proto,[{'':value},this.$,this.$[2]]);
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
							if(value instanceof Postpone){
								converts= converts.slice(0,p);
								converts[p]=c>0 && convert.slice(0,c);
								
								parts	= parts.slice(0,p);
								parts[p]= REUSE.STUB; // no Rvalue
								
								token	= new Compile.Token(parts,converts);
								
								return value.put({token,target:token})
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
					route=this.execBranch(todo||rule.todo||rule.engage().todo)||route;
				
				if(route instanceof Postpone)
					return route.put({branch:this,instead:snitch});
					
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
			this.info	=info;
		};
		Postpone.prototype = {
			locate	:function(place,instead){
					if(this.instead=instead){
						this.place=place;
						if(instead.replacer)instead.replacer.dismiss();
						instead.replacer=this;
					}
				},
			put	:function(obj){
					for(let i in obj)this[i]=obj[i];
					return this;
				},
				
			dismiss	:function(){
					this.branch=null;
				},
			resolve	:function(value){
					if(this.branch){
						Perf("wait: "+this.info,this.time);
						this.target.value=value;
						After.hold();
						Perf("exec: "+this.info,Date.now(),
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
			
			Branch,
			Postpone,
			update,

			async	: true
		};

	})(),
	
	React	=(function(){
		
		function Handle(e){
			Env.Event.stop(e);
			After.hold();
			Perf(e.type,Date.now(),Execute.u(e.currentTarget||e.srcElement,e.type));
			After.run();				
			return true;
		}
			
		return	{
			bind	:function(node,alias,value,hilite,capture){
			
				var	event	= alias||Env.DEFAULT.EVENT,
					donor	= value||node.P,
					rule	= donor.ubind ? donor.ubind(event) : donor[event] || donor.u;
					
				(node.reacts||(node.reacts={}))[event]=rule;
				Env.Event.attach(node,event,Handle,hilite);
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
			
		put	=(job,before)=>{
			if(before)queue.push(job);
			else queue.unshift(job);
			if(phase==2)run(); // afterdone
		},

		run	=()=>{
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

	})(),
		

	STD	= {
		Env,
		Util,
		
		Parse,
		Execute,
		After,
		
		async	:function(holder){
				const f=holder.resolve;
				holder.resolve=function(value){
					const	p=holder.post;
					holder.post=null;
					return p&&p.resolve(f?f(value):value);
				}
				return	function(value){
					holder.execute(value);
					throw holder.post = new Execute.Postpone();
				}
			},
		
		rootns	:Compile.Namespace(null,null,true).Monads(Monads),//Uri.absolute()
		
		Infect	:function(typePrototype,rules){//dap().Inject(String.prototype)
				(rules||"d a u ui e r").split(" ").forEach((a)=>typePrototype[a]=
					function(...x){return Compile.Proto.prototype.$(this)[a](...x)}
				);
			}
	}
			
	return function(proto,data){
		if(!proto)return STD;
		if(proto instanceof Function)proto=proto((utag,...stuff)=>new Compile.Proto().$(utag,stuff));
		if(proto instanceof Compile.Proto)Env.inline(proto,data);
	}
	
})(

	Env	= (function(){
	
		const	isIE	= false,
			doc	= window.document,
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
		newElem	=	e=> doc.createElement(e),//try{}catch(er){alert("newElem fail:"+e)}
		newText	=	t=> doc.createTextNode(t),
		newElemText=(e,t)=>{const et=newElem(e);et.appendChild(newText(t));return et; },
		
		newError=(e,$,P)=>{const n = newElemText("dap-error",e.message); n.$=$; n.P=P; return n; },// n.setAttribute("title",P.rules.d.rulestring);
		newMute	=($,P)	=>{const n = doc.createComment(P.elem?P.elem.nodeName:"*"); n.$=$; n.P=P; return n; };
				

		function NativeElement(uniform,extra,id){ // create a native (HTML) node from dap uniform notation
			
			if(!uniform&&!extra)return DEFAULT.ELEMENT;
			
			if(!uniform||uniform[0]!=uniform[0].toUpperCase())uniform.unshift(DEFAULT.TAG);	// class	-> DIV.class
			var	tag	= uniform.shift().toLowerCase(), // does xhtml really care about case?
				elem	= extra ? parseWithExtra(tag,extra) : newElem(tag||DEFAULT.TAG); 
			if(uniform.length)elem.className = uniform.join(" ").toLowerCase();
			if(id)elem.id=id;
			return elem;
		}
		
		function Native(str,ui){
			if(!str)return DEFAULT.ELEMENT;
			var	space	= str.indexOf(" "),
				extra	= space<0 ? null : str.substr(space),
				head	= (extra ? str.substr(0,space) : str).split('#'),
				uniform	= head.shift(),
				id	= head.length&&head[0]
				;
			if(ui)uniform+=ui;
			return NativeElement(uniform&&uniform.split("."),extra,id); // like, FORM#id METHOD="POST"
		}
		
		function parseWithExtra(tag,extra){
			var tmp=newElem("div");
			tmp.innerHTML="<"+tag+" "+extra+"></"+tag+">";
			return tmp.firstChild;			
		}
		
		const

		Event	= (function(){
			
			var
			
			listen	= doc.addEventListener	? function(node,event,handler,capture){node.addEventListener(event,handler,capture||false)}:
				  doc.attachEvent	? function(node,event,handler){node.attachEvent("on"+event,handler,false)}
							: function(node,event,handler){node["on"+event]=handler},
							
			stop	= window.Event		? function(e){ e.stopPropagation(); e.preventDefault(); return e; }
							: function(){ e=window.event; e.cancelBubble=true; e.returnValue=false; return e; }
			;
			
			return	{
				stop	: stop,
				attach	: (node,event,handler,hilite)=>{if(hilite)Style.attach(node,hilite);listen(node,event,handler);},
				fire	: (function(){
					
					var createEvent = document.createEvent
						? function(signal){var e = document.createEvent('Event'); e.initEvent(signal, true, true); return e}
						: function(signal){return new window.Event(signal)};
						
					return	document.dispatchEvent ? function(signal){document.dispatchEvent(createEvent(signal))} :
						document.fireEvent ? function(signal){
							var e=
							document.fireEvent(signal);
						} :
						function(signal){Warn("Failed to fire event: "+signal)}
				})()
			}
		})(),

		Uri	= (function(){
		
			var
			
			parse	=(function(regx){ // based on code from http://blog.stevenlevithan.com/archives/parseuri
				
				var keys = ["source","origin","protocol","authority","userinfo","username","password","host","hostname","port","relative","path","directory","file","query","anchor"];
					
				return function(str){
					var uri = {};
					for(let m=regx.exec(str), i=keys.length; i--;)
						uri[keys[i]] = m[i] || "";
					return uri;
				}
			})(/^(([^:\/?#]+:)?\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?(([^:\/?#]*)(?::(\d*))?))?)((((?:[^?#\/]*\/)*)([^?#]*))(\?[^#]*)?(#.*)?)/);
			
			
			function hash(qstr,target){
				if(!target)target={};
				if(qstr)
					for(let tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i--;){
						var	nv = tups[i].split('='),
							key = nv[0]; //(remap&&remap[key])||
						if(nv.length>1)target[key]=decodeURIComponent(nv[1]);
						else target['!']=key;
					}
				return target;
			};
			
			function feed(qstr,tgt){
			
				if(!tgt)tgt={values:[],tags:[]};

				if(qstr)
					for(let tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i--;)
						if(tups[i]){
							var	nv = tups[i].split('='),
								value = decodeURIComponent(nv.pop()),
								key = nv.length&&nv[0];
							tgt.values.push(value);
							tgt.tags.push(key);//(remap&&remap[key])||
						}
				return tgt;
			};
			
			
			
			function neutral(hash){
				var arg=[],v;
				for(let i in hash)
					if((v=hash[i])||(v===0))
						arg.push(i+"="+encodeURIComponent(v));
				return arg.join('&').replace(/%20/g,'+');
			};
			
			function ordered(values,tags,emptytoo){
				var uri="";
				for(let i=values.length,v,t;i--;)
					if((v=values[i])||(v===0)||emptytoo)
						uri+=(t=tags[i]) ? "&"+t+"="+ encodeURIComponent(v) : v;
				return uri.replace(/%20/g,'+');
			};
			
			
			return	{
				parse	:parse,
			
				neutral	:neutral,
				ordered	:ordered,
				full	:function(values,tags){return ordered(values,tags,true)},
				
				feed	:feed,
				hash	:hash,
				
				query	:(function(regx){
					
					return	{
						pairs	:function(str,tgt){
							if(!tgt)tgt=[];
							str.replace(regx,function($0,$1,$2){
								tgt.push([$1,decodeURIComponent($2)]);
							})
							return tgt;
						},
						hash	:function(str,tgt){
							if(!tgt)tgt={};
							str.replace( regx, function($0,$1,$2){ 
								if($1)tgt[$1]=decodeURIComponent($2);
							});
							return tgt;
						},
						feed	:function(str,tgt){
							if(!tgt)tgt={values:[],tags:[]};
							str.replace(regx,function($0,$1,$2){
								tgt.values.push(decodeURIComponent($2));
								tgt.tags.push($1);
							})
							return tgt;
						}
					}
				})(/(?:^|&)([^&=]*)=?([^&]*)/g),
				
				absolute:	/// evaluate absolute URL from relative to base URL
				function(href,from){
					
					if(!from)from=Env.base;
					if(!href)return from;
					if(/^\w*:\/\//.test(href))return href;
									
					var	uri	= parse(from);
					
					switch(href.charAt(0)){
						case'*': return base;
						case'/': return uri.origin+href;
						case'?': return uri.origin+uri.path+href;
						case'#': return uri.origin+uri.path+uri.query+href;
						case'.': 
							var up = href.match(/\.\.\//g);
							if(up){
								uri.directory=uri.directory.split("/").slice(0,-up.length).join('/');
								href=href.substr(up.length*3);
							};
					}
					return uri.origin+uri.directory+href;
				}
			}

		})(),
		
		Http	= (function(){

			function consume(request){
				if(Math.floor(request.status/100)!=2)return;
				switch(request.getResponseHeader('content-type').split(";")[0]){
					case"text/plain":
						return request.responseText;
					case"application/json":
						return Json.decode(request.responseText);//Dataset.unpack(,request.getResponseHeader("X-Columns"));
					case"application/xml":
						return request.responseXML.documentElement;
					default:
						return request;
				}
			};
			
			function query( postpone,req ){//url,body,headers,method,contentType,)
			
				if(typeof req === "string") req={url:req};
			
				const	request	= window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Msxml2.XMLHTTP'),
					method	= req.method || ( req.body ? "POST" : "GET" );
				
				request.open( method,Uri.absolute(req.url),!!postpone );
				request.setRequestHeader("Content-Type",req.contentType);
				
				if(req.headers)
					for(let i in req.headers)
						request.setRequestHeader(i,req.headers[i]);
				
				if(postpone)
					request.onreadystatechange=function (){
						if(this.readyState!=4)return postpone
							? postpone.resolve(consume(this))
							: Warn("No target for request",this);
					}
				
				try	{request.send(req.body||null);}
				catch(e){Warn(e.message);}
				
				return postpone||consume(request);
			};
			
			return {
				query
			}
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
								? "&"+t+"="+ encodeURIComponent( typeof v=="object" ? Json(v) : v ) 
								: Json(v);
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
			encode	:value	=>{var r=0; return value&&JSON.stringify(value,(k,v)=>(k||!r++)?v:undefined)},
			decode	:value	=>value&&JSON.parse(value)
			},

		Storage	={
			put	:function(data)	{if(!localStorage)return; for(let key in data)localStorage.setItem(key,JSON.stringify(data[key]));},
			get	:function(key)	{try{JSON.parse(localStorage.getItem(key))}catch(e){return null};}
			},


		
		Style	= {
		
			
			attach	:function(node,cls){Style.mark(node,cls,true)},
			detach	:function(node,cls){Style.mark(node,cls,false)},
				
			mark	:function(node,cls,on){
					var	c	= " "+node.className+" ",
						was	= c.indexOf(" "+cls+" ")>-1; //styled(c,cls);
					if(on)	{if(!was) node.className = (c+cls).trim();}
					else	{if(was ) node.className = c.replace(new RegExp("\\s+"+cls+"\\s+","g")," ").trim();}
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

					var	full	= window.location.href.split(/#!?/),
						query	= full[0].split("?")[1],
						state	= full[1],
						rewrite	= query && query.indexOf("=")>0 && Uri.feed(query,Uri.feed(state));
						
					if(rewrite)
						window.location.href=Uri.base+"#!"+Uri.ordered(rewrite.values,rewrite.tags);
					else	
						return Uri.hash(state);
				};
				
			return	{
				read	: fromUri,
				write	: toHashbang					
			}
				
		})();

		return	{
			
			DEFAULT,
			REUSE,
		
			State,
			Uri,
			Http,
			Event,
			Style,
			Native,
			Json,
			Storage,
			
			base	: window.location.href.replace(/[?!#].*$/,""), // const
			
			query	:Http.query, // to be generalized
			
			
			print	:(place,P,alias)=>{place.appendChild(P.$ ? P : P.nodeType ? P.cloneNode(true) : newText(P));},
			
			log	:log,
			attr	:function(value,alias,node){ if(value)node.setAttribute(alias,value); else node.removeAttribute(alias); }, //... 
			mark	:function(value,alias,node){ Style.mark(node,alias,!!value); },
			mute	:function(elem){Style.attach(elem,"MUTE"); return elem; },
			dim	:function(elem){Style.attach(elem,"DIM"); return elem; },
			error	:function(elem,e){Style.attach(elem,"ERROR");elem.setAttribute("title",e.message);Warn(e.message)/*throw e*/},
			
			exec	:function(path,values){
					var tgt=window;
					for(let i=path.length;i--;)if(!(tgt=tgt[path[i]]))return;
					if(tgt.apply)return tgt.apply(null,values);
				},
			
			clone	:function(elem,$,P){var n=elem.cloneNode(false); n.$=$; n.P=P; return n; },
			
			value	:node=>(node.value||node.textContent||node.innerText||"").trim(),
			text	:node=>(node.innerText||node.textContent||node.value||"").trim(),
			copy	:item=>isArray(item)?item.slice(0):Object.assign({},item),
			
			uievent	:function(node){
					return	node.nodeName.toLowerCase()=='input'	?'change':
						node.nodeName.toLowerCase()=='select'	?'change':
						node.isContentEditable	?'blur':
						'click';
				},

			doc	:doc,
			title	:function(text){return doc.title=text; },
			open	:function(url,frame){if(frame)window.open(url,frame);else location.href=url; },
			
			script	:function(url){
					var el=newElem("script");
					el.src="url";
					el.async=true;
					el.onload=function(){doc.body.appendChild(el);};
					return el;
				},
					
			inline	:function(proto,instead){
					if(!instead)instead = document.currentScript||document.script[document.script.length-1]||Fail("can't inline");
					var place = instead.parentNode;
					place.replaceChild( proto.spawn([{'':State.read()}],place) || newStub("dap"), instead );
				},				
				
				
			output	:{
					element	:(str)=>Native(str),
					value	:(element,str)=>element+=' '+str,
					
					print	:(element)=>lines.push(element),
					execute	:()=>lines.join('\n')
				}
	
				
			
			}						
		})()
);
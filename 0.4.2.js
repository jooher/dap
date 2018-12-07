// 0.4.2

var DAP_ERRORS=[];	// dap errors are logged into this array

function
Check(value){
	return value;
}

var dap	=(function(){

	"use strict";

	function
	Hint(reason,subj){
		this.reason	= reason;
		this.subj	= subj;
		DAP_ERRORS.push(this);
	};
	
	function
	Warn(reason,subj){		// small errors will log into DAP_ERRORS
		Env.log("WARN "+reason);
	};
	
	function
	Fail(reason,subj){		// severe errors will terminate(?) execution
		Env.log("FAIL "+reason,subj);
		Env.title("DAP ERRORS: "+DAP_ERRORS.length);
		throw new Error("dap:<"+reason+">");
	};
	
	function
	Perf(text,since){
		Env.log("PERF "+(Date.now()-since)+" ms : "+text);
	};
	
	
	if(!String.prototype.trim)	String.prototype.trim	= function()		{return this.replace(/^\s+/g,"").replace(/\s+$/g,""); };
	if(!String.prototype.tuck)	String.prototype.tuck	= function(alias,value)	{return this.split('{'+alias+'}').join(value); };
	if(!String.prototype.stub)	String.prototype.stub	= function(map)		{var result=this; for(var k in map)result=result.split(k).join(map[k]); return result; }
	if(!Array.prototype.isArray)	Array.prototype.isArray	= function(arr)		{return Object.prototype.toString.call(arr) === "[object Array]"; };
	if(!Array.prototype.indexOf)	Array.prototype.indexOf = function(x,from)	{for(var i=from||0,len=this.length;i<len;i++)if(this[i]==x)return i; return -1; };		

	function Canonical(){
	return	{

	convert	:{
	
		""	:function(){return null},
		"check"	:Check,
		log	:function(value){Env.log(value); return value},
	
		"?"	:function(bool){return bool?true:false},	/// test
		"!"	:function(bool){return bool?false:true},	/// test inverse
		"#"	:function(bool){return bool?"+":"-"},		/// test as +/-
		
		"+?"	:function(num){return parseFloat(num)>0},	/// test positive
		"-?"	:function(num){return parseFloat(num)<0},	/// test negative
		"0?"	:function(num){return parseFloat(num)===0},	/// test zero
		"!0"	:function(num){return parseFloat(num)?num:""},	/// non-zero only
		"??"	:function(arr){return arr&&arr.length},
		
		"+"	:function(num){return (num=parseFloat(num))?Math.abs(num):0; },		/// abs
		"-"	:function(num){return (num=parseFloat(num))?(-num):0; },		/// neg
		"~"	:function(num){return (num=parseFloat(num))?(num>0?"+":"-"):0; },	/// sgn
		
		"++"	:function(num){return ++num},
		
		QUERY	:function(req){return Request.http(req,true)},
		SYNC	:function(req){return Request.http(req,false)},
		
/*		GET	:(req)=>Request.http(req,true,"GET"),
		PUT	:(req)=>Request.http(req,true,"PUT"),
		POST	:(req)=>Request.http(req,true,"POST"),
*/		
		location:function(req){return window.location.href},

		xml	:Parse.Xml,
		value	:Env.value,
		text	:Env.text,
		copy	:Env.copy,
		
		
		prompt	:function(obj)	{return prompt(spacebreak(obj.prompt||''),obj.value||'')},
		confirm	:function(str)	{return confirm(spacebreak(str))&&str},
		alert	:function(str)	{alert(spacebreak(str)); return str},
		
	
		split	:{
				space	:function(value){ return split(value,/\s+/); },
				comma	:function(value){ return split(value,/\s*,\s*/); },
				colon	:function(value){ return split(value,/\s*:\s*/); },
				para	:function(value){ return split(value,/\n\n+/); },
				lfc	:function(value){ return split(split(value,/\s*\n\s*/),/(?:\s+|^):\s?/); },
				
				urlenc	:Uri.query
			},
		
		json	:Env.JSON,
		storage	:Env.Storage,
		title	:Env.title,
		
		cols	:function(value) {return Dataset.mapGrid(value[0],value.slice(1));},
			
		format	:{
			upper	:function(value){ return value.toUpperCase(); },
			lower	:function(value){ return value.toLowerCase(); },
			para	:function(value){ return value&&value.replace(/\s\s/g,"\n"); },
	
			num	:function(value){ return String(value).replace(/[^-.0-9]+/g,"").replace(/\B(?=(...)*$)/g," "); },	/// digit groups 
			"~num"	:function(value){ return value.replace(/[^-.0-9]+/g,""); }
		},
		
		// some costants
		
		tab	:function(){ return '\t'; },
		newline	:function(){ return '\n'; },
		para	:function(){ return "\n\n"; }
	},
	
	flatten	:{
	
		""	:Util.hash,
		"%"	:(function(){
				function tuck(alias,value,template){ return template.tuck?template.tuck(alias,value):template; }
			
				return function(values,tags)	{
					var a=values.pop();
					if(!a)return a;
					for(var i=values.length,tag,value;i--;)
						if((value=values[i])!=null)
							if( tag=tags[i])
								a = (tag!='*') ?
								a.tuck(tag,value) :
								indepth(tag,value,tuck,a);
							else for(var j in value)
								a=a.tuck(j,value[j]);
					return a.replace(/\{\w+}?\}/g,'');
				}
			})(),
			
		"*"	:function(values,tags)	{
				var rowset=[];
				for(var i=values.length,value,tag; i--; )
					if(value=values[i])
						Dataset.mapGrid( (tag=tags[i])&&tag.split(","), value, rowset );
				return rowset;
			},
			
		"case"	:function(values,tags)	{ for(var match=values.pop(),i=values.length; i--;)if(tags[i]==match)return values[i]; },
		"pull"	:function(values,tags)	{ var a;for(var pool=values.pop(),i=values.length;i--;)if(a=pool[values[i]]) return a; },
		"pull*"	:function(values,tags)	{ var out=[],a;for(var pool=values.pop(),i=values.length;i--;)if(a=pool[values[i]])out.push(a); return out; },

		"~"	:function(values,tags)	{ var out=[];for(var i=values.length;i--;)out.push({name:tags[i],value:values[i]}); return out; },
		
		append	:function(values,tags){
				var target=values.pop()||[], rows=[], a;
				for(var i=values.length;i--;)
					if(a=values[i])rows.push(a);
				return Env.isArray(target) ? [].concat(target,rows) : rows;
			},
			
		"?"	:function(values)	{ for(var i=values.length;i--;)if(values[i])return values[i]; },		/// any - first non-empty //return false; 
		"!"	:function(values)	{ for(var i=values.length;i--;)if(!values[i])return false; return values[0]; },	/// all - succeeds if empty token found
		"??"	:function(values,tags)	{ for(var i=values.length;i--;)if(values[i])return tags[i]; },			/// who - first met
		"?!"	:function(values)	{ for(var cur=values.pop(),n=values.length,i=n;i-->1;)if(cur==values[i])return values[i-1];return values[--n]; }, /// toggle-rotate
		

		eq	:function(values)	{ for(var a=values.pop(),i=values.length;i--;)if(values[i]!=a)return false;return true; },
		ne	:function(values)	{ for(var a=values.pop(),i=values.length;i--;)if(values[i]!=a)return true;return false; },
		asc	:function(values)	{ for(var a=parseFloat(values.pop()),i=values.length;i--;)if(a>(a=parseFloat(values[i])))return false;return true; },
		dsc	:function(values)	{ for(var a=parseFloat(values.pop()),i=values.length;i--;)if(a<(a=parseFloat(values[i])))return false;return true; },
				
		neg	:function(values)	{ for(var a=values.pop(),i=values.length;i--;)if(values[i])a=-a; return a;},
		
		calc	:function(values,tags)	{ for(var a=parseFloat(values.pop()),i=values.length;i--;){
							var b=parseFloat(values[i])
							switch(tags[i]){
								case"+"	:a+=b;break;
								case"-"	:a-=b;break;
								case"*"	:a*=b;break;
								case"%"	:a=a*b*.01;break;
								case"~"	:if(b)a=-a;break;
								}
							}
							return a;
						},
						
		rows	:function(values,tags)	{ var	rows=values.pop(),i=values.length;
						while(i--)switch(tags[i]){
							case"+":rows.push(values[i]);break;
							case"&":rows.concat(values[i]);break;
							}
						return rows;
						}
						,
		
		join	:function(values)	{ var sep=values.pop(); return values.reverse().join(sep) },
		concat	:function(values)	{ return values.reverse().join(""); },
		space	:function(values)	{ return values.reverse().join(" ").replace(/\s\s+/g," ").trim(); },
		
		
		split	:function(values)	{ var value=values.pop(); for(var i=values.length;i--;)if(value)value=split(value,values[i]); return value; },
		
		alert	:function(values)	{ for(var i=values.length;i--;)alert(spacebreak(values[i])); },
		confirm	:function(values,tags)	{ for(var i=values.length;i--;)if(confirm(spacebreak(values[i])))return tags[i]||true; },
		
		state	: Env.State,
		exec	: function(values)	{ return Env.exec(values.pop().split(".").reverse(),values.reverse()); },
		
		uri	: Uri.ordered, // function(values,tags)	{ return Uri.encode( values,tags ); },
		"uri*"	: Uri.full,
		post	: function(values,tags)	{ return Request.post( values.pop(),values,tags ); },
		upload	: function(values,tags)	{ return Request.blob( values.pop(),values[0],tags[0] ); }
		
	},
	
	operate	:{
	
		// null		- keep on
		// array	- subscope
		// true		- skip to next step
		// false	- next operand, but not next step
		
		"!"	:function(value,alias,node,$)	{ Execute.d(node,value,$); },
		
		"!!"	:Env.attr,
		"!?"	:function(value,alias,node)	{ Env.Style.mark(node,alias,!!value); },
		
		"%"	:function(value,alias,node,$)	{ var d=$[0]['']; if(alias)d[alias]=value; else for(var i in value)d[i]=value[i]; },
		
		"%%"	:function(value,alias,node,$)	{ var d=$[0][''],f=alias.split(','); for(var i=f.length;i--;)d[f[i]]=value[i]; },	// example: %% str:split.colon@a,b,c
		"#"	:function(value,alias,node)	{ node[alias]=value; },

		share	:Hub.share,//function(value,alias,node)	{ Share.,
		notify	:Hub.notify,

		"u"	:function(value,alias,node)	{ Env.Event.bind(node,alias,value); },
		"ui"	:function(value,alias,node)	{ Env.Event.bind(node,alias,value,"ui"); },
		
		"d!"	:function(value,alias,node)	{ Execute.update(value||node); },
		"a!"	:function(value,alias,node) 	{ Execute.a(value||node); },
		"a?"	:function(value,alias,node)	{ After.put(Execute.a,value||node); },
		"u!"	:function(value,alias,node)	{ Execute.u(value||node); }, //
		"u?"	:function(value,alias,node)	{ After.put(Execute.u,value||node); },//{ Execute.u(value||node); }, //
		
		"state"	: Env.State.write,
		"open"	: Env.open,
		"title"	: Env.title,		
		"elem"	: Env.Style.elem,
		
		"class!":function(value,alias,node)	{ node.className = value; },
		"class"	:function(value,alias,node)	{ Env.Style.mark(node,value,!!alias); },
		
		"*"	:function(value,alias)		{ return !value ? false : alias ? Dataset.mapGrid( alias.split(","), value ) :  Dataset.mapGrid( null, value, value ); },
		"?"	:function(value,alias)		{ return !!value; },
		"??"	:function(value,alias)		{ return alias?alias==value: !value; },
		"?!"	:function(value,alias)		{ return alias?alias!=value:!!value; },
		
		"alert"	:function(value)		{ alert(spacebreak(value)); },
		"log"	:function(value,alias)		{ Env.log(alias+" : "+value); },	
		"imply"	:function(value,alias)		{ indepth(alias,value,Request.qookie.set); },
		
		route	:function(value,alias,node){
				Env.Event.bind(node,alias,value); 
				Env.Event.attach( document,alias,
					function(){
						Execute.u(node,alias);
					}
				);
			},
		

		row	:(function(){
				
			function before	(newnode,refnode){if(!refnode)return;refnode.parentNode.insertBefore(newnode,refnode)};
			function after	(newnode,refnode){if(!refnode)return;if(refnode.nextSibling)refnode.parentNode.insertBefore(newnode,refnode.nextSibling);else refnode.parentNode.appendChild(newnode)};
			function instead(newnode,refnode){if(!refnode)return;refnode.parentNode.replaceChild(newnode,refnode)};

			function locate(node){
				for(var rows=node.$[2];rows==node.parentNode.$[2];node=node.parentNode);
				var	row	= node.$[0][''],
					index	= rows.indexOf(row);
				if(index>=0)
					return{ base:node, rows:rows, row:row, index:index };
			};
			
			
			return	{
				move	:function(value,alias,node){
						var r=locate(node);
						if(r){
							var base=r.base, row=r.row, rows=r.rows, i=r.index;
							switch(value){
								case'up'	:if(i>0) rows[i]=rows[i-1], rows[i-1]=row, before(base,base.previousSibling);break;
								case'down'	:if(i<rows.length-1) rows[i]=rows[i+1], rows[i+1]=row, after(base,base.nextSibling);break;
								case'top'	:rows.splice(i,1), rows.unshift(row), before(base,base.parentNode.firstChild);break;
								case'bottom'	:rows.splice(i,1), rows.push(row), after(base,base.parentNode.lastChild);break;
								case'away'	:rows.splice(i,1), base.parentNode.removeChild(base);
							}
						}
					},
					
				insert	:function(value,alias,node){
						var r=locate(node);
						if(r){
							value['']=r.base.$[0][''][''];
							var	base=r.base, rows=r.rows, i=r.index,
								sibling=base.P.spawn([{'':value},base.$,rows],base.parentNode);
							if(sibling)switch(alias){
								case "instead"	:rows[i]=value;instead(sibling,base);break;
								case "before"	:rows.splice(i,0,value);before(sibling,base);break;
								case "after"	:
								default		:rows.splice(i+1,0,value);after(sibling,base);break;
							}
							return sibling;
						}
					}					
				};
			})()
	}
	}
	};
	
	function spacebreak(line){return line.replace(/\s\s/g,"\n");}
	
	function indepth(alias,value,todo,target){
		if(value!=null)
			if(typeof value != 'object')target=todo(alias,value,target);
			else for(var i in value)if(i)target=indepth(i,value[i],todo,target);
		return target;
	};
		
	var

	O	= [],
	E	= "",
	
	split	= (function(){
		
		var isArray=Array.prototype.isArray;
	
		function deeper(value,separator){	/// recursive split - string to rowset conversion
			if(value)
				if(isArray(value))
					for(var i=value.length;i--;)
						value[i]=deeper(value[i],separator);
				else
					value = value.split ? value.split(separator) : value;
			return value;
		};
		
		return	function(value,separator){
			if(value.trim)value.trim();
			return !value ? [] : value.split ? value.split(separator) : deeper(value,separator);
		};
		 
	})(),
	
	Uri	= (function(){
	
		var
		
		base	= window.location.href.replace(/[?!#].*$/,""), // const	
		
		parse	=(function(regx){ // based on code from http://blog.stevenlevithan.com/archives/parseuri
			
			var keys = ["source","origin","protocol","authority","userinfo","username","password","host","hostname","port","relative","path","directory","file","query","anchor"];
				
			return function(str){
				var uri = {};
				for(var m=regx.exec(str), i=keys.length; i--;)
					uri[keys[i]] = m[i] || "";
				return uri;
			}
		})(/^(([^:\/?#]+:)?\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?(([^:\/?#]*)(?::(\d*))?))?)((((?:[^?#\/]*\/)*)([^?#]*))(\?[^#]*)?(#.*)?)/);
		
		
		function hash(qstr,target){
			if(!target)target={};
			if(qstr)
				for(var tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i--;){
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
				for(var tups = qstr.replace('+',' ').replace(/^!/,'').split('&'),i=tups.length;i--;)
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
			for(var i in hash)
				if((v=hash[i])||(v===0))
					arg.push(i+"="+encodeURIComponent(v));
			return arg.join('&').replace(/%20/g,'+');
		};
		
		function ordered(values,tags,emptytoo){
			var uri="";
			for(var i=values.length,v,t;i--;)
				if((v=values[i])||(v===0)||emptytoo)
					uri+=(t=tags[i]) ? "&"+t+"="+ encodeURIComponent(v) : v;
			return uri.replace(/%20/g,'+');
		};
		
		
		return	{
			base	:base,
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
				
				if(!from)from=base;
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

	Env	= (function(){
	
		var	isIE	= false,
			doc	= window.document,
			isArray	= Array.prototype.isArray,
			
			DEFAULT	= {
				TAG	: "div",
				ELEMENT	: doc.createElement("div")
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
			};
			
		function log(text)	{
			if(window.console)window.console.log("DAP "+text);
		}

		function newStub(c)	{return doc.createComment(c)}
		function newElem(e)	{return doc.createElement(e)}//try{}catch(er){alert("newElem fail:"+e)}
		function newText(t)	{return doc.createTextNode(t)}
		function newElemText(e,t){var e=newElem(e);e.appendChild(newText(t));return e}
		
		function newError(e,$,P){var n = newElemText("dap-error",e.message); n.$=$; n.P=P; /* n.setAttribute("title",P.rules.d.rulestring);*/ return n; }
		function newMute($,P)	{var n = doc.createComment(P.elem?P.elem.nodeName:"*"); n.$=$; n.P=P; return n; }
				
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
		
		var		

		Event	= (function(){
			
			var
			
			attach	= doc.addEventListener	? function(node,event,handler,capture){node.addEventListener(event,handler,capture||false)}:
				  doc.attachEvent	? function(node,event,handler){node.attachEvent("on"+event,handler,false)}
							: function(node,event,handler){node["on"+event]=handler},
							
			stop	= window.Event		? function(e){ e.stopPropagation(); e.preventDefault(); return e; }
							: function(){ e=window.event; e.cancelBubble=true; e.returnValue=false; return e; }
							;
			
			function Handle(e){
				Perf(e.type,Date.now(),Execute.Event(stop(e)));
				return true;
			}
		
			return	{
			
				stop	: stop,
				attach	: attach,
				isArray	: isArray,
				
				bind	:function(node,alias,value,hilite,capture){
				
					var	event	= alias||DEFAULT.EVENT,
						donor	= value||node.P,
						rule	= donor.ubind ? donor.ubind(event) : donor[event] || donor.u;
						
					(node.reacts||(node.reacts={}))[event]=rule;
					if(hilite)Style.attach(node,hilite);
			
					attach(node,event,Handle);
				},
				
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
				
		Http	= (function(){
		
			var	IEsucks = (function(){ // hack for ie, which doesn't allow to assign own properties to XHR object
				var active = [];
				return	{
					put	: function(key,target) {
							active.push({key:key,target:target});
						},
					pull	: function(key){
							var found=null;
							for(var i=active.length;i--;)
								if(active[i].key===key){
									found=ieXHRsucks[i];
									active.splice(i,1);
								}
							return found && found.target;
						}
				};
			})();

			function query( method,async,contentType,headers,url,body ){
			
				var	request	= window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Msxml2.XMLHTTP');
				
				request.open( method,request.url=Uri.absolute(url),async );
				request.setRequestHeader("Content-Type",contentType);//||"text/xml"
				
				if(headers)
					for(var i in headers)
						request.setRequestHeader(i,headers[i]);
				
				if(async){
					request.onreadystatechange=progress;
					var postpone = new Execute.Postpone();
					request.postpone = postpone;
					if(!request.postpone)IEsucks.put(request,postpone);
				}
				
				try	{
					request.send(body||null);
				}catch(e){
					Warn(e.message,e);
				}
				
				if(async)throw(postpone);
				else return consume(request);
			};
			
			function progress(){
				if(this.readyState!=4)return;
				var postpone=this.postpone || IEsucks.pull(this) || Fail("No target for request",this);
				postpone.resolve(consume(this));
			};

			function consume(request){
				if(Math.floor(request.status/100)!=2)return;
				switch(request.getResponseHeader('content-type').split(";")[0]){
					case"application/xml":
						return request.responseXML.documentElement;
					case"application/json":
						return Dataset.unpack(JSON.parse(request.responseText),request.getResponseHeader("X-Columns"));
					case"text/plain":
						return request.responseText;
					default:
						return request;
				}
			};
		
	 		return {
				GET	: function( async,headers,contentType,url )	{ return query("GET" ,async,contentType,headers,url); },
				POST	: function( async,headers,contentType,url,body ){ return query("POST",async,contentType,headers,url,body); }
			};
		})(),
		
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

		function print(place,P,$){
			if(P==null)return;
			if(isArray(P))
				for(var i=0;i<P.length;i++)
					print(place,P[i],$);
			else if(P.spawn)P.spawn($,place);
			else place.appendChild(P.$ ? P : P.nodeType ? P.cloneNode(true) : newText(P));
		}
		
		return	{
			
			DEFAULT	:DEFAULT,
			REUSE	:REUSE,
		
			State	:State,
			Http	:Http,
			Event	:Event,
			Style	:Style,
			Native	:Native,
			NativeElement:NativeElement,
			
			JSON	:{
				encode	:function(value){var r=0; return value&&JSON.stringify(value,(k,v)=>(k||!r++)?v:undefined)},
				decode	:function(value){return value&&JSON.parse(value);}
				},

			Storage	:{
				put	:function(data)	{if(!localStorage)return; for(var key in data)localStorage.setItem(key,JSON.stringify(data[key]));},
				get	:function(key)	{try{JSON.parse(localStorage.getItem(key))}catch(e){return null};}
				},
			
			print	:print,
			log	:log,
			attr	:function(value,alias,node){ if(value)node.setAttribute(alias,value); else node.removeAttribute(alias); }, //... 
			
			mute	:function(elem){Style.attach(elem,"MUTE"); return elem; },
			dim	:function(elem){Style.attach(elem,"DIM"); return elem; },
			error	:function(elem,e){Style.attach(elem,"ERROR");elem.setAttribute("title",e.message);Warn(e.message)/*throw e*/},
			
			exec	:function(path,values){
					var tgt=window;
					for(var i=path.length;i--;)if(!(tgt=tgt[path[i]]))return;
					if(tgt.apply)return tgt.apply(null,values);
				},
			
			clone	:function(elem,$,P){var n=elem.cloneNode(false); n.$=$; n.P=P; return n; },
			
			value	:function(node){return (node.value||node.textContent||node.innerText||"").trim();},
			text	:function(node){return (node.innerText||node.textContent||node.value||"").trim();},
			copy	:function(item){return isArray(item)?item.slice(0):Object.assign({},item);},
			
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
		})(),
		
	Util	= (function(){
	
		function splitDeep(str,val){
			if(Array.prototype.isArray(val))
				for(var i=val.length;i--;)
					val[i]=splitDeep(val[i],separator);
			else if(value&&value.split)
				value=value.split(separator);
			return value;
		};
		
		return	{
		
			unescape: decodeURI,
			splitDeep: splitDeep,
			
			hash:
			function (values,tags){
				var hash={},a;
				for(var i=values.length;i--;)
					if(a=tags[i])hash[a]=values[i];
					else for(var j in a=values[i])hash[j]=a[j];
				return hash;
			},
			
			multi	:{
			
				replace:	/// multiple regex replaces
				function (regs,value){	
					if(value)for(var i=regs.length;i--;)
						value=value.replace(regs[i][0],regs[i][1]);
					return value;
				}
				
			},
			
			multiRegex:
			function multiRegex(arr,modifiers){
				for(var i=arr.length;i--;)arr[i]="(?:"+arr[i].source+")";
				return new RegExp(arr.join("|"),modifiers);
			}
			
		}
	
	})(),

	Dataset	= (function(isArray){
		
 		function mapGrid(columns,grid,rowset){
			if(!isArray(rowset))rowset=[];
			if(!isArray(grid))rowset.push(grid);
			else if(columns)for(var count=grid.length,row=0; row<count; row++)rowset.push(mapRow(grid[row],columns));
			return rowset;
		};
		
		function mapRow(datarow,columns){
			var entry={};
			if(isArray(datarow))
				for(var i=datarow.length;i--;)
					entry[columns[i]]=datarow[i];
			else if(datarow instanceof Object)
				entry=datarow;
				// for(var i=columns.length;i--;)
					// entry[columns[i]]=datarow[columns[i]];
			else entry[columns[0]]=datarow;
			return entry;
		};
		
		function concat(feed,separator){	/// concatenate feed tokens
			var a,out=[];
			for(var i=0;i<feed.length;i++)if(a=feed[i].value)out.push(a);
			return out.join(separator);
		};
/*		
		function flatRow(rowdata,flds,separator){
			var row=[];
			for(var f=0;f<flds.length;f++)row.push(rowdata[flds[f]]);
			return row.join(separator);
		};

		function flatObject(str,fsep,tsep){
			var row=[];
			for(var i in str)row.push(i+tsep+str[i]);
			return row.join(fsep);
		};

		function flatRowset(rowset,flds,rsep,fsep,tsep){
			if(!rowset||!rowset.length)return null;
			var rows=[], flds=flds instanceof Array ? Array:flds.split(','), row;
			for(var r=0;r<rowset.length;r++)
				if(row=rowset[i])
					rows.push(
						flds ? flatRow(row,flds,fsep) : 
						row instanceof Array ? row.join(fsep) :
						flatObject(row,fsep,tsep)
					);
			return rows.join(rsep);
		};
*/
		return	{
		
			mapGrid:mapGrid,

			flat:
			function(vals,tags,rsep,fsep,tsep){
				var out=[];
				for(var i=0;i<vals.length;i++)
					if(vals[i])out.push(flatRowset(vals[i],tags[i]));
				return out.join(rsep);
			},
			unpack	:function(data,cols){
				if(cols&&isArray(data)){
					cols=cols.split(','),
					count=cols.length;
					for(var i=data.length; i--;){
						var	row=a[i],
							obj={};
						if(isArray(row))
						for(var j=0; j<count; j++)
							obj[cols[i]]=row[i];
					}
					data[i]=obj;
				}
				return data;
			},
			pack	:function(data,cols){
				
			}
		}

	})(Array.prototype.isArray),

	After	= (function(){
	
		var	queue	= [],
			phase	= 0; // 0:hold; 1:running; 2:finished
			
		function Job(handler,subject,before){
			this.handler=handler;
			this.subject=subject;
		};
		
		function put(job,before){
			if(before)queue.push(job);
			else queue.unshift(job);
			if(phase==2)run(); // afterdone
		};
		
		function run(){
			var job;
			if(phase==1)return;
			phase=1; // being executed
			while(job=queue.pop())
				if(job.handler(job.subject))	// true -> suspend execution of the rest of the queue
					return phase=0;	// buffering
			return phase=2; // done
		};
		
		return	{
			hold	: function(){phase=0},
			put	: function(handler,subject,before){ put( new Job(handler,subject),before||false); },
			run	: run
		};

	})(),

	Hub	= (function(){

		var registry={};

		return {
			share	: function(value,alias,node){
					var a=value[''];
					if(a && (a=a.share||(a.share=[])))
						for(var i=a.length;i--;)
							if(a[i]==node)
								return;// true;
					a.push(node);
				},

			notify	: function(value,alias,node){
					var a=value[''];
					if(a&&(a=a.share))
						for(var i=a.length;i--;)
							if((n=a[i])&&n.baseURI)
								Execute.u(n,alias);
							else a.splice(i,1);
				}
		}
	})(),

	Request	= (function(){
	
		var
		Qookie=(function(){
		
			var	items={};
			
			return	{
				set	:function(name,value)	{ items[name]=value; },
				get	:function(name)		{ return items[name]; },
				
				headers	:function(){
						var q = Uri.neutral(items);
						return q && {"qookie":q};
					}
			}
		
		})();
		
		function Post(url){
			this.url=url;
			this.body=null;
			this.mime=null;
		};
		
		Post.prototype={
			form	: function(values,tags){
					var body="";
					for(var i=values.length,v,t;i--;)
						if(v=values[i])
							body += (t=tags[i])
							? "&"+t+"="+ encodeURIComponent( typeof v=="object" ? Json(v) : v ) 
							: Json(v);
					this.body=body;
					v=body.charAt(0);
					this.mime= v=='<'?"text/xml" : v=='&'?"application/x-www-form-urlencoded" : "text/plain";
					return this;
				},
				
			blob	: function(value,tag){
					this.body=value;
					this.mime=tag||"blob";
					return this;
				}
		}
		
		return	{
			qookie	:Qookie,

			post	:function(url,values,tags){
					return new Post(url).form(values,tags);
				},
				
			blob	:function(url,value,tag){
					return new Post(url).blob(value,tag);
				},
				
			http	:function(req,async,verb){					
					var	a = async && Execute.async,
						h = Qookie.headers();
			
					return	req.body?	Env.Http.POST	(a,h,req.mime,req.url,req.body) :
						req.url ?	Env.Http.GET	(a,h,"text/xml",req.url) :
						(typeof req == "string") && Env.Http.GET(a,h,"text/xml",req); 
				}
		}
		
	})(),
	
	Parse	= (function(){
	
		function Brancher( cleanup, brackets ){
			this.cleanup	= cleanup;
			this.brackets	= brackets;
		};
		Brancher.prototype = (function(){ //alert("Brancher.prototype");
		
			var	replace	= Util.multi.replace,
				extract	= function( str, brackets ){
				
					var branchStack=[];
					function stub(match,inner){
						return "<"+branchStack.push(inner.trim())+">"
					};
					
					while(str!=(str=str.replace( brackets, stub )));
					branchStack.unshift(str.trim());
					return branchStack;
				};			
			
			return	{
				Parse	:function(str){
					return ( extract( replace(this.cleanup,str), this.brackets) );
				}
			}
			
		})();
/*		
		function Tree(branches,separators){
			this.branches=branches;
			this.separators=separators;
			this.root=branch(branches[0],separators);
		};
		
		function branch(str,sep){
			if( str instanceof String ){
				str=str.split(sep[0]); sep=sep[1]||sep;
				for(var i=str.length,part;i--;)
					if(part=str[i]) str[i] = sep ? branch(part,sep) : resolve(part);
			}return str;
		};
*/		
		return	{
			Brancher: Brancher
//			Tree	: Tree
		};
		
	})(),
	
	Monads	= Canonical(),
	
	Compile	= (function(){
	
		var	RESERVED={				// dap-reserved attribute names. please, don't misuse them
				"dap-ns"	:true,		// namespace URI
				"dap-ref"	:true,		// imported namespaces
				"dap-model"	:true		// element model override
			},
			
			DEFAULT	={
				EVENT	: "click"
			},
			
			PRINT	= Monads.operate["!"],
			ATTR	= Monads.operate.attr,
			
		Namespace = (function(){

			function Ns(uri,ready){
				
				Env.log("New namespace: "+uri);
/*								
				var	loc	= uri.split('#'),// || node.nodeName ),
					path	= loc[0],
					hash	= loc[1],

				if(hash)
					Namespace(path).reach(hash).Dict(this.dict);	
*/
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
				
				function take(node,attr){
					var a=node.getAttribute(attr);
					node.removeAttribute(attr);
					return a;
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
									imported= Uri.absolute(path,this.uri);
								
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
							for(var i in dict){
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
				var uri = Uri.absolute(ref,base);
				return registry[uri] || (registry[uri]=new Ns(uri,ready));
			}
			
		})();
	
		function makePath(str){
			if(str) return str.split(".").reverse();
		};		
		
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
		
		function append(obj,key,value){
			obj[key] = obj[key] && (value.charAt(0)===';') ? obj[key]+value : value;
		}
		
		Proto.prototype={
			
			$	:function(utag,stuff){
					this.utag = utag; // TODO: TABLE>TBODY,
					return stuff&&stuff.length?this.d(stuff):this;
				},
				
			$$	:function(){ return this.tgt=this },
			
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
				
			d	:function(...stuff)		{ return this.set("d",stuff) },
			a	:function(...stuff)		{ return this.set("a",stuff) },
			u	:function(...stuff)		{ return this.set("u",stuff) },
			ui	:function(...stuff)		{ return this.set("",stuff,true) },//
			e	:function(event,...stuff)	{ return this.set(event,stuff,true) },
			
			r	:function(rule)		{ return new Rule(this.ns,rule) },
				
			FOR	:function(stub){
					this.utag=this.utag.stub(stub);
					for(var a in this.attrs)this.attrs[a]=this.attrs[a].stub(stub);
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
					for(var i in attrs)
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
					for(var i=react.length; i-->0;){
						if(!react[i])rules[react[i]=Env.uievent(node)]=rules[""];
						Env.Event.bind(node,react[i],Execute.Event);
					}
					
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
			
			slice	:function(from){
				return new Feed(
					this.values	&&this.values.slice(from),
					this.tags	&&this.tags.slice(from),
					this.tokens	&&this.tokens.slice(from)
				);
			}
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
		
			var	BRANCHER = new Parse.Brancher(
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
				var a;
				if(arr)for(var i=arr.length;i--;)if(a=arr[i])list=[a,list];
				return list;
			}
						
			function resolveMesh(path){
				var entry=path.pop().substr(1);
				if(entry)switch(entry){
					// #anything?
				}else{
					if(!path.length)path = REUSE.THENODE;
					else path.push(REUSE.NODE);
				}
				return path;
			}			
			
			function makeBranch(context,n,epilog){

				var	branchstr	= context.branchStack[n],
					parts		= branchstr.split(INHRT),
					todo		= null,
					stepsstr	= parts[0],
					inherits	= parts[1],
					steps		= stepsstr.split(STEPS);

				for(var i=steps.length; i--; )
					steps[i]=makeStep(context,steps[i]);				
				
				if(epilog)
					steps.push(epilog);

				if(inherits){
				
					var	donor	= inherits.split("#"),
						inherit	= context.ns.reach( makePath(donor[0]) ) || Fail( "Can't find "+donor[0] ),
						rule	= inherit.ubind && inherit.ubind(donor[1]||"d") || Fail( "Can't inherit from "+donor[0] );
						
					if(rule){
						for(var i in rule.defs)(context.defs||(context.defs={}))[i]=true;
						for(var i in rule.refs)(context.refs||(context.refs={}))[i]=true;
						todo = rule.todo||rule.engage().todo;
					}
				}
				
				return List(steps,todo);
			}
			
			function makeStep(context,str){
			
				if(/^<\d+>$/.test(str))
					return new Step(null,makeBranch(context,str.substr(1,str.length-2),null));
				
				var	tokens	= str.split(TOKENS),
					a	= !/[<$=]/.test(tokens[0]) && tokens.shift(), // operate:convert@alias
					alias	= a&&(a=   a.split("@")).length>1 ? a[1] : null,
					convert	= a&&(a=a[0].split(":")).length>1 ? makeConverts(context,a[1]) : null,
					operate	= a&&(a=a[0]) ? context.ns.reach(makePath(a),MONADS.OPERATE) : null;
			
				return new Step(
 					tokens.length
						? makeTokens( context, tokens, operate, (convert || alias!=null)?{ alias:alias, convert:convert }:null ) 
						: new Feed( REUSE.DUMMY, REUSE.DUMMIES[alias]||(REUSE.DUMMIES[alias]=[alias]), REUSE.DUMMY, operate ) 
				);
			}
			
			function makeTokens(context,tokens,op,head){
				
				var	count	= tokens.length,
					tags	= new Array(count),
					values	= new Array(count);
				
				while(count--){
				
					var	a	= tokens[count],
						literal	= (a=a.split("`")).length>2 ? Util.unescape(a[2]) : a.length>1 ? a[1] : null,
						alias	= (a=a[0].split("@")).length>1 ? a[1] : null,
						rval	= (a=a[0].split("=")).pop(),	// makeValue( , liter, context ),
						lvals	= a.length>0 ? a : null,	// List(makeValue,parts) : null;
						
						tag	= null,
						
						parts	= [],
						converts= [];
					
					// lvalues
					if(lvals)
					for(var i=0; i<lvals.length; i++){
					
						var	convert	= (a=lvals[i].split(":")).length>1 ? makeConverts(context,a[1]) : null,
							path	= a[0] && makePath(a[0]) || Fail("Zero-length path (check for ==)");
							
						if(path){
						
							var	top	= path.length-1,
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
					
					// rvalue
					if(rval){
						var	convert = (a=rval.split(":")).length>1	? makeConverts(context,a[1]) : (head && head.convert) || null,
							feed	= (a=a[0].split("<")).length>1	? makeArgsFeed(context,a[1]) : null,
							path	= a[0] ? makePath(a[0]) : null;
							
						if(path){
							
							var	top	= path.length-1,
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
							for(var i=convert.length;i--;)
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
				var	a	= str.split(">"),
					flatten	= a[1]	? context.ns.reach(makePath(a[1]),MONADS.FLATTEN) : Util.hash,
					tokens	= a[0] && context.branchStack[a[0]].split(TOKENS);
					
				return	tokens ? makeTokens( context, tokens, flatten ) : Feed.prototype.EMPTY;
			}
			
			function makeConverts(context,str){
				var vector = str.split(",").reverse(),c;
				for(var i=vector.length; i--;)
					if('function' != typeof (vector[i]=context.ns.reach(makePath(c=vector[i]),MONADS.CONVERT)||Fail("converter not found "+vector[i],context)))
						Fail('convert '+c+' is not a function');
				return vector;
			}
			
			function makeChildStep(ns,stuff){
				if(!stuff)return null;
				for(var i=stuff.length; i--; )
					if(stuff[i] instanceof Proto)
						stuff[i].into(ns);
				return new Step( new Feed([stuff],REUSE.DUMMY,REUSE.DUMMY,PRINT));
			}
									
			return {
				
				EMPTY	: new Rule(),
		
				engage	: function(){
						var	epilog	= makeChildStep(this.ns,this.stuff);
				
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
	
		var	stackDepth	= 0,
			postpone	= null,
			
			REUSE		= Env.REUSE;
					
		function Postpone(){
			this.instead	= null;
			this.place	= null;
			this.target	= null;			
			this.branch	= null;
			this.todo	= null;
			this.token	= null;
			this.time	= Date.now();
		};
		Postpone.prototype = {
			locate	:function(place,instead){
					if(this.instead=instead){
						this.place=place;
						if(instead.replacer)instead.replacer.dismiss();
						instead.replacer=this;
					}
				},			
			dismiss	:function(){
					this.branch=null;
				},
			resolve	:function(value){
					if(this.branch){
						Perf("wait",this.time);
						this.target.value=value;
						After.hold();
						Perf("exec",Date.now(),
							this.branch.up
							?this.branch.checkUp(this.instead,this.todo)
							:this.branch.exec(this.todo,this.place,this.instead)
						);
						After.run();
					}
					this.instead=null;
				}
		};
		
		function ctx(data,$,rowset,updata){
			var datarow = data instanceof Object ? data : {"#":data}
			datarow['']=updata;
			return [{'':datarow},$,rowset];
		};
				
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
				var	node	= this.node,
					empty	= null;
				if(todo)try	{
					empty	= this.execBranch(todo) && !node.childNodes.length;// && !node.attributes.length;
				}catch(y){ // returns nothing if postponed
					if(y instanceof Postpone){
						y.locate(place,instead);
						y.branch=this;
						//return false;
					}
					else	Env.error(node,y);
				}
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
					Fail("Suspicious recursion depth: "+node.P.rules.d.rulestring,this);
				
				for(var step;todo&&(step=todo[0]);todo=(flow==null)&&todo[1]){
					if(step.todo)
						try	{
							new Branch($,node,this.up).execBranch(step.todo); // node.$ ?
						}
						catch(y){
							if(y instanceof Postpone){
								y.todo=[
									new Compile.Step(null,y.todo),
									todo[1]
								]
							};
							throw(y);
						}
					else
					try	{
					
						if(!step.feed)
							alert("no feed");
					
						var	feed	= step.feed,
							operate	= feed.op,
							tokens	= feed.tokens,
							values	= feed.values,
							tags	= feed.tags,

							i	= tokens.length;
							
						flow	= null;
							
						if(operate){
							while(i-- && !flow)
								flow = operate(this.execToken(tokens[i],values[i]),tags[i],node,$);
								// null		- keep on
								// false	- next operand, but not next step
								// true		- skip to next step
								// array	- rowset subscopes
								// ? object	- subscope
								
							if(flow)
								if(isArray(flow)){
									var	updata = $[0][''];
									for(var r=0,rows=flow.length; r<rows; r++)
										//if(flow[r]!=null)
											empty	= new Branch(ctx(flow[r],$,flow,updata),node,this.up).exec(todo[1]) && empty;

								}else
									flow	= null;
						}else
							while(i--)this.execToken(tokens[i],values[i]);
					}
					catch(y){
						if(y instanceof Postpone){
						
							// no need to slice values and tags
							tokens	= tokens.slice(0,i);
							tokens[i] = y.token;
							
							y.todo=[
								new Compile.Step(
									values && new Compile.Feed(values,tags,tokens,operate),
									y.todo
								),
								todo[1]
							];
							if(--stackDepth<0)alert("woops");
						}
						throw(y);
					}
				}
				--stackDepth;
				
				if(isArray(flow))
					return	empty;
				else
					return flow===false;
			},

			execToken:
			function(token,literal){
			
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
								if(value==null)for(var $=this.$;$&&(value=$[0][entry])==null;)$=$[1];
							}
							else value=trace(this.$,entry);
							if(value==null)
								Fail("Entry not found: "+entry,this);
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
							i	= tokens.length;
							
						try	{
							while(i--)
								values[i]=this.execToken(tokens[i],values[i]);
						}
						catch(y){
							if(y instanceof Postpone){
							
								tokens = tokens.slice(0,i);
								tokens[i]=y.token;
								
								feed = values.length && new Compile.Feed(values,tags,tokens,feed.op);
								
								parts = parts.slice(0,p);
								parts[p] = new Compile.Rvalue(feed,path);
								
								y.token = new Compile.Token(parts,converts);
							}
							throw(y);
						}
						
						value = feed.op(values,tags);
						
						if(proto){
							value['']=this.$[0][''];
							Env.print(this.node,proto,[{'':value},this.$,this.$[2]]);
						}							
					}
					
				}
				
				if(value==null){
					value = literal || "";
					if(literal!=null)convert = null;// literal values are already pre-converted
				}
				
				while(p>=0){
				
					if(convert)
					try	{
						for(var c=convert.length; c--; )
							//if('function' === typeof convert[c])
								value=convert[c](value);
							//else Env.log("non function");
						if(value==null)value="";
					}
					catch(y){
						if(y instanceof Postpone){
							converts= converts.slice(0,p);
							converts[p]=c>0 && convert.slice(0,c);
							
							parts	= parts.slice(0,p);
							parts[p]= REUSE.STUB; // no Rvalue
							
							token	= new Compile.Token(parts,converts);
							
							y.target = y.token = token;
						}
						throw(y);
					}
				
					if(p--)
					{
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
					//event=this.u(rule.todo||rule.engage().todo)||event;
				try{
					route=this.execBranch(todo||rule.todo||rule.engage().todo)||route;
				}catch(y){
					if(y instanceof Postpone){
						y.branch=this;
						y.instead=snitch;
						return;
					}
					else	Env.error(node,y);
				}
					
				for(var i in this.up)
					if(!defs||!defs[i])
						up[i]=this.up[i];
							
				up = (parent && parent.P) ? new Branch(parent.$,parent,up,route).checkUp(node) : {};

				for(var i in up)
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
					
					for(var i in dn)
						if($0[i]!=null){
							if(!defs||!defs[i])(sift||(sift={}))[i]=$0[i]=dn[i];
							if(refs&&refs[i])rebuild=true;
							if(affs&&affs[i])repaint=true;
						}
					
					if(rebuild)
						update(node);
					
					else	{
						if(sift)
							for(var nodes=node.childNodes,i=nodes.length,n;i--;)
								if((n=nodes[i])!=snitch && n.P )this.checkDown(n,sift);
						if(repaint)
							new Branch($,node).exec(a.todo);
						
						return  sift||{};
					}
				}
			}
		};
		
		function update(node,$){
			node.P.spawn($||node.$,node.parentNode,node);
		};
		
		function trace($,entry){
			if($)	return $[0][entry]==null ? $[0][entry]=trace($[1],entry) : $[0][entry];
		};
		
		return	{
		
			d	:Env.print,
			a	:function(node,rule)	{ if(!rule)rule=node.P.rules.a; if(rule) new Branch(node.$,node).exec( rule.todo||rule.engage().todo ); else Fail("no a rule",node); },
			u	:function(node,event)	{ new Branch(node.$,node,{},event).checkUp(); },
			
			Branch	:Branch,
			Postpone:Postpone,
			
			Event	:function(e){
				After.hold();
				Execute.u(e.currentTarget||e.srcElement,e.type);
				After.run();				
			},
			
			update	: update,

			async	: true
		};

	})(),

	STD	= {
		Env	:Env,
		Uri	:Uri,
		Request	:Request,
		After	:After,
		Util	:Util,
		
		Parse	:Parse,
		Execute	:Execute,
		
		async	:function(holder){
				var f=holder.resolve;
				holder.resolve=function(value){
					var	p=holder.post;
					holder.post=null;
					return p&&p.resolve(f?f(value):value);
				}
				return	function(value){
					holder.execute(value);
					throw holder.post = new Execute.Postpone();
				}
			},
		
		window	:window,
		
		rootns	:Compile.Namespace(null,null,true).Monads(Monads),//Uri.absolute()
		
		Infect	:function(typePrototype,rules){//dap().Inject(String.prototype)
				(rules||"d a u ui e r").split(" ")
				.forEach((a)=>typePrototype[a]=
					function(...x){return Compile.Proto.prototype.$(this)[a](...x)}
				);
			}
	}
			
	return function(proto,data){
		if(!proto)return STD;
		if(proto instanceof Function)proto=proto((utag,...stuff)=>new Compile.Proto().$(utag,stuff));
		if(proto instanceof Compile.Proto)Env.inline(proto,data);
	}
	
})();
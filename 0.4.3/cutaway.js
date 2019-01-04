convert:{
	env
		location:function(req){return window.location.href},
		xml	:Parse.Xml,

		prompt	:obj=>prompt(spacebreak(obj.prompt||''),obj.value||'')},
		confirm	:str=>confirm(spacebreak(str))&&str},
		storage	:Env.Storage,
		title	:Env.title,
		
		
		cols	:function(value) {return Dataset.mapGrid(value[0],value.slice(1));},
			
		
		// some costants
		
		chr	:{
			tab	:()=>"\t",
			newline	:()=>"\n",
			para	:()=>"\n\n"
		}
		split	:{
				space	:value=>split(value,/\s+/),
				comma	:value=>split(value,/\s*,\s*/),
				colon	:value=>split(value,/\s*:\s*/),
				para	:value=>split(value,/\n\n+/),
				lfc	:value=>split(split(value,/\s*\n\s*/),/(?:\s+|^):\s?/),
				
				urlenc	:Env.Uri.query
			},
		
		format	:{
			upper	:function(value){ return value.toUpperCase(); },
			lower	:function(value){ return value.toLowerCase(); },
			para	:function(value){ return value&&value.replace(/\s\s/g,"\n"); },
	
			num	:function(value){ return String(value).replace(/[^-.0-9]+/g,"").replace(/\B(?=(...)*$)/g," "); },	/// digit groups 
			"~num"	:function(value){ return value.replace(/[^-.0-9]+/g,""); }
		},

	}
	
flatten:{
			"*"	:function(values,tags)	{
				var rowset=[];
				for(var i=values.length,value,tag; i--; )
					if(value=values[i])
						Dataset.mapGrid( (tag=tags[i])&&tag.split(","), value, rowset );
				return rowset;
			},
			
		append	:function(values,tags){
				var target=values.pop()||[], rows=[], a;
				for(var i=values.length;i--;)
					if(a=values[i])rows.push(a);
				return Env.isArray(target) ? [].concat(target,rows) : rows;
			},
			
		"?!"	:(values)=>{ for(var cur=values.pop(),n=values.length,i=n;i-->1;)if(cur==values[i])return values[i-1];return values[--n]; }, /// toggle-rotate
		"??"	:function(values,tags)	{ for(var i=values.length;i--;)if(values[i])return tags[i]; },		/// who - first met
		
		neg	:function(values)	{ for(var a=values.pop(),i=values.length;i--;)if(values[i])a=-a; return a;},

		"pull*"	:function(values,tags)	{ var out=[],a;for(var pool=values.pop(),i=values.length;i--;)if(a=pool[values[i]])out.push(a); return out; },
		"~"	:function(values,tags)	{ var out=[];for(var i=values.length;i--;)out.push({name:tags[i],value:values[i]}); return out; },
		
		rows	:function(values,tags)	{ var	rows=values.pop(),i=values.length;
						while(i--)switch(tags[i]){
							case"+":rows.push(values[i]);break;
							case"&":rows.concat(values[i]);break;
							}
						return rows;
						},
				split	:function(values)	{ var value=values.pop(); for(var i=values.length;i--;)if(value)value=split(value,values[i]); return value; },
		
		state	: Env.State,
		exec	: function(values)	{ return Env.exec(values.pop().split(".").reverse(),values.reverse()); },
		

		
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


}

operate	:{
			share	:Hub.share,//function(value,alias,node)	{ Share.,
		notify	:Hub.notify,

		"state"	: Env.State.write,
		"open"	: Env.open,
		"title"	: Env.title,		
		"elem"	: Env.Style.elem,
		
		"class!":function(value,alias,node)	{ node.className = value; },
		"class"	:function(value,alias,node)	{ Env.Style.mark(node,value,!!alias); },
		
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
		route	:function(value,alias,node){
				Env.Event.bind(node,alias,value); 
				Env.Event.attach( document,alias,
					function(){
						Execute.u(node,alias);
					}
				);
			},
		

}








	
	
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


		function splitDeep(str,val){
			if(Array.prototype.isArray(val))
				for(let i=val.length;i--;)
					val[i]=splitDeep(val[i],separator);
			else if(value&&value.split)
				value=value.split(separator);
			return value;
		};
		
,

		 indepth:(alias,value,todo,target)=>{
			if(value!=null)
				if(typeof value != 'object')target=todo(alias,value,target);
				else for(let i in value)if(i)target=indepth(i,value[i],todo,target);
			return target;
		}


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





		"imply"	:function(value,alias)		{ indepth(alias,value,Request.qookie.set); },
	
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
		
		
		
	
		

//ns	
function take(node,attr){
var a=node.getAttribute(attr);
node.removeAttribute(attr);
return a;
};

/*		
		function Tree(branches,separators){
			this.branches=branches;
			this.separators=separators;
			this.root=branch(branches[0],separators);
		};
		
		function branch(str,sep){
			if( str instanceof String ){
				str=str.split(sep[0]); sep=sep[1]||sep;
				for(let i=str.length,part;i--;)
					if(part=str[i]) str[i] = sep ? branch(part,sep) : resolve(part);
			}return str;
		};
*/	

			fire	: (function(){
				
				const	createEvent = document.createEvent
					? function(signal){var e = document.createEvent('Event'); e.initEvent(signal, true, true); return e}
					: function(signal){return new window.Event(signal)};
					
				return	document.dispatchEvent ? function(signal){document.dispatchEvent(createEvent(signal))} :
					document.fireEvent ? function(signal){
						var e=
						document.fireEvent(signal);
					} :
					function(signal){console.warn("Failed to fire event: "+signal)}
			})()
	

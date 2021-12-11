export const

dap	= window["https://dap.js.org/"],
tsv	= txt => txt.split(/\n/g).filter(s=>s).map(str=>str.split(/\t/g)), // Tab-separated values
options = txt => tsv(txt).map( ([value,title])=>({value,title}) ),
grab	= src	=> [...(src.parentNode.removeChild(src)).children].reduce((a,n)=>{if(n.id)a[n.id]=src.removeChild(n); return a},{}),
html	= grab(document.getElementById("data")),

pwa	= {
	
	operate:{
		
		focus	:(value,alias,node)=>{
				if(alias)
					value&&scrollfocus(node,alias);
				else{
					const a=document.getElementById(value);
					a&&a.scrollIntoView();
				}
			}
		
	},

	convert:{
		
		share : data => navigator.share && navigator.share(data) && true,
		
		state	: (value,r) => {
				const present = r && location.href.split("#!")[1];
				if(value==null) return present && Object.fromEntries(new URLSearchParams(present));					
				if(value!=present) return history.pushState(null,null,"#!"+value)
			}
	}	
};
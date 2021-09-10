let	x=null,y=null,toFocus=null;

const scrollOptions={behavior:"smooth",inline:"end"},

	stopped = e=> y==(y=window.scrollY) && x==(x=window.scrollX),

	scrollEnd = e=>{
		if(!toFocus)
			return;
		if(stopped(e)){
			toFocus.focus();
			toFocus=null;
		}
		else setTimeout(scrollEnd,100);
	},

	
	upTo = (elem,tag) => 
		!elem ? null : elem.nodeName==tag ? elem : upTo(elem.parentNode,tag);
	
export default (target,scrollToTag) => {
	if(toFocus)return;
	toFocus=target;
	setTimeout( _=>{
		const scrolltgt = scrollToTag ? upTo(target,scrollToTag) || target : null;
		if(scrolltgt)scrolltgt.scrollIntoView(scrollOptions);
		if(target.focus)setTimeout(scrollEnd,100);
	},0);
}


/*
let page=0;

scrolldiscreet(e){
	if(!stopped())return;
	
		if(page!=(page = book.offsetParent.offsetWidth/window.scrollX))
			book.children[page].scrollIntoView(scrollOptions);
	}
}
*/
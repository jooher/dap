Drag =(()=>{

	let
	dragged	= null;


	const
	
	listen	= (el,ev,h)=>el.addEventListener(ev,h),
	
	types	={
	
		reorder	:{
		
			dragstart: e=>{
				dragged = e.target;
				dragged.style.opacity=.5;
			},
		
			dragenter: e=>{
				const entered=e.target;
				if(entered.parentNode!=dragged.parentNode)
					return;
				if(dragged!=entered)
					entered.parentNode.insertBefore(dragged,entered);
				e.stopPropagation();
			},
			
			dragover: e=>{
				if(dragged.parentNode == e.target.parentNode)
					e.preventDefault();
			},
			
			dragend: e=>{
				dragged.style.opacity=1;
				dap.Execute.u(dragged.parentNode,'reorder');
			}
		}
	
	};
	
	
	return	(value,alias,node)=>{
		const	evs=types[alias];
		node.draggable=true;
		if(evs){
			for(let e in evs)
				listen(node,e,evs[e]);
		}
		else
			console.error("unknown drag type: "+alias);
	}

})()
;
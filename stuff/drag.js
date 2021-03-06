export default css=>{

	let
	dragged	= null,
	wasOutside = null;


	const
	dragClass = css.drag || "drag",
	dragOutClass = css.dragOut || "dragOut",
	
	listen	= (el,ev,h)=>el.addEventListener(ev,h),
	
	types	={
	
		reorder	:{
		
			dragstart: e=>{
				dragged = e.target;
				dragged.classList.add(dragClass);
			},
		
			dragenter: e=>{
				
				const
					entered=e.target,
					within=entered.parentNode==dragged.parentNode;
					
				if(dragged!=entered){
					
					if(within!=wasWithin)
						dragged.classList.toggle(dragOutClass,!(wasWithin=within));
						
					if(within)
						entered.parentNode.insertBefore(dragged,entered);
						
				}
					
				e.stopPropagation();
			},
			
			dragover: e=>{
				if(dragged.parentNode == e.target.parentNode)
					e.preventDefault();
			},
			
			dragend: e=>{
				dragged.classList.remove(dragClass);
				dap.Execute.u(dragged.parentNode,'reorder');
			}
		}
	
	};
	
	
	return	(value,alias,node)=>{
		const	evs=types[alias];
		node.draggable=true;
		if(evs){
			for(const e in evs)
				listen(node,e,evs[e]);
		}
		else
			console.error("unknown drag type: "+alias);
	}

};
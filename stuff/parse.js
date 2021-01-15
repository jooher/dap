export const

untab	= source=>{
	
	const
		stack =[],
		tab = /;\s+/g,
		lines = source.split(/[\r\n]+/g);
		
	let
		rows=[],
		last=[];
		
	lines.forEach(line=>{
		
		if(!line)
			return;
			
		const
			prep	= /^(\s*)(.*)/.exec(line),
			pads	= prep[1].length,
			tabs	= prep[2].split(tab);
			
		tabs.unshift(null);
			
		if(pads>stack.length){
			stack.push(rows);
			rows=last[0]=[];
		}
		
		while(pads<stack.length)
			rows=stack.pop();
			
		rows.push(tabs);
		last=tabs;
	});
	
	return stack[0];
};
export default(proto,bars)=>{

	const
		width = proto.clientWidth,
		painted = proto.appendChild(proto.cloneNode(false)),
	
		setvalue= (n,value)=>{
			n.firstChild.style.width = Math.floor(100*value/bars)+"%";
			n.value=value;
		},
		
		onclick	= e=>{
			const
				ex	=e.offsetX,
				n	=e.target,
				nw	=n.clientWidth,
				r	=ex/nw,
				value	=bars ? Math.ceil(r*bars) : r;
				
			setvalue(n,value);
		},

		starbar	= (value,enabled)=>{
			const	n=proto.cloneNode(true);
			if(enabled)n.addEventListener("click",onclick);
			setvalue(n,value);
			return n;
		}
		
	return	{
		disabled: value=>starbar(value),
		enabled	: value=>starbar(value,true)
	}
}
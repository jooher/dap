const tabxtract=table=>{
	const
		thead=table.firstElementChild,
		scheme=[...thead.firstElementChild.children].map(th=>th.getAttribute("name")),
		data=[...thead.nextElementSibling.children].map(tr=>[...tr.children].map(td=>td.textContent)),
		rows=data.map(row=>row.reduce((out,value,i)=>(out[scheme[i]]=value,out),{}));
	return rows;
}
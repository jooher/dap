const

html2rset = scheme => elems => elems
	.map(row=>[...row.children].map(cell=>cell.textContent))
	.map(row=>row.reduce((out,value,i)=>(out[scheme[i]]=value,out),{}))
,

rset2csv = scheme => rset => rset
	.map(row => scheme
		.map(key=>row[key]).join("\t")
	).join("\n")

;
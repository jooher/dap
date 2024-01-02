export default ( items => ({
	"!"	:(item,r)=> r && items.delete(item) ? false : !!items.add(item),
	"?"	:(item,r)=> r && items.has(item),
	all	:(_,r)=> r && [...items.keys()],	
	size	:(_,r)=> r && items.size,
	clear	:(_,r)=> r && items.clear()
}))(new Set())
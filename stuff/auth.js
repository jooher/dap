const	//url = "https://orders.saxmute.one/",
	auth = user => (headers.authorization = user ? 'Token '+user.token : "" ) && user,
	save = user => localStorage.setItem("user",JSON.stringify(user))||auth(user),
	make = _=> fetch(url).then(req => req.ok && req.json()).then(save),
	load = _=> auth(JSON.parse(localStorage.getItem("user"))),
	quit = _=> auth(localStorage.removeItem("user"))&&null;

export default headers => ({ convert:{ save, make, load, quit } })
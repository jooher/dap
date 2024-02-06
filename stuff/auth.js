const auth = user => (headers.authorization = user ? 'Token '+user.token : "" ) && user;

export default headers => ({
	
	save: user => localStorage.setItem("user",JSON.stringify(user))||auth(user),
	load: _=> auth(JSON.parse(localStorage.getItem("user"))),
	quit: _=> auth(localStorage.removeItem("user"))&&null
	
})
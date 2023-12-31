function Route(url,seed){
	this.match = url.replace(/\//g,"\/").replace(/:\w+/g,"([^\/]*)");
	this.params = url.match(/(?<=:)\w+/g);
	this.seed = seed;
}

Route.prototype.fit=function(str){
	const match = str.match(this.match);
	if(match){
		match.shift();
		return Object.assign({}, this.seed, ...match.map((v,i)=>({[this.params[i]]:v})));
	}
}

export default function(urls){
	const routes = Object.entries(urls).map( ([match,seed]) => new Route(match,seed) );
	return hashstr => {
		hashstr=hashstr.replace(/^#\/*/,"");
		for(const route of routes){
			const p=route.fit(hashstr);
			if(p)return p;
		}
	}
}

/*
urls={
	"tag/:tag"		: {page:""},
	"article/:slug"	: {page:"article"},
	"editor/:slug"	: {page:"editor",slug:""},
	"@:username"	: {page:"profile"},
	"@:username/:feed": {page:"profile"},
	":page"		: {}
}
*/
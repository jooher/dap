import "//dap.js.org/0.5.2.js";
import "//cdn.jsdelivr.net/npm/marked/marked.min.js"; // const marked
import dict from "./dict.dap.js";
import components from "./components.dap.js";
import router from "./route.js";
import authorizer from "./auth.js";
import modal from "./modal.js";

const

	api = "//conduit.productionready.io/api/", //https:
	
	
	headers = {
		"Content-Type": "application/json",
		"charset":"utf-8"
	},
	
	auth = authorizer(headers),
	
	route = values => values.reverse().join("/")
		.replace(/\/&/g,"?")
		.replace(/@\//g,"@"),
	
	parseRoute = router(
		["tag/:tag", {page:""}],
		["article/:slug", {page:"article"}],
		["editor/:slug", {page:"editor",slug:""}],
		["@:username", {page:"profile"}],
		["@:username/:feed", {page:"profile"}],
		[":page",{}]
	),
	
	dictFromHtmlElements = elems =>
		Object.assign({}, ...elems.map(el=>({[el.id||el.tagName]:el}))),
		
	grabFormInputs = form =>
		Object.assign({}, ...[...form.elements].map( el => el.name&&{[el.name]:el.value})),
		
	
	state = "& :parseRoute; $page=. $tag=. $slug=.; "
	
	;

	
'APP.conduit'.d( state + "$user=:auth.load" //; u! @HASHCHANGE

	,'ROOF'.d(""
	
		,'A.logo href=#'.d()
		
		,'NAV'
			.d("? $user"
				,'A icon=create href=#/editor/ `Create article'.d("!? ($page `editor)eq@selected")
				,'A icon=settings href=#/settings `Settings'.d("!? ($page `settings)eq@selected")
				,'A'.d("!! $user.username@ (`@ $user.username)nav@href")
			)
			.d("? $user:!"
				,'action icon=person `Sign In'.ui("$user=LoginModal():wait")
			)
	)
	
	,'PAGE.home'
	///
	.d("? $page:!; ! html.HEADER; Tags( (`tags)api:query@. )"
	
		,'feed-toggle'.d(""
			,'A `Your feed'.d("? .username; !! (`@ .username `feed)nav@href")
			,'A href=# `Global feed'.d()
		)

		,'matching'.d("Articles( .feed ($tag)uri@criteria )")

	)

	,'PAGE.article'
	/// article.
	.d("?? $page@article; ? $!=(`articles $slug)api:query; u!"
		,'HEADER'.d("! Title Meta")//
		,"! Body Meta Comments"
	)
	.u("& $!.article@ (.author.username $user.username)eq@own")

	,'PAGE.profile'
	/// user.
	.d("?? $page@profile; ? $!=(`profiles .username)api:query; *@ $!.profile"

		,'HEADER'.d("! UserInfo")
		
		,'feed'.d("$toggle=`my $criteria=(.username@author)uri"

			,'articles-toggle'.d("* toggle :split`my,favorited"
				,'A	`My articles'.d("!! (`@ .username)nav@href")
				,'A `Favorites'.d("!! (`@ .username `favorites)nav@href")
				.d("!? .toggle@; a")
				.a("!? (.toggle $toggle)eq@selected")
				.ui("$criteria=")
			)
			
			,"Articles( (.favorites:? (.username@author)uri (.username@favorited)uri )?!@criteria )"
		)

	)

	,'PAGE.editor'
	/// user
	.d("?? $page@editor; ? $!=$slug:! $!=(`articles $slug)api:query; *@ $!.article ()"
		,'FORM'.d(""
			,'INPUT name=title type=text placeholder="Article Title"'.d("#.value=.title")
			,'INPUT name=description type=text placeholder="What is this article about?"'.d("#.value=.description")
			,'TEXTAREA name=body rows=8 placeholder="Write your article (in markdown)"'.d("#.value=.body")
			,'tags'.d("$tagList=."
				,'INPUT type=text placeholder="Enter tags"'.d("#.value=$tagList:tags2str").ui(".tagList=$tagList=#.value:str2tags")
				,"Tags($tagList@tags)"
			)
			,'BUTTON `Publish article'.d("? $slug:!").ui("(((#.form:grab@. .tagList)@article)@POST `articles)api:query $page=")
			,'BUTTON `Save changes'.d("? $slug").ui("(((#.form:grab@. .tagList)@article)@PUT `articles .slug)api:query $page=")
		)
	)

	,'PAGE.settings'
	.d("?? $page@settings"
		,'H1 `My settings'.d()
		,'FORM'.d(""
			,'INPUT name=image type=text placeholder="URL of profile picture"'.d()
			,'INPUT name=username type=text placeholder="Your Name"'.d()
			,'TEXTAREA name=bio rows=8 placeholder="Short bio about you"'.d()
			,'INPUT name=email type=text placeholder="Email"'.d()
			,'INPUT name=password type=password placeholder="Password"'.d()
			,'BUTTON `Update'.ui("(((#.form:grab)@user)@POST `article)api:query")
		)
		,'BUTTON.logout `Logout'.ui("$user=$user:auth.quit $page=")
	)

).e('HASHCHANGE', state)//"& :parseRoute; $page=. $tag=. $slug=."

.DICT(
	dict,
	components,
	{ html : dictFromHtmlElements([...document.getElementById("html").children]) }
)

.FUNC({
	flatten:{
		nav: values => "#/"+route(values),
		api: (values,names) => {
			const
				method = names[names.length-1],
				payload = method && values.pop(),
				body = payload && JSON.stringify(payload),
				url = api+route(values);
			return {method,headers,url,body,error:null};
		}
	},
	convert:{
		
		JSON,
		auth,
		marked,
		
		storage:{
			load: key => JSON.parse(localStorage.getItem(key)),
			save: (k,v) => localStorage.setItem(k,JSON.stringify(v))
		},
		
		
		split: str=>str.split(","),
		date: utc => new Date(utc).toDateString(),
		brackets: txt => '('+txt+')',
		
		grab: grabFormInputs,
		
		anew: data=>!data&&[{}],
		
		str2tags: str=>str&&str.split(" "),
		tags2str: tags=>tags&&tags.join(" "),
		
		pages: $ => Array .from({length:Math.ceil($.pagesCount/$.limit)}) .map(num=>({num,offset:num*$.limit})),
		
		parseRoute: (dummy,r) => r && parseRoute(location.hash)
		
	}
})

.FUNC(modal)

.COMPILE()
.RENDER();
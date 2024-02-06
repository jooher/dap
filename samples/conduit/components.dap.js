export default{
	
 Articles
/// feed criteria
	:'articles'
	.d("? $!=(`articles .criteria )api:query; * $!.articles@" // .feed
		,'preview'.d("! Info"
			,'BUTTON icon=favorite'
				.d("$!=; $!; !? .favorited; ! .favoritesCount")
				.ui("? $!=(.favorited (@DELETE `articles .slug `favorite)api (@POST `articles .slug `favorite)api )?!:query; & $!.article@")
			,'A.preview-link'.d("! Title Description; Tags(.tagList@tags); !! (`article .slug)nav@href")
		)
	)
	.d("? .articlesCount"
		,'NAV.pagination'.d("* (.articlesCount $limit):pages"
			,'page-num'.d("! .num").ui(".criteria.offset=. $!=")
		)
	)

,Title
	:'H2'.d("! .title")

,Description
	:'description'.d("! .description")

,Body
	:'body'.d("# .body:marked@innerHTML")
	
,Tags
	// tags
	:'tags'.d("* .tags@tag"
		,'A.tag'.d("!! .tag@ (`tag .tag)nav@href")
	)

,Info
/// author createdAt
	:'info'.d(""
		,'A.userimg'.d("!! .author.image@href"
			,'IMG'.d("!! .author.image@src")
		)
		,'A.username'.d("!! .author.username@ (`@ .author.username)nav@href")
		,'date'.d("! .createdAt:date")
	)
	
,Meta
/// author createdAt
	:'meta'
	.d("$!; ! Info (.own Actions.Author Actions.Reader)?!")//
	.u("&? $!.article@ $!.profile@author; ?")//

,Actions:{
	
	Author
		:'actions'.d(""
			,'A icon=edit `Edit'.d("!! (`editor .slug)nav@href")
			,'BUTTON icon=delete `Delete'.ui("( @DELETE `articles .slug)api:query")
		)
	
	,Reader
		:'actions'.d("! Favorite; Follow( .author@. )"
		)
	
}	
	
,Favorite
/// $!
	:'BUTTON icon=favorite `Favorite article '
		.d("!? .favorited; ! .favoritesCount:brackets")//$$meta;
		.ui("? $!=(.favorited (@DELETE `articles .slug `favorite)api (@POST `articles .slug `favorite)api )?!:query")
	
,UserInfo
/// profile.
	:'user-info'.d(""
		,'IMG.user'.d("!! .image@src")
		,'H4'.d("! .username")
		,'bio'.d("! .bio")
		,"! Follow"
	)

,Follow
/// profile.
	:'BUTTON icon=add'
		.d("! ((.following `Unfollow `Follow)?! .username)spaced")
		.ui("? $!=(.following (@DELETE `profiles .username `follow)api (@POST `profiles .username `follow)api )?!:query")//

,Comments
/// user slug
	:'comments'.d("$append="

		,'FORM.comment'.d("$body="
			,'TEXTAREA rows=3 placeholder="Write a comment..."'.d("! $body").ui("$body=#:value")
			,'IMG.user'.d("!! .user.image@src")
			,'BUTTON `Post comment'
			.ui("? $body dict.error.emptyComment:alert; ? $user $user=LoginModal():wait; $append=( (($body)@comment)@POST `articles .slug `comments )api:query $body=")
		)

		,'comments'
			.d("$append; ? $!=(`articles .slug `comments)api:query; *@ $!.comments; ! Comment")
			.a("Comment($append.comment@.)")

	)

,Comment
	:'comment'.d("! Body Info")
	
,Login
	:'login'.d("$!= $have-account=:!"
		,'FORM'.d(""
		
			,'INPUT name=email type=email placeholder="Your Email"'.d()
			,'UL.hints'.d("*@hint $!.error.errors.username"
				,'LI'.d("! .hint")
			)
			
			,'INPUT name=password type=password placeholder="Password"'.d()
			,'UL.hints'.d("*@hint $!.error.errors.password"
				,'LI'.d("! .hint")
			)
			
			,'signin'.d("? $have-account"
				,'BUTTON `Sign in'.ui("$!=( (#.form:grab@user)@POST `users `login)api:query")
				,'switch `Need an account?'.ui("$have-account=; ?")
			)
			
			,'signup'.d("? $have-account:!"
				,'INPUT name=username type=text placeholder="Your Name"'.d()
				,'BUTTON `Sign up'.ui("$!=( (#.form:grab@user)@POST `users)api:query")
				,'switch `Have an account?'.ui("$have-account=:!; ?")
			)
			
		).u("? $!:! $!.user:auth.save")
		
		,'errors'.d("? $!.error; ! $!.error.errors:JSON.stringify")
	).u("value $!.user")
	
,LoginModal
	: 'modal'.d("top; $!="
		,'scrim'.ui("$!=")
		,'dialog'.d("! Login")
	).u("kill; ?")
	
}
'talks'.d("! (.msg:# Entry@+ Ties@-)case; ! ")

//.NS("https://dap.js.org/stuff/talks.js")

.DICT({
	base	:'https://dapmx.org/samples/helloforum/helloforum.php?',
	redir	:'https://dapmx.org/samples/helloforum/?',
	grecaptcha : 'https://www.google.com/recaptcha/api.js?render=6LddyYcUAAAAAPjIc5NfDuqasxeEijxrFGGZbPoC',

	Entry	:'msg'.d("$!!=; * (base@ `read.msg .msg)uri:query"
			,'body'.d("!! .body:safe,rich@")
			,'reply'.d("$?="
				,'action'.d("? $?:!; ! dict.reply").ui("$?=$?:!")
				,'input'.d("? $?; $author= $head= $body="
					,'grecaptcha'.d("? .grecaptcha:!; ! .grecaptcha=grecaptcha:script")
					,'message'.d(""
						,'author contenteditable'.d("!! dict.author@label").ui("$author=#:value")
						,'H3.head contenteditable'.d("!! dict.head@label").ui("$head=#:value")
						,'body contenteditable'.d("!! dict.body@label").ui("$body=#:text")
					).u("?")
					,'BUTTON.send'
						.d("! dict.send")
						.ui("? ($author $head $body)! (dict.incomplete)alert; ? .g-recaptcha-response=(@action`sendmessage):grc (dict.badcaptcha)alert; ? $!!=( (base@ `write.msg .msg@tie)uri $author $head $body .g-recaptcha-response)post:query (dict.error)alert")
				).u("$?=")
			).u("?")
			,'ties'.d("$!!; ! Ties")
		),
		
	Ties	:'ties'.d("* (base@ `read.ties .msg)uri:query"
			,'tie'.d("$?="
				,'H3.head'.d("! .head").ui("$?=$?:!")
				,'author'.d("! .author")
				,'date'.d("! .date")
				,'A.msg target="_blank"'.d("! .msg; !! (redir@ .msg)uri@href")
				,'open'.d("? $?; ! Entry")
			)
		),
		
	dict	:{
		reply	:"Reply to this",
		author	:"Your name",
		head	:"Message head",
		body	:"Message body",
		send	:"Send",
		
		incomplete: "Please, fill in all fields:\nyour name, message head and message body",
		badcaptcha: "Google reCAPTCHA thinks you're bot, sorry",
		error	: "Server communication error"
		}
})

.FUNC({
	convert	:{
		safe	:html=>html.replace(/<.+?>/,''),
		rich	:html=>html
			.replace(/(http\S*:\/\/\S+)/gi, "<a href='$1' target='_blank'>$1</a>")
			.replace(/\[(\S+?)\](.*?)\[\/\1\]/gi, "<span class='$1'>$2</span>"),
			
		grc	:action=>dap.Async( grecaptcha.execute('6LddyYcUAAAAAPjIc5NfDuqasxeEijxrFGGZbPoC',action), "grecaptcha execute")
	}
})
.RENDER();
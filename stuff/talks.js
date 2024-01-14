import {JsonHttpAPI} from "BasicSnippets";

import 'https://www.google.com/recaptcha/api.js';
const grc = (action,r) => r && grecaptcha && grecaptcha.execute("6LddyYcUAAAAAPjIc5NfDuqasxeEijxrFGGZbPoC"),

	dict	:{
		reply	:"Reply to this",
		author:"Your name",
		head	:"Message head",
		body	:"Message body",
		send	:"Send",
		
		incomplete: "Please, fill in all fields:\nyour name, message head and message body",
		badcaptcha: "Google reCAPTCHA thinks you're bot, sorry",
		error	: "Server communication error"
	};



'talks'.d("! (.msg@ Entry Ties)?!")

.DICT({
	
	dict,
	
	redir	:'/samples/helloforum.html?',

	Entry	:'msg'.d("$!!=; * (`read.msg .msg):api"
			,'body'.d("!! .body:safe,rich@")
			,'reply'.d("$?="
				,`action '${dict.reply}`.d("? $?:!").ui("$?=$?:!")
				,'input'.d("? $?; $author= $head= $body="
					,'message'.d(""
						,`author contenteditable label="${dict.author}"`.ui("$author=#:value")
						,`H3.head contenteditable label="${dict.head}"`.ui("$head=#:value")
						,`body contenteditable label="${dict.body}"`.ui("$body=#:text")
					).u("?")
					,`BUTTON.send '${dict.send}`
						.ui(`	? ($author $head $body)! dict.incomplete:alert;
							? .g-recaptcha-response=():grc dict.badcaptcha:alert;
							? $!!=("write.msg .msg@tie $author $head $body .g-recaptcha-response):api dict.error:alert;
						`)
				).u("$?=")
			).u("?")
			,'ties'.d("$!!; ! Ties")
		),
		
	Ties	:'ties'.d("* (`read.ties .msg):api"
			,'tie'.d("$?="
				,'H3.head'.d("! .head").ui("$?=$?:!")
				,'author'.d("! .author")
				,'date'.d("! .date")
				,'A.msg target=_blank'.d("!! .msg@ (redir@ .msg)uri@href")
				,'open'.d("? $?; ! Entry")
			)
		)
		
})

.FUNC({
	convert	:{
		grc,
		
		api	:JsonHttpAPI('https://dapmx.org/samples/helloforum/helloforum.php?'),
)
		safe	:html=>html.replace(/<.+?>/,''),
		rich	:html=>html
			.replace(/(http\S*:\/\/\S+)/gi, "<a href='$1' target='_blank'>$1</a>")
			.replace(/\[(\S+?)\](.*?)\[\/\1\]/gi, "<span class='$1'>$2</span>"),
			
		
	}
})
.RENDER();
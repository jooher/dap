const
el = id=>document.getElementById(id),
edit= x=> x.d("! ."+x+"; !! $contenteditable").e("input","$dirty=:! ."+x+"=#.textContent"),

shop = dict=>
		
	'shop'.d("$cart= $amount= $showcart= $dirty= $contenteditable="

		,'info `Мой заказ: ₽ '.d("? $amount; ! $amount").ui("$showcart=$showcart:!")
			
		,'SECTION.cart'.d("? $showcart; Items( $cart@items ) #:scroll"
			,'hidecart `Продолжить покупки'.d("? $showcart").ui("$showcart=")
			,"! kassa"
		)
		
		,'SECTION.catalog'.d("? $showcart:!; $items=items $tag=" // $filter= $order=
			,'specify'.d("*@ tags"
				,'scope'.d("!! .0@label; * .1@tag"
					,'tag'.d("! .tag").ui("log $tag=.").a("!? ($tag .tag)eq@selected")
				).u("$items=(items $tag):select")
			)
			,'offer'.d("Items( $items )")
		)
		
		,'SECTION.admin'.d("$collect="
			,'BUTTON `Edit'.d("? $dirty:!").ui("$contenteditable=$contenteditable:!")
			,'BUTTON `Done'.d("? $dirty:?").ui("$collect=(items collect)apply")
			,'A.collect `Save .csv'.d("? $collect; #.href=$collect:csvblob #.download=saveas")
		)

	)

	.FUNC({
		convert:{
			title:str=>str.replace(/\s+"/g,'\n"'),
			words:str=>str.split(" "),
			
			select:$=>{
				const
					tag = $.tag.toLowerCase(),
					items = tag ? $.items.filter(  item =>
						item.tags &&
						item.tags.indexOf(tag)>-1
					) : $.items;
				return items;
			},
			
			scroll:((el,scroll)=>(node,r)=>r&&setTimeout(_=>el.scrollIntoView(scroll),100))(document.body,{behavior:"smooth",inline:"start"}),
			
			count:cart=>cart&&cart.length,
			amount: cart=>cart&&cart.reduce((a,r)=>a+(r.qty*r.price)||0,0),
			
			cssbg: url=>"background-image:url('"+url.toLowerCase()+"')",
			
			csvblob: data => window.URL.createObjectURL( new Blob([data], {type: 'text/csv'}) )
			
		},
		flatten:{
			add: values=>(values.pop()||[]).concat(values.reverse()),
			apply: values=>values.reduce((a,c)=>c(a),values.pop())
		}
	})
	
	.DICT({
		
		Items
		:'items'.d("*@ .items"
			,'place'.d(""
				,'item'.d(""
					,'title'.d("! .title:title")
					,'subtitle'.d("! .subtitle")
					,'qty'.d("$incart=.qty:+?"
						,edit('size')
						,edit('price')
						,'BUTTON.add'.d("? $incart:!").ui(".qty=`1 $amount=$cart:amount=($cart $)add")
						,'INPUT type=number min=1 step=1'.d("? $incart; !! .qty@value").ui(".qty=#:value $amount=$cart:amount")
					).u("$incart=.qty:+?")
					,'details'.d("!! (`img/ (.title .subtitle)spaced `.jpg)concat:cssbg@style"
						,'hints'.d(""
							,edit('tags1')
							,edit('tags2')
						)
						,'desc'.d(""
							,edit('pros')
							,edit('cons')						
						)
					)
				)
			)
		),
/*		
		Items
		:'items'.d("*@ .items"
			,'place'.d(""
				,'item'.d("!! (`img/ (.title .subtitle)spaced `.jpg)concat:cssbg@style"
					,'title'.d("! .title:title")
					,'subtitle'.d("! .subtitle")
					,'qty'.d("$incart=.qty:+?"
						,'size'.d("! .size")
						,'price'.d("! .price")
						,'BUTTON.add'.d("? $incart:!").ui(".qty=`1 $amount=$cart:amount=($cart $)add")
						,'INPUT type=number min=1 step=1'.d("? $incart; !! .qty@value").ui(".qty=#:value $amount=$cart:amount")
					).u("$incart=.qty:+?")
					,'desc'.d("! .desc"
						,'pros'.d("! .pros; !! $contenteditable").e("input","log .pros=#.textContent")
						,'cons'.d("! .cons; !! $contenteditable").e("input","log .cons=#.textContent")
						
					)
				)
			)
		),
*/
		
		Bricks
		:'bricks'.d("* .bricks:words@brick"
			,'brick'.d("! .brick")
		)
		
		
	})

	.DICT(dict) // {items,tags,kassa}
	.RENDER();
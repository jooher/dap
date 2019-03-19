const	Shared	=(item,key,sort)=>{ // keeps the data coherent among several tabs
	var	data	= null,
		storage	= localStorage;
		
	return {
	
		sync	:function(entry){
			try{
				data=Json.decode(storage.getItem(item));
				if(data.constructor!=Object)data=null;
			}catch(e){};
			
			if(entry)(data||(data={}))[entry[key]]=entry;
			
			if(!data)return;

			try{storage.setItem(item,Json.encode(data));}catch(e){};
			
			var arr=[];
			for(var i in data)arr.push(data[i]);
			return sort?arr.sort(sort):arr;
		},
		
		find	:function(entry){return data&&data[entry[key]]},
		
		clear	:function(){storage.setItem(item,null); return null;}
	}
};


'rockauto'
.a("state ( $make $year $model $carcode $engine $parttype )uri")
.d("$make=. $year=. $model=. $carcode=. $engine=. $parttype=. $parttypename=.; $carname=( .year .make .model .engine )spaced $cart=:cart.sync $cars=:cars.sync" //
	,'caption'.d("! `Rockauto.com")
	,'cart'.d("? $cart"
		,'action.clear'.d("! dict.cart.clear").ui("? (dict.cart.confirmclear)confirm; $cart=:cart.clear")
		,'TABLE'.d(""
			,'TBODY'.d(".carcode=; *@ $cart"
				,'TR.cartitem'.d("?! .qty@0"
					,'TD'.d(""
						,'carname'.d("? (.carcode ..carcode)ne; ! .carname; ..carcode=.carcode").ui("$carname=. $carcode=.")
						,'partname'.d("! (.parttypename `/ .side `/ .note)spaced")//; !! @title
					)
					,'TD'.d("! (.catalogname .partnumber)spaced")
					,'TD.num'.d("! .price")
					,'TD.num.qty'.d("! Qty")
				)
			)
		)
	)
	,'orderbar'.d("? $totals=$cart:totals"
		,'price.totals'.d("! (dict.cart.totals $totals@)%")
		,'button.order'.d("! dict.cart.order").ui("")
	)
	,'setcar'.d(""
		,'mycars'.d("*@ $cars"
			,'carname'.d("! .carname").ui("$carname=. $carcode=. $year=. $make=. $model=. $engine=.")
		)
		,'findcar'.d(""
			,'year-make'.d(""			
				,'SELECT.year'.ui("$year=#:value").d("Options(years.label years.options $year@selected)")
				,'SELECT.make'.ui("$make=#:value").d("Options(makes.label makes.options $make@selected)")
			).u("$carcode= $carname= $model=")

			,'SELECT.model'.ui("$model=#:value $carcode= $carname=")
			.d("? ($year $make)!; ? .models:??=( base@ $make $year )uri:query (error.no-models)alert; "
			  +"Options(models@label .models@options $model@selected)")
			
			,'SELECT.engine'.ui("$carcode=#:value .!=(.engines $carcode)find $carname=( $year $make $model $engine=.!.engine )space")
			.d("? $model; ? .engines:??=( base@ $make $year $model )uri:query (error.no-engines)alert; "
			  +"Options(engines@label .engines@options $carcode@selected)")
		)
	)
	,'H1.carname'.d("? $carcode; ! $carname"
		,'button.addtomycars'.d("$cars; ? ($carcode):cars.find,!")
		.ui("$cars=($carname $carcode $year $make $model $engine):cars.sync")
	)
	,'part'.d("? $carcode; $group=."
		,'UL'.d("*@groupname (base@ $carcode)uri:QUERY"
			,'LI'.d("$?="
				,'title'.d("! .groupname").ui("$?=$?:!").a("!? $?@selected")
				,'UL'.d("? $?; * (base@ .groupname $carcode )uri:QUERY"
					,'LI'.a("!? $?@selected").d("$?="
						,'title'.d("! .parttypename; !! .parttypeinfo@title").ui("$?=$?:!")
						,'offers'.d("? $?"
							,'info'.d("! .parttypeinfo")	
							,'stock'.d("* (base@ $carcode .parttype)uri:QUERY"
								,'offer'.u("?").a("!? $?@hilit").d("$?="//
									,'short'.d(""
										,'IMG.thumb'.d("? .pics=.pics:json.decode; ? .pics.Thumb; !! (pics .pics.Thumb)concat@src" )
										// "partkey":["8878448"],"warehouse":["44148"],"whpartnum":["AC 47AGM"],"catalogname":["ACDELCO"],"partnumber":["47AGM"],"pics":	
										,'catpn'.d("! (.catalogname .partnumber)space")
										,'alter'.d("! .alter")
										,'note'.d("! .note")
										,'side'.d("! .side")
									).ui("$?=$?:!")
									,'moreinfo'.d("? $?"
										,'IMG.popup'.d("!! (pics .pics.Popup)concat@src")
										,'detailed'.d("* (base@ .partkey)uri:QUERY"
											,'note'.d("! .logo")
											,'side'.d("! .desc")
											,'alter'.d("! .text")
										)
									)
									,'price'.d("! .price:format.num=.price:price")//:rightprice,
									,'action'.d("$cart $picked=$:cart.find"
										,'incart'.d("*@ $picked; ! dict.incart; ! Qty")
										,'addtocart'.d("?:! $picked; ! dict.addtocart")
										.ui("$cart=($ $carname $carcode ..parttypename @qty`1 ):cart.sync")
									).u("?")
								)
							)
						)
					)
				)
			)
		)
	)
	,'intro'.d("?:! ($carcode $parttype)!; ! dict.intro")
)
.DICT({
	base	:"/apps/rockauto/transfer.php?", //
	pics	:"http://rockauto.com/",
	makes	: {
			label	:"Car make",
			options	:"Abarth; AC; Acura; Alfa Romeo; Allard; Allstate; Alpine; Alvis; AM General; American Austin; American Bantam; American Motors; Amphicar; Apollo; Armstrong-Siddeley; Arnolt-Bristol; Arnolt-MG; Aston Martin; Asuna; Auburn; Audi; Austin; Austin-Healey; Avanti; Baic; Bentley; Berkeley; Bizzarrini; BMW; Bond; Borgward; Bricklin; Bristol; Bugatti; Buick; Cadillac; Case; Chandler; Checker; Chevrolet; Chrysler; Cisitalia; Citroen; Coda; Cole; Cord; Crosley; Cunningham; Daewoo; DAF; Daihatsu; Daimler; Datsun; Delahaye; Dellow; Delorean; Denzel; Desoto; Detomaso; Deutsch-Bonnet; Diana; DKW; Dodge; Du Pont; Dual-Ghia; Duesenberg; Durant; Eagle; Edsel; Elcar; Elva; Erskine; Essex; Excalibur; Facel Vega; Fairthorpe; Falcon Knight; Fargo; FAW; Ferrari; Fiat; Fisker; Flint; Ford; Foton; Franklin; Frazer Nash; Freightliner; Gardner; Genesis; Geo; Giant Motors; Glas; GMC; Goliath; Gordon-Keeble; Graham; Graham-Paige; Griffith; Healey; Henry J; Hillman; Hino; Honda; Hotchkiss; HRG; Hudson; Humber; Hummer; Hupmobile; Hyundai; Infiniti; International; ISO; Isuzu; Iveco; Jaguar; Jeep; Jensen; Jewett; Jordan; Jowett; Kaiser-Frazer; Kenworth; Kia; Kissel; Kurtis; Lada; Laforza; Lamborghini; Lanchester; Lancia; Land Rover; Lasalle; Lea-Francis; Lexington; Lexus; Lincoln; Lotus; Mack; Maico; Marcos; Marmon; Maserati; Mastretta; Matra; Maxwell; Maybach; Mazda; McLaren; Mercedes-Benz; Mercury; Merkur; Messerschmitt; MG; Mini; Mitsubishi; Mitsubishi Fuso; Mobility Ventures; Monteverdi; Moon; Moretti; Morgan; Morris; Moskvich; Nardi; Nash; Nissan; NSU; Oakland; Oldsmobile; Omega; Opel; Osca; Packard; Paige; Panhard; Panoz; Panther; Passport; Peerless; Peterbilt; Peugeot; Pierce-Arrow; Plymouth; Pontiac; Porsche; Qvale; Ram; Reliant; Renault; Reo; Rickenbacker; Riley; Roamer; Rockne; Rolls-Royce; Rover; Saab; Sabra; Saleen; Salmson; Saturn; Scion; Seat; Shelby; Siata; Simca; Singer; Skoda; Smart; SRT; Standard; Star; Stearns Knight; Sterling; Stevens-Duryea; Studebaker; Stutz; Subaru; Sunbeam; Suzuki; Swallow; Tatra; Tesla; Think; Toyota; Triumph; Turner; TVR; UD; Utilimaster; Vam; Vauxhall; Vespa; Volkswagen; Volvo; VPG; Wartburg; Westcott; Whippet; Willys; Windsor; Wolseley; Workhorse; Yellow Cab; Yugo; Zundapp".split("; "),
			//"/samples/carmakes.json",
		},
	years	: {
			label	:"Production year",
			options	:Array.from({length:20},(v,i)=>2019-i)
		},
	dict	:{
			select	:"выберите",
			addtocart	:"добавить в корзину",
			incart		:"выбрано",
			cart	:{
				totals	:"Выбрано {pos} позиций на сумму {amt} USD",
				order	:"оформить заказ",
				clear	:"очистить корзину",
				confirmclear:"Очистить корзину?"
			}
		},

/*
	base	: "https://dapmx.org/stuff/rockauto.php?",
	label	:{
		hint	: "Select a car, please",
		please	: "Please select",
		make	: "Car make",
		year	: "",
		model	: "Model name",
		engine	: "Engine",
		carcode	: "Car code: "
	},
*/		
		
	//Empty	:'OPTION selected disabled'.d("!! @selected`selected @value; ! dict.select"),
	//Option	:'OPTION'.d("! (.label .value)?; !! .value"),
	//State	:'service'.d("( $carcode $make $year $model $engine $type $ptype )urlstate"),
	Qty	:'qty'.d(""
			,'INPUT.qty type=number'.d("#.value=.qty").ui(".qty=#:value")
			,'drop'.ui(".qty=`0")
		).u("$cart=$:cart.sync"),
		
		
	Options	: 'OPTGROUP'.d("Hint(.label); * .options@value; Option( .value $year@selected )"),
	Hint	: 'OPTION selected disabled'.d("! .label"),
	Option	: 'OPTION'.d("!! (.label .value)? .value ((.value .selected)eq `selected)!@selected")

})
.FUNC({
	convert	:{
		time	:dummy	=>Date.now(),
		tidy	:html	=>replaceMulti(html,htmljunk),
		price	:num	=>cents(num),//   {return Math.round(parseFloat(value.substr(1))*1.5)-.01},
		cars	:Shared("cars","carcode"),
		cart	:Shared("cart","partkey",(a,b)=>(a.carcode-b.carcode||a.parttype-b.parttype||a.price-b.price||a.partkey-b.partkey)),
		totals	:cart	=>{
				if(!cart)return;
				var pos=0, qty=0, amt=0, a,q,p;
				for(var i=cart.length;i--;)
					if((a=cart[i])&&(q=parseInt(a.qty))&&(p=parseFloat(a.price)))
						pos++, qty+=q, amt+=q*p;
				return {pos:pos,qty:qty,amt:cents(amt)};
			}
	}
})
.RENDER();
import "/0.5.3.js";
import { auth, api, dictFrom, elemFrom, JsonCSS } from '/stuff/snippets.js';
import Await from '/stuff/await.js';
import {untab} from '/stuff/parse.js';

/*
person, stars, info:json
route, terms:string, stops:text
ride, route, person, seats, date:date, info:json
hike, ride, person, stars, info:json

//vehicle, name, seats, info:json
//rider, person, vehicle, plate:text, stars
*/

JsonCSS('lang/ru.json');

const

headers = new Headers({
	"Content-Type": "application/x-www-form-urlencoded" //"application/json;charset=utf-8"
}),

modal = (...stuff) =>
	"MODAL".d('top'
		,"SCRIM".ui('value')
		,"SHIELD".d(...stuff)//.u('value $')
	).u("kill; ?")
;




"APP".d('$tab= $when=(:today@date :soon@time) $dpt= $arv= $Route= $route= $note= $ride= $rides=; $user=:auth.load $person="1'

	,"ROOF".d(''
		,"GROUP.when".d(''
			,"INPUT type=date".d("!! (.date :today)?@value").ui('$when.date=#.value')
			,"INPUT type=time".d("!! (.time :soon)?@value").ui('$when.time=#.value')
		)
		,"GROUP.where".d(''
			,"select.dpt".d('! $dpt:place').ui('$dpt=Where(dict.dpt@label):wait')
			,"select.arv".d('! $arv:place').ui('$arv=Where(dict.arv@label):wait')
		).u('$route=')
	)

	,"ETAGE".d('$tab= Tabset(:|@tab"rides|hikes|admin)'
	
		,"PAGE.rides".d('?? $tab@rides'
			,"UL".d('* ("ride $route $when.date):api E'
				,"LI".d('! Ride').ui('$ride=.')
			)
			,"BUTTON.seek-rides"
				.d(`	? ($dpt $arv)!`)
				.ui(`	? $route $Route=("route ($dpt $arv):terms@terms):api,first :alert"error; $route=$Route.route;
					? $person $person=Login():wait;
					$hikes=(@PUT"hike $when.date $person $route ($dpt $arv $time $note)@info):api;
				`)//subscribe for rides
		)
		
		,"PAGE.hikes".d('?? $tab@hikes'
			,"UL".d('* ("hike $route $when.date):api E'
				,"LI".d('! Hike')
			)
			,"BUTTON.add-ride"
				.ui(`	? $person $person=Login():wait;
					? $dpt $dpt=Where(@label"dpt):wait;
					? $arv $arv=Where(@label"arv):wait;
					? $route $Route=("route ($dpt $arv):terms@terms):api,first :alert"error; $route=$Route.route;
					? $rides=(@PUT"ride $when.date $person $route ($dpt $arv $when.time $note)@info):api;
					:alert"created
				`)
		)
		
		,"PAGE.admin".d('?? $tab@admin'
			,"FORM `add route".d(''
				,"INPUT name=name placeholder=name".d()
				,"TEXTAREA name=stops placeholder=stops".d()
				,"BUTTON type=submit `Submit".d()
			).ui('? (@PUT"route #:form@.):api :alert`error')
		)
	
	)

)

.DICT({
	E:[],
	
	areas: await fetch("kg.txt").then(r=>r.ok&&r.text()).then(untab),
	
})

.DICT({
	
	Tabset
	:"TABSET".d('* .tab'
		,"TAB".d('!? .tab@; a!')
			.a("!? (.tab $tab)eq@selected")
			.ui('$tab=.')
	).u("?"),
	
	Ask
	:modal('$value='
		,"title".d('! (.title .message)?')
		,"details".d('! .details')
		,"INPUT".d('? .pattern; !! .pattern; focus #')
			.e("blur","$value=#:value; ?") //change 
		,"actions".d(''
			,"ACTION.cancel".ui('$value=')
			,"ACTION.ok".d('! .action')
				.ui('value ($value .action)?')//
				.a("!? (.pattern $value:!)!@disabled")
		)
	).u('value $value'),
	
	Where
	:modal('$area= $place='
		,"label".d('!? .label@')
		//,"recent".d('Areas(:recall@areas"recent)')
		,"regions".d('* areas@areas,area,places'
			,"region".d('$?= $places='
				,"name".d('! .area').ui('? $?=$?:!; $places=.places:|; ?')
				,"details".d('? $?'
					,"areas".d('? .areas; * .areas@areas,area,places'
						,"area".d('! .area')
							.a('!? (.area $area)eq@selected')
							.ui('$area=. $places=.places:|')
					)
					,"places".d('? $places; * $places@place'
						,"place".d('! .place').ui('value ($area $place=.)') //$area=.. $place=.
					)
				)
			).u("? $place")
		)
	),
	
	Person
	:"person".d(''
		,"name".d('! .name')
		,"stars".d('! .stars')
	),
	
	Ride
	:"ride".d('$?='
		,"title".d('! (.info.time .info:places@route)spans')
		,"note".d('! .info.note')
		,"details".d('? $?; Person(.person@); ! Passengers'
			,"BUTTON `contact rider".ui()
		).u("?")
		//
	).ui('$?=$?:!'),
	
	Hike:
	"hike".d(),
	
	Passengers:
	"passengers",
	
	Info
	:"info".d(''
		,"time".d('! .time')
		,"rider".d('! .rider.name')
		,"stars".d('! .rider.stars')
	),
	
	Login
	:modal('$!='
		,"FORM".d(''
			,"INPUT name=tel type=tel placeholder='Your phone number'".d().ui('$phone=#.value; ?')
			,'INPUT name=otp type=numeric placeholder="Code"'
				.d('? $phone')
				.ui('$!=(@user"1 @token"2)')
				//.ui('$!=("auth $phone #.value@code):api; ? $!.')
		).u("? $!:! $!.user:auth.save")
	).u("value $!.user")
	
})

.FUNC({
	convert:{
		auth: auth(headers),
		api : api("https://orders.saxmute.one/poputka/api.php?",{headers}).HttpJson,
		form: dictFrom.form,
		
		first	: arr => Array.isArray(arr) && arr[0],
		
		place: o => o && `${o.area} / ${o.place}`, //({area,place})=>`${area} / ${place}`,
		terms: o => o && `${o.dpt.area} → ${o.arv.area}`,
		places: o => o && `${o.dpt.place} → ${o.arv.place}`,

		
		today: o => new Date().toISOString().split('T')[0],
		soon: o => `${new Date().getHours()+2}:00`,
		
		modal,
		untab
	},
	
	flatten:{
		spans	: (span => 
				(values,tags) => values.map( (v,i) => span(v,tags[i]) ).reverse()
			)(elemFrom("span"))
	},
	
	operate:{
		top	:(value,alias,node)=>{ 
			node.style.display="none";
			window.setTimeout(()=>{
				//node.showModal();
				document.body.appendChild(node);
				node.style.display="";
			},0);
		}
	}
			

	
}, Await)

.RENDER();
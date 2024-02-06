import "/0.5.3.js";
import { auth, api, dictFrom } from '/stuff/snippets.js';
import Await from '/stuff/await.js';
import {untab} from '/stuff/parse.js';


const

headers = new Headers({
	"Content-Type": "application/x-www-form-urlencoded" //"application/json;charset=utf-8"
});

/*
person, stars, info:json
route, title:string, stops:text
ride, route, person, seats, date:date, info:json
hike, ride, person, stars, info:json

//vehicle, name, seats, info:json
//rider, person, vehicle, plate:text, stars
*/


"APP".d('$tab= $date= $route= $from= $to= $note= $ride= $rides=; $user=:auth.load $person="1'

	,"ROOF".d(''
		,"INPUT type=date".ui('$date=#:value')
/*		,"SELECT.route".d('* ("route $from@stop):api'
			,"OPTION".d('!! .name@ .route@value')
		).ui('$route=#.value')
	
		,"SELECT.from".d('! Places').ui('$from=#.value')
		,"SELECT.to".d('? $from; ! Places').ui('$to=#.value')	
*/
		,"from.select".d('! $from:place').ui('$from=Where(dict.from@label):wait')
		,"to.select".d('! $to:place').ui('$to=Where(dict.to@label):wait')
	)

	,"ETAGE".d('$tab= Tabset(:|@tab"rider|passenger|admin)'
	
		,"PAGE.driver".d('?? $tab@rider'
			,"UL.hikes".d('* ("hike $route $date):api'
				,"LI".d('! Hike')
			)
			,"BUTTON `add-ride"//.d('? $person') $from $to //($date $route)! :alert"no
				.ui(`	? $person $person=LoginModal():wait;
					? $date $date=:prompt"date;
					? $from $from=Where(dict.from@label):wait;
					? $to $to=Where(dict.to@label):wait;
					? $rides=(@PUT"ride $date $person ($from $to):route@route ($from $to $note)@info):api;
					:alert"created
				`)
		)
		
		,"PAGE.passenger".d('?? $tab@passenger'
			,"UL.rides".d('* ("ride $route $from $to $date):api'
				,"LI".d('! Ride').ui('$ride=.')
			)
			,"BUTTON `seek-rides".ui('')//subscribe for rides
		)
		
		,"PAGE.admin".d('?? $tab@admin'
			,"FORM `add-route".d(''
				,"INPUT name=name placeholder=name".d()
				,"TEXTAREA name=stops placeholder=stops".d()
				,"BUTTON type=submit `Submit".d()
			).ui('? (@PUT"route #:form@.):api :alert`error')
		)
	
	)

)

.DICT({
	areas: await fetch("kg.txt").then(r=>r.ok&&r.text()).then(untab),
	
	dict:{
		from :"Откуда",
		to: "Куда"
	}
})

.DICT({
	
	Tabset
	:"TABSET".d('* .tab'
		,"TAB".d('!? .tab; ! .tab; a!')
			.a("!? (.tab $tab)eq@selected")
			.ui('$tab=.')
	).u("?"),
	
	
	Ask
	:"MODAL".d('top; $value='
		,"SCRIM".ui('$value=')
		,"SHIELD".d(''
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
		)
	).u("kill; ?"),//value $value; 
	
	Where
	:"MODAL".d('top'
		,"SCRIM".ui('value')
		,"SHIELD".d('$area= $place='
			,"label".d('! .label')
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
		)
	).u('kill; ? :log"close'),
	
/*	
	Places
	:[
		,"OPTGROUP".d('* recent.place@'
			,"OPTION".d('!! .value .value@')
		)
		,"OPTGOUP".d('* ("place $route ):api'
			,"OPTION".d('!! .name@ .name@value')
		)
	],
	
	
	Areas_
	:"areas".d('* .areas@areas,area,place'
		,"area".d('$?='
			,"name".d('! .area').ui('$?=$?:!; ?')
			,"sub".d('? $?'
				,"places".d('? .place; * .place:|'
					,"place".d('! .place').ui('$value=(..area .place)') //$area=.. $place=.
				)
				,'Areas(.areas)'
			) 
		)
	),
*/
	
	Person:
	"person".d(''
		,"name".d('! .name')
		,"stars".d('! .stars')
	),
	
	Ride:
	"ride".d('$?='
		,"title".d('! .date .info.time .info.rider.name').ui('$?=$?:!')
		,"details".d('? $?; * ("ride .ride):api; ! Rider(.rider@) Passengers')
		,"BUTTON.contact-rider".ui()
	),
	
	Hike:
	"hike".d(),
	
	Passengers:
	"passengers",
	
	Info:
	"info".d(''
		,"time".d('! .time')
		,"rider".d('! .rider.name')
		,"stars".d('! .rider.stars')
	),
	
	
	Login
	:"login".d('$!='
		,"FORM".d(''
			,"INPUT name=tel type=tel placeholder='Your phone number'".d().ui('$phone=#.value; ?')
			,'INPUT name=otp type=numeric placeholder="Code"'
				.d('? $phone')
				.ui('$!=(@user"1 @token"2)')
				//.ui('$!=("auth $phone #.value@code):api; ? $!.')
		).u("? $!:! $!.user:auth.save")
	).u("value $!.user"),
	
	LoginModal
	: "MODAL".d('top; $!='
		,"SCRIM".ui('$!=')
		,"SHIELD".d('! Login')
	).u("kill; ?")
	
})

.FUNC({
	convert:{
		auth: auth(headers),
		api : api("https://orders.saxmute.one/poputka/api.php?",{headers}).HttpJson,
		form: dictFrom.form,
		
		place: o => o && `${o.area} / ${o.place}`, //({area,place})=>`${area} / ${place}`,
		route: o => o && `${o.from.area} - ${o.to.area}`,
		
		untab
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
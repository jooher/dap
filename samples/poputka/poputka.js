import "/0.5.3.js";
import { auth, api, dictFrom, elemFrom, JsonCSS } from '/stuff/snippets.js';
import Await from '/stuff/await.js';
import {untab} from '/stuff/parse.js';

/*
person, stars, info:json
route, terms:string, stops:text
ride, route, person, seats, date:date, info:json
hike, ride, person, stars, info:json

//car, person, vehicle, plate:text, stars
//vehicle, name, seats, info:json
*/

/*
Form({
	price:"number",
	note:"text",
	vehicle:[{'':'я пассажир'},vehicles]
})
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
	).u("kill; ?"),
	

term = loc => loc.split(' / ')[0],
place = loc => loc.split(' / ')[1]

;




"APP".d(`	$tab=
		$when=soon $dpt= $arv= $route= $ride=
		$user=:auth.load $person="1`

	,"ROOF".d(''
		,"GROUP.when".d(''
			,"INPUT type=time".d("!! $when.time@value").ui('$when.time=#.value')
			,"INPUT type=date".d("!! $when.date@value").ui('$when.date=#.value')
		)
		,"GROUP.where".d(''
			,"select.dpt".d('! $dpt').ui('$dpt=Where(dict.dpt@label):wait')
			,"select.arv".d('! $arv').ui('$arv=Where(dict.arv@label):wait')
		).u('? ($dpt $arv)!; $route=("route ($dpt $arv):terms@terms):api,route')
	)

	,"ETAGE".d('$tab=`routes Tabset(:|@tab"routes|rides|admin)'
	
		,"PAGE.routes".d('?? $tab@routes'
			,"UL".d('* ("route $person):api ("route):api E'
				,"LI".d('! (.terms .places)spans').ui('$dpt=. $arv=. $route=. $tab="rides')
			)
		)
		
		,"PAGE.rides".d('?? $tab@rides; $rides=("ride $route $when.date):api'
		
			,"UL".d('* $rides@'//($rides $filter)filter E'
				,"LI".d('! Ride').ui('$ride=.')
			)
			,"BUTTON.add-ride"
			.d("$info=")
			.ui(`	? $person $person=Login():wait;
				? $dpt $dpt=Where(@label"dpt):wait;
				? $arv $arv=Where(@label"arv):wait;
				? $route $route=("route ($dpt $arv):terms@terms):api,route;
				? $info=Info($when.time ($dpt $arv):places@places):wait;
				? (@PUT"ride $person $when.date $route $info):api :alert"error;
				:alert"created;
			`)
		)
/*		
		,"PAGE.active".d('?? $tab@active'
			,"UL.hikes".d('* ("hike $person):api'
			)
			,"UL.rides".d('* ("ride $person):api'
				,"LI".
			)
		)
*/		
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
	soon:	(([date,time])=>({date,time:time.split(':')[0]+':00'}))(new Date(Date.now()+1000*60*60*2).toISOString().split('T')), // in 2 hours
	vehicle: ["легковой", "минивэн", "автобус", "грузовой", "мотоцикл"]
})

.DICT({
	
	filter:{
		riders: ride => !!ride.info.vehicle,
		passrs: ride => ! ride.info.vehicle
	},
	
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
	
	_Where
	:modal('$region= $area= $place='
		,"label".d('!? .label@')
		//,"recent".d('Areas(:recall@areas"recent)')
		,"regions".d('* areas@areas,area,places'
			,"region".d('$?= $places='
				,"name".d('! .area').ui('? $?=$?:!; $region= $places=.places:|; ?')
				,"details".d('? $?'
					,"areas".d('? .areas; * .areas@areas,area,places'
						,"area".d('! .area')
							.a('!? (.area $area)eq@selected')
							.ui('$area=. $places=.places:|')
					)
					,"places".d('? $places; * $places@place'
						,"place".d('! .place').ui('value ($area $place=.):place') //$area=.. $place=.
					)
				)
			).u("? $place")
		)
	),
	
	Where
	:modal('$region= $area= $place='
		,"label".d('!? .label@')
		//,"recent".d('Areas(:recall@areas"recent)')
		,"regions".d('* areas@areas,region,places'
			,"region".d('$?= $places='
				,"name".d('! .region').ui('? $?=$?:!; $region=. $places=.places:|; ?')
				,"details".d('? $?'
					,"areas".d('? .areas; * .areas@areas,area,places'
						,"area".d('! .area')
							.a('!? (.area $area)eq@selected')
							.ui('$area=. $places=.places:|')
					)
					,"places".d('? $places; * $places@place'
						,"place".d('! .place').ui('value ($area $place=.):place') //$area=.. $place=.
					)
				)
			).u("? $place")
		)
	),
/*	
	Vehicle
	:modal("$?="
		,"UL".d('* ("car $person):api'
			,"LI".d('! (.name .plate)spans').ui('value $')
		)
		,"BUTTON.add-car".ui("$?=$?:!")
		,"add-car".d("? $?; $model= $plate="
			,"UL".d('* ("car):api'
				,"LI".d().ui('$model=.')
			)
			,"INPUT placeholder=model".d("#.value=$model").ui("$model=#.value")
			,"INPUT placeholder=plate".ui("$plate=#.value")
			,"BUTTON".ui(`? ($model $plate)! :alert"uhm;
				(@PUT"car $model $plate $person);
			`)
		)
	),
*/	
	Info
	:modal(

		"title".d('! (.time .places)spans')
	
		,"FORM.info".d('' 
			,"LABEL.vehicle".d(
				"SELECT".d( "OPTION value='' `я пассажир".d()
					,"OPTGROUP".d('* vehicle'
						,"OPTION".d('! .vehicle')
					)
				).ui('.vehicle=#.value')
			)
			,"LABEL.price".d("INPUT type=number".ui(".price=#.value"))
			,"LABEL.note".d("TEXTAREA".ui(".note=#.value"))
		).u("?")
		,"DECK".d(''
			,"BUTTON.cancel".ui('value :?')
			,"BUTTON.ok".ui("value $")
		)
	),
	
	Person
	:"person".d(''
		,"name".d('! .name')
		,"stars".d('! .stars')
	),
	
	Ride
	:"ride".d('$?=; !? $my=(.person $person)eq'
		,"title".d('! (.info.time .info.price .info.vehicle .info.places .info.note)spans')
		,"details".d('? $?; Person(.person@); ! Passengers'
			,"BUTTON.contact_rider"
				.d("? $my:!")
				.ui(`	? $person $person=Login():wait;
					? $Hike=(@PUT"hike $person $ride ($when.time $dpt $arv $note)@info):api;
					:alert"created;
				`)//subscribe for rides
			//,"BUTTON.cancel"
		).u("?")
		//
	).ui('$?=$?:!'),
	
	Hike:
	"hike".d(),
	
	Passengers:
	"passengers",
	
	_Info
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
		route : arr => Array.isArray(arr) && arr[0]?.route,
		
		
		place	: ({area,place}) =>`${area} / ${place}`,
		terms : ({dpt,arv}) => `${term(dpt)} → ${term(arv)}`,
		places: ({dpt,arv}) => `${place(dpt)} → ${place(arv)}`,
		dptarv: str => {
			const [dpt,arv] = str.split(' → ');
			return {dpt,arv};
		},

		
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
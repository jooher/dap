import "/0.5.3.js";
import { auth, api, dictFrom, elemFrom, JsonCSS } from '/stuff/snippets.js';
import Await from '/stuff/await.js';
import {untab} from '/stuff/parse.js';

/*
const	tg = window.Telegram.WebApp;
if(!tg)return;
tg.expand();
if (tg.MainButton.isVisible)tg.MainButton.hide();
tg.onEvent('themeChanged', function(){alert("theme changed")});
*/


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
		,"SCRIM".ui('value :?')
		,"SHIELD".d(...stuff)//.u('value $')
	).u("kill; ?"),
	
/*
inputs = i => Object.entries(i).map(([name,type])=>{
	const	label = document.createElement("label"),
		input = document.createElement("input");
	label.setAttribute("class",name);
	input.setAttribute("name",name);
	input.setAttribute("type",type);
	label.append(input);
	return label;
}),


term = loc => loc.split(' / ')[0],
place = loc => loc.split(' / ')[1],
*/

where	= { //$where={dpt,arv}
	
	convert: ((slash,arrow) => ({
		fromtp:({terms,places})=>{
				if(terms&&places){
					const	p = places.split(arrow),
						[dpt,arv] = terms.split(arrow).map( (t,i) => [...t.split(slash),p[i]] );
					return {dpt,arv,terms,places};
				}
			},
		totp	:w => w&&w.dpt&&w.arv&&{ dpt:w.dpt, arv:w.arv,
				terms : [w.dpt.slice(0,-1),w.arv.slice(0,-1)].map(a=>a.join(slash)).join(arrow),
				places: [w.dpt.at(-1),w.arv.at(-1)].join(arrow)
			},
			
		loc	:a => a && a.join(slash)
		
	}))(', ',' → ')
};



"APP".d(`	$!= $?= $tab="routes
		$when=soon $where=
		$route= $ride=
		$user=:auth.load
		$person="1`

	,"BUTTON.tgmain.add-ride".d('? $?:!; tgmain').ui('$?=:!')
	
	,"ROOF".d('? $?'
	
		,"GROUP.when".d('& $when@'
			,"INPUT type=date".d("!! .date@value today@min").ui('.date=#.value')
			,"INPUT type=time".d("!! .time@value").ui('.time=#.value')
		).u('? (.date .time)!; $when=(.date .time)')
		//,"LABEL.when".d()

		,"GROUP.where".d('& $where@'
			,"input.dpt".d('! .dpt:loc').ui('.dpt=Where(@label"dpt):wait')
			,"input.arv".d('! .arv:loc').ui('.arv=Where(@label"arv):wait')
			,"swap".ui('& (.dpt@arv .arv@dpt)')
		).u('& $where=(.dpt .arv):totp@; ? (.dpt .arv)!; $route=("route .terms):api,route $tab="rides')//
		
		,"FORM.info".d(''
			,"DECK".d(''
				,"LABEL.vehicle".d(
					"SELECT name=vehicle".d(
						"OPTION value='' `я пассажир".d()
						,"OPTGROUP".d('* vehicle'
							,"OPTION".d('! .vehicle')
						)
					)//.ui('.vehicle=#.value')
				)
				,"LABEL.seats".d(
					"SELECT name=seats".d('* seats@value', "OPTION".d('! .value'))
					//"INPUT name=seats type=number value=1 min=1".d()//.ui(".seats=#.value")
				)
				,"LABEL.price".d(
					"SELECT name=price".d('* price@value', "OPTION".d('! .value'))
					//"INPUT name=price type=number min=100 step=50 value=500".d()//.ui(".price=#.value")
				)//
			)
			,"LABEL.note".d(
				"TEXTAREA name=note maxlength=200".d()//.ui(".note=#.value")
			)
			,"BUTTON.tgmain.ok".d('tgmain') //.add-ride
			.ui(`? $?;
				? $route=(@PUT"route .terms):api,route :alert"error;
				? $!=(@PUT"ride $person $when.date $route (#.form:form@. .time .terms .places)@info ):api :alert"error;
				$?=:?
			`)
		)

	)
	,"ETAGE".d('Tabset(:|@tab"routes|rides)'//|account
	
		,"PAGE.routes".d('?? $tab@routes; $!'
			,"UL".d('* ("routeride $person $when.date):api ("route):api E'
				,"LI"	.d('! (.terms .places)spans')
					.ui('$where=(.terms .places):fromtp $route=. $tab="rides')
			)
		)
		
		,"PAGE.rides".d('?? $tab@rides; $!'
			,"title".d('! $where.terms').ui('$tab="routes')
			,"UL".d('* ("ride $route $when.date):api'//($rides $filter)filter E'
				,"LI.ride".d('$?=; !? $my=(.person $person)eq .info.vehicle@rider .info.vehicle:!@passenger'
					,"title"
					.d('* .info@; ! (.time .price .vehicle .seats .where .places .note)spans')
					.ui('$?=$?:!')
					,"details".d('? $?; Person(.person@)'
						,"BUTTON.contact_rider"
						.d("? $my:!")
						.ui(`	? $person $person=Login():wait;
							? $Hike=(@PUT"hike $person $ride ($when.time $dpt $arv $note)@info):api;
							:alert"created;
						`)//subscribe for rides
					).ui('$ride=.')
				)
			)
		)
		
		,"PAGE.account".d('?? $tab@account'
			,"FORM.contacts".d('* $user.info.contacts@ ()'
				,"LABEL.name"	.d("INPUT type=text name=name".d("!! .name@value"))
				
				,"LABEL.tel"	.d("INPUT type=tel name=tel autocomplete=tel".d("!! .tel@value"))
				,"LABEL.tg"		.d("INPUT type=tel name=tg autocomplete=tel".d("!! .tg@value"))
				,"LABEL.wa"		.d("INPUT type=tel name=wa autocomplete=tel".d("!! .wa@value"))
				,"BUTTON `submit"
				.ui(`	$user.info.contacts=#.form:form
					$user=(@PUT"person $user.person $user.info):api,first
					$user:auth.save;
					log "updated; ?
				`)
			)
		)
/*		
		,"PAGE.active".d('?? $tab@active'
			,"UL.hikes".d('* ("hike $person):api'
			)
			,"UL.rides".d('* ("ride $person):api'
				,"LI".
			)
		)
		,"PAGE.admin".d('?? $tab@admin'
			,"FORM `add route".d(''
				,"INPUT name=name placeholder=name".d()
				,"TEXTAREA name=stops placeholder=stops".d()
				,"BUTTON type=submit `Submit".d()
			).ui('? (@PUT"route #:form@.):api :alert`error')
		)
*/	
	
	)

)

.DICT({
	E:[],
	areas: await fetch("kg.txt").then(r=>r.ok&&r.text()).then(untab),
	soon:	(([date,time])=>({date,time:time.split(':')[0]+':00'}))(new Date(Date.now()+1000*60*60).toISOString().split('T')), // in 1 hour
	today: new Date().toISOString().split('T')[0],
	vehicle: ["седан", "универсал", "минивэн", "автобус", "грузовик", "мотоцикл"],
	seats: [1,2,3,4,5,6,7,8,9,10],
	price: [100,150,200,250,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000]
})

.DICT({
	
	//user: tg.initDataUnsafe.user,

	
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
	
	Where
	:modal('$region= $area= $place=; !? .label@'
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
						,"place".d('! .place').ui('value ($region $area $place=.)*')
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

		"title".d('! (.when.time .when.date .where.terms .where.places)spans')
	
	),
	
	Person
	:"person".d(''
		,"A.tg target=tg".d('!! @href"https://t.me/+79268274271').u('?')
	),
	
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
		},
		
		tgmain: (value,alias,node)=>{ window.tgmain && window.tgmain(node) } //|| ()=>{} //
	}

}, where, Await)

.RENDER();
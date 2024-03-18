import "/0.5.3.js";
import { auth, api, dictFrom, elemFrom, JsonCSS } from '/stuff/snippets.js';
import Await from '/stuff/await.js';
import {untab} from '/stuff/parse.js';

JsonCSS('lang/ru.json');

const

headers = new Headers({
	"Content-Type": "application/x-www-form-urlencoded" //"application/json;charset=utf-8"
}),

Ahref = url =>{
	const a = document.createElement("A");
	a.setAttribute("href",url);
	return a;
},

modal = (...stuff) =>
	"MODAL".d('top'
		,"SCRIM".ui('value :!')
		,"SHIELD".d(...stuff)
	).u("kill; ?"),

where	= { //$where={dpt,arv,terms,places}
	
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
		$input=.
		$when=soon $where=
		$route= $ride=
		$person=$user=:auth.load`

	,"BUTTON.tgmain.add-ride".d('? $?:!; tgmain').ui('$?=:!')
	
	,"ROOF".d('? $?'
	
		,"import".d('* $user:imprt@'
			,"text".d('! .text').ui('$person=.user')
			,"contact".d('! .user:contact')
		).a('!? ($person .user)eq@active')
		
		,"GROUP.when".d('& $when@'
			,"INPUT type=date".d("!! .date@value today@min").ui('.date=#.value')
			,"INPUT type=time".d("!! .time@value").ui('.time=#.value')
		).u('? (.date .time)!; $when=(.date .time)')

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
						,'Options(vehicle@value)'
					)
				)
				,"LABEL.seats".d(
					"SELECT name=seats".d('Options(seats@value)')
				)
				,"LABEL.price".d(
					"SELECT name=price".d('Options(price@value)')
					//"INPUT name=price type=number min=100 step=50 value=500".d()//.ui(".price=#.value")
				)
			)
			,"LABEL.note".d(
				"TEXTAREA name=note maxlength=200".d()
			)
			,"DECK".d('?'
				,"LABEL.tel".d(
					"INPUT name=tel".d()
				)
				,"LABEL.tgchat".d(//'? $user.username:!',
					"INPUT name=tgchat".d('')
				)
			)
			,"BUTTON.tgmain.ok".d('tgmain')
			.ui(`? $?;
				? $route=(@PUT"route .terms):api,route :alert"error;
				? $!=(@PUT"ride $person.id@person $when.date $route (#.form:form@. .time .terms .places $person )@info ):api :alert"error;
				$?= $tab="rides
			`)
		)
	)
	
	,"ETAGE".d('Tabset(:|@tab"routes|rides)'
	
		,"PAGE.routes".d('?? $tab@routes; $!'
			,"UL".d('* ("routeride $person.id@person $when.date):api ("route):api E'
				,"LI"	.d('! (.terms .places)spans')
					.ui('$where=(.terms .places):fromtp $route=. $tab="rides')
			)
		)
		
		,"PAGE.rides".d('?? $tab@rides; $!'
			,"title".d('! $where.terms').ui('$tab="routes')
			,"UL".d('* ("ride $route $when.date):api E'
				,"LI.ride".d('!? $my=(.person $user.id)eq .info.vehicle@rider .info.vehicle:!@passenger; * .info@'//$?=; 
					,"title".d('! (.time .price .vehicle .seats .where .places .person:fullname .note )spans')
					,"contact".d('! .person:contact')
				)
			)
		)
		
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
	
	Options
	:"OPTGROUP".d('* .value',"OPTION".d('! .value')),
		
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
	)
	
})

.FUNC({

	convert:{
		auth: auth(headers),
		api : api("https://orders.saxmute.one/poputka/api.php?",{headers}).HttpJson,
		form: dictFrom.form,
		
		first	: arr => Array.isArray(arr) && arr[0],
		route : arr => Array.isArray(arr) && arr[0]?.route,
		
		user	: u => u,
		fullname: u => u&&`${u.first_name||''} ${u.last_name||''}`,
		
		contact: u => u&&[
			u.username&& Ahref('https://t.me/'+u.username),
			u.tel&& Ahref('tel:'+u.tel)
		],
		
		imprt: u => u && fetch(`https://orders.saxmute.one/_tgbot/import/${u.id}.json?1`).then(r=>r.ok&&r.json()),
		
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
				document.body.appendChild(node);
				node.style.display="";
			},0);
		},
		
		tgmain: (value,alias,node)=>{ window.tgmain && window.tgmain(node) } //|| ()=>{} //
	}

}, where, Await)

.RENDER();
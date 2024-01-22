import "/0.5.js";
import { api } from '/stuff/snippets.js';

/*
route, title:string, stops:text
person, stars, info:json
drive, route, person, seats, date:date, info:json
hike, drive, person, stars, info:json

//vehicle, name, seats, info:json
//driver, person, vehicle, plate:text, stars
*/


"APP".d('$date= $from= $to= $drive= $person="1'

	,"INPUT type=date".ui('$date=#:value')
	
	,"SELECT.from".d('',Routes).ui('$from=#:value')
	,"SELECT.to".d('? $from',Routes).ui('$to=#:value')
	
	,"driver".d('?? $tab@driver'
		,"UL.hikes".d('* ("hike $route $date):api'
			,"LI".d(Hike)
		)
		,"BUTTON.add-drive".d('? $person')
			.ui('$drives=(@PUT"drive $person $route ($from $to)@info $date):api')
	)
	
	,"passenger".d('?? $tab@passenger'
		,"UL.drives".d('* ("drive $route $date):api'
			,"LI".d(Drive).ui("$drive=.")
		)
		,"BUTTON.seek-drives".ui('')
	)
	
	
)

.DICT({
	Routes:[
		// TODO: RecentRoutes
		,"OPTGROUP".d('* (`route $from@stop):api'
			,"OPTION".d('!! .title@ .route@value .stops@title')
		)
	],
	
	Driver:
	"driver".d(''
		,"name".d('! .name')
		,"vehicle".d('! .vehicle')
		,"stars".d('! .stars')
	),
	
	Drive:
	"drive".d('$?='
		,"title".d('! .date .info.time .info.driver.name').ui('$?=$?:!')
		,"details".d('? $?; * ("drive .drive):api; ! Driver(.driver@)',Passengers)
		,"BUTTON.contact-driver".ui()
	),
	
	Hike:
	"hike".d(),
	
	Passengers:
	"passengers",
	
	Info:
	"info".d(""
		,"time".d("! .time")
		,"driver".d("! .driver.name")
		,"stars".d("! .driver.stars")
	)
	
})

.FUNC({
	flatten:{
		api : api.HttpJson("https://jooher.1gb.ru/poputka/api.php?")
	}

})

.RENDER();
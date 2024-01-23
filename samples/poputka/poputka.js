import "/0.5.js";
import { api } from '/stuff/snippets.js';

/*
person, stars, info:json
route, title:string, stops:text
ride, route, person, seats, date:date, info:json
hike, ride, person, stars, info:json

//vehicle, name, seats, info:json
//rider, person, vehicle, plate:text, stars
*/


"APP".d('$date= $from= $to= $ride= $person="1'

	,"INPUT type=date".ui('$date=#:value')
	
	,"SELECT.route".d('* ("route $from@stop):api'
		,"OPTION".d('!! .name@ .route@value')
	).ui('$route=#.value')
	
	,"SELECT.from".d('',Places).ui('$from=#.value')
	,"SELECT.to".d('? $from',Places).ui('$to=#.value')	
	
	,"driver".d('?? $tab@rider'
		,"UL.hikes".d('* ("hike $route $date):api'
			,"LI".d(Hike)
		)
		,"BUTTON.add-ride".d('? $person')
			.ui('? $person $person=Auth():wait; $rides=(@PUT"ride $date $person $route ($from $to)@info):api')
	)
	
	,"passenger".d('?? $tab@passenger'
		,"UL.{name}s".d('* ("ride $route $from $to $date):api'
			,"LI".d(Ride).ui("$ride=.")
		)
		,"BUTTON.seek-rides".ui('')//subscribe for rides
	)
	
	
)

.DICT({
	Places:[
		,"OPTGROUP".d('* recent.place@'
			,"OPTION".d('!! .value .value@')
		)
		,"OPTGOUP".d('* ("place $from@stop):api'
			,"OPTION".d('!! .name@ .name@value')
		)
	],
	
	Person:
	"person".d(''
		,"name".d('! .name')
		,"stars".d('! .stars')
	),
	
	Ride:
	"ride".d('$?='
		,"title".d('! .date .info.time .info.rider.name').ui('$?=$?:!')
		,"details".d('? $?; * ("ride .ride):api; ! rider(.rider@)',Passengers)
		,"BUTTON.contact-rider".ui()
	),
	
	Hike:
	"hike".d(),
	
	Passengers:
	"passengers",
	
	Info:
	"info".d(""
		,"time".d("! .time")
		,"rider".d("! .rider.name")
		,"stars".d("! .rider.stars")
	)
	
})

.FUNC({
	flatten:{
		api : api.HttpJson("https://jooher.1gb.ru/poputka/api.php?")
	}

})

.RENDER();
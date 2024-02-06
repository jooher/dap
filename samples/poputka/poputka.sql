DROP TABLE IF EXISTS `hike`;
CREATE TABLE `hike` (
  `hike` int NOT NULL AUTO_INCREMENT,
  `person` int DEFAULT NULL,
  `ride` int DEFAULT NULL,
  `stars` int DEFAULT NULL,
  `info` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`hike`),
  KEY `fk_hike_person_idx` (`person`),
  KEY `fk_hike_drive_idx` (`ride`),
  CONSTRAINT `fk_hike_person` FOREIGN KEY (`person`) REFERENCES `person` (`person`),
  CONSTRAINT `fk_hike_ride` FOREIGN KEY (`ride`) REFERENCES `ride` (`ride`)
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `person`;
CREATE TABLE `person` (
  `person` int NOT NULL AUTO_INCREMENT,
  `stars` int DEFAULT '0',
  `info` json DEFAULT NULL,
  PRIMARY KEY (`person`)
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `ride`;
CREATE TABLE `ride` (
  `ride` int NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `route` int DEFAULT NULL,
  `person` int DEFAULT NULL,
  `seats` int DEFAULT NULL,
  `info` json DEFAULT NULL,
  PRIMARY KEY (`ride`),
  KEY `fk_drive_route_idx` (`route`),
  KEY `fk_drive_person_idx` (`person`),
  KEY `ix_date` (`date` DESC),
  CONSTRAINT `fk_drive_person` FOREIGN KEY (`person`) REFERENCES `person` (`person`),
  CONSTRAINT `fk_drive_route` FOREIGN KEY (`route`) REFERENCES `route` (`route`)
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `route`;
CREATE TABLE `route` (
  `route` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `stops` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`route`),
  FULLTEXT KEY `ft_stops` (`name`,`stops`)
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `vehicle`;
CREATE TABLE `vehicle` (
  `vehicle` int NOT NULL AUTO_INCREMENT,
  `seats` int NOT NULL,
  `class` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `name` varchar(45) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  PRIMARY KEY (`vehicle`)
) ENGINE=InnoDB;



CREATE PROCEDURE `get.hike`(_hike int)
select * from hike where _hike is null or hike=_hike ;

CREATE PROCEDURE `get.person`(_person int)
select person, `info`, `stars` from person where person=_person ;

CREATE PROCEDURE `get.ride`(_route int, _date date)
begin
 select * from ride where route=_route and `date`=_date;
end ;

CREATE PROCEDURE `get.route`(_route int, _stop varchar(40))
if _route is not null then select * from route where route=_route;
else select * from route;
end if ;

CREATE PROCEDURE `get.vehicle`(_vehicle int)
select vehicle, `name`,`info`,`seats` from vehicle where _vehicle is null or vehicle=_vehicle ;

CREATE PROCEDURE `params`(sp varchar(40))
SELECT PARAMETER_NAME
FROM information_schema.parameters 
WHERE SPECIFIC_NAME = sp ;

CREATE PROCEDURE `put.hike`(_hike int, _person int, _drive int, _info json, _stars int)
begin
if _hike is null then insert hike(`person`,`drive`,`info`,`stars`) values(_person,_drive,_info,_stars);
else update hike set `person`=_person,`drive`=_drive,`info`=_info,`stars`=_stars where hike=_hike;
end if;
select * from hike where hike = coalesce(_hike,last_insert_id());
end ;

CREATE PROCEDURE `put.person`(_person int, _info json, _stars int)
begin
if _person is null then insert person(`info`,`stars`) values(_info,_stars);
else update person set `info`=_info,`stars`=_stars where person=_person;
end if;
select * from person where person = coalesce(_person,last_insert_id());
end ;

CREATE PROCEDURE `put.ride`(_ride int, _route int, _person int, _seats int, _date date, _info json)
begin
if _ride is null then insert ride(`route`,`person`,`seats`,`date`,`info`) values(_route,_person,_seats,_date,_info);
else update ride set `route`=_route,`person`=_person,`seats`=_seats,`date`=_date,`info`=_info where ride=_ride;
end if;
select * from ride where ride = coalesce(_ride,last_insert_id());
end ;

CREATE PROCEDURE `put.route`( _route int, _name varchar(100), _stops varchar(2000))
begin
 if _route is null then insert into route(`name`,`stops`) values(_name,_stops);
 else update route set `name`=_name, stops=_stops where route=_route;
 end if;
 select * from route where route=coalesce(_route,last_insert_id());
end ;

CREATE PROCEDURE `put.vehicle`(_vehicle int, _name int, _info json, _seats int)
begin
if _vehicle is null then insert vehicle(`name`,`info`,`seats`) values(_name,_info,_seats);
else update vehicle set `name`=_name,`info`=_info,`seats`=_seats where vehicle=_vehicle;
end if;
select * from vehicle where vehicle = coalesce(_vehicle,last_insert_id());
end ;

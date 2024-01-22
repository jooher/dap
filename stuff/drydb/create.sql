CREATE PROCEDURE `put.hike`(_hike int, _person int, _drive int, _info json, _stars int)
begin
if _hike is null then insert hike(`person`,`drive`,`info`,`stars`) values(_person,_drive,_info,_stars);
else update hike set `person`=_person,`drive`=_drive,`info`=_info,`stars`=_stars where hike=_hike;
end if;
select * from hike where hike = coalesce(_hike,last_insert_id());
end;

CREATE PROCEDURE `put.person`(_person int, _info json, _stars int)
begin
if _person is null then insert person(`info`,`stars`) values(_info,_stars);
else update person set `info`=_info,`stars`=_stars where person=_person;
end if;
select * from person where person = coalesce(_person,last_insert_id());
end;

CREATE PROCEDURE `put.vehicle`(_vehicle int, _name int, _info json, _seats int)
begin
if _vehicle is null then insert vehicle(`name`,`info`,`seats`) values(_name,_info,_seats);
else update vehicle set `name`=_name,`info`=_info,`seats`=_seats where vehicle=_vehicle;
end if;
select * from vehicle where vehicle = coalesce(_vehicle,last_insert_id());
end;
/*
route title:string stops:text
event date: route info:json
person info:json stars
visit person event stars

vehicle name info:json seats
*/

const 

	sqltypes = {
		string:"utf8",
		text:"utf8"
	},
	
	table = str => {
		const fields = str.split(/\s+/g).filter(str=>str),
			key = fields.shift();
		return [key, Object.fromEntries(fields.map(field))]			
	},
	
	field = str => {
		const spec = str.split(":"),
			name = spec.shift(),
			type = spec.length ? spec.shift()||"int" : name;
		return [name, sqltypes[type]||type]
	},
	
	PK = name => `PRIMARY KEY (${name})`,
	IX = name => `KEY ix_${name}(${name})`,
	FK = name => IX(name)+`, CONSTRAINT fk_${name} FOREIGN KEY (${name}) REFERENCES ${name}(${name})`,
	
		
	procParams = fields => Object.entries(fields).map(([name,type])=>`_${name} ${type}`).join(", "),
	fieldsList = fields => Object.keys(fields).map(name=>`"${name}"`),//.join(", "),
	assignList = fields => Object.keys(fields).map(name=>`"${name}"=_${name}`),//.join(", "),
	inputParams = fields => Object.keys(fields).map(name=>`_${name}`), //.join(", "),
	
	GET = (key,fields) =>`
CREATE VIEW "get.${key}"(_${key} int)
select ${key}, ${fieldsList(fields)} from ${key} where _${key} is null or ${key}=_${key};`,
	
	PUT = (key,fields) =>`
CREATE PROCEDURE "put.${key}"(_${key} int, ${procParams(fields)})
begin
if _${key} is null then insert ${key}(${fieldsList(fields)}) values(${inputParams(fields)});
else update ${key} set ${assignList(fields)} where ${key}=_${key};
end if;
select * from ${key} where ${key} = coalesce(_${key},last_insert_id());
end;`;

export default desc => {
	
	const tables = Object.fromEntries(desc.split(/\n+/g).filter(str=>str).map(table)),
	
		tablestuff = (key,fields) => [
			`${key} serial`,
			...Object.entries(fields).map(([name,type]) =>`"${name}" ${type}`),
			...Object.keys(fields).filter(name => name in tables).map(FK),
			PK(key)
		].join(",\n");
		
	
	return Object.entries(tables).map(([key,fields]) => [
			`CREATE TABLE ${key}(`,
				tablestuff(key,fields),
			`)`,
			GET(key,fields),
			PUT(key,fields)
		].join("\n\n")
	).join("\n\n\n\n").replace(/"/g,"`");
}
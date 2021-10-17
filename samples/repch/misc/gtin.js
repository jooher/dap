4612752316825


const countries =`
000	USA and Canada
200	internal use
300	France
380	Bulgaria
383	Slovenia
385	Croatia
387	Bosnia-Herzegowina
400	Germany
450	Japan
460	Russia	http://srs.gs1ru.org/id/gtin/$
471	Taiwan
474	Estonia
475	Latvia
476	Azerbaijan
477	Lithuania
478	Uzbekistan
479	Sri Lanka
480	Philippines
481	Belorussia
482	Ukraine
484	Moldova
485	Armenia
486	Georgia
487	Kazakhstans
489	Hong Kong
490	Japan
500	Great Britain
520	Greece
528	Lebanons
529	Cyprus
531	Macedonians
535	Maltas
539	Ireland
540	Belgium and Luxembourg
560	Portugal
569	Iceland
570	Denmark
590	Poland
594	Rumania
599	Hungary
600	South Africa
608	Bahrein
609	Mauritius
611	Morocco
613	Algeria
616	Kenya
619	Tunisia
621	Syria
622	Egypt
624	Lybien
625	Jordan
626	Irans
627	Kuwait
628	Saudi-Arabien
629	United Arab Emirates
640	Finland
690	China
700	Norway
729	Israels
730	Sweden
740	Central America
746	Dominican Republic
750	Mexico
759	Venezuelas
760	Switzerland and Liechtenstein
770	Colombia
773	Uruguay
775	Peru
777	Bolivia
779	Argentina
780	Chile
784	Paraguay
786	Ecuador
789	Brazil
800	Italy
840	Spain
850	Cuba
858	Slovakia
859	Czech Republic
860	Yugoslavia
867	Nord-Korea
869	Turkey
870	Netherlands
880	South Korea
885	Thailand
888	Singapore
890	India
893	Vietnam
899	Indonesia
900	Austria
930	Australia
940	New Zealand
955	Malaysia
958	Makao
977	ISSN
978	ISBN	https://isbnsearch.org/isbn/$
980	voucher codes`
.split(/\n/g)/*.filter(r>=!!r)*/.map(r=>r.split(/\t/g)),

export default ean13 => {
	const k=Math.floor(ean13/1e10);
	for(let n=0; codes[n+1]<k; n++);
	const row=codes[n];
	return {country:codes[1], href:codes[2]};
}

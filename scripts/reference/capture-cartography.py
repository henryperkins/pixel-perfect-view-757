import swisseph as s, math, json
from datetime import datetime, timezone
cases=[('los-angeles-1990','Los Angeles reference chart','1990-05-15T19:34:00.000Z',34.0522,-118.2437),('j2000','J2000 epoch chart','2000-01-01T12:00:00.000Z',51.4779,0),('chicago-2026','Chicago reference chart','2026-10-24T23:54:00.000Z',41.8781,-87.6298)]
out={'engine':'Swiss Ephemeris','version':s.version,'ephemeris':'Moshier analytical ephemeris (explicit FLG_MOSEPH; not downloaded Swiss data files)','frame':'Tropical apparent geocentric, true equinox of date','horizon':'Geometric planet centre; no refraction or topocentric parallax','documentation':'https://www.astro.com/swisseph/swephprg.htm','charts':[]}
for id,label,utc,lat,lon in cases:
 d=datetime.fromisoformat(utc.replace('Z','+00:00')); jd=s.julday(d.year,d.month,d.day,d.hour+d.minute/60+d.second/3600)
 theta=s.sidtime(jd)*15; cusps,angles=s.houses(jd,lat,lon,b'P')
 chart={'id':id,'label':label,'utcISO':utc,'latitude':lat,'longitude':lon,'siderealDegrees':theta,'ascendant':angles[0],'midheaven':angles[1],'bodies':[]}
 for key,name,body in [('sun','Sun',s.SUN),('moon','Moon',s.MOON),('pluto','Pluto',s.PLUTO)]:
  p,flags=s.calc_ut(jd,body,s.FLG_MOSEPH); q,eqflags=s.calc_ut(jd,body,s.FLG_MOSEPH|s.FLG_EQUATORIAL)
  ra,dec=q[:2]; lines=[]
  for latitude in [-60,-45,-30,-15,0,15,30,45,60]:
   c=-math.tan(math.radians(latitude))*math.tan(math.radians(dec)); h=math.degrees(math.acos(c)) if abs(c)<=1 else None
   wrap=lambda x:(x+180)%360-180
   lines.append({'latitude':latitude,'MC':wrap(ra-theta),'IC':wrap(ra-theta+180),'AC':wrap(ra-h-theta) if h is not None else None,'DC':wrap(ra+h-theta) if h is not None else None})
  chart['bodies'].append({'key':key,'label':name,'lon':p[0],'lat':p[1],'ra':ra,'dec':dec,'returnedFlags':flags,'equatorialFlags':eqflags,'lines':lines})
 out['charts'].append(chart)
with open('/dev-server/src/lib/astro/chart-reference.json','w') as f: json.dump(out,f,indent=2); f.write('\n')

// Bangkok rail starter set used for the BTS/MRT job filter.
// Station order per line is used to count stops; interchanges share an `x` key.
// Coordinates are intentionally not included: companies pin their exact location on the map.
// Extend this list (and re-run `npm run seed:sql`) to cover more lines.
export const LINES=[
 {system:'BTS',line:'BTS Sukhumvit',code:'SUK',stations:['Ha Yaek Lat Phrao','Mo Chit','Saphan Khwai','Ari','Sanam Pao','Victory Monument','Phaya Thai','Ratchathewi','Siam','Chit Lom','Phloen Chit','Nana','Asok','Phrom Phong','Thong Lo','Ekkamai','Phra Khanong','On Nut','Bang Chak','Punnawithi','Udom Suk','Bang Na','Bearing','Samrong','Pu Chao','Chang Erawan','Royal Thai Naval Academy','Pak Nam','Srinagarindra','Phraek Sa','Sai Luat','Kheha']},
 {system:'BTS',line:'BTS Silom',code:'SIL',stations:['National Stadium','Siam','Ratchadamri','Sala Daeng','Chong Nonsi','Saint Louis','Surasak','Saphan Taksin','Krung Thon Buri','Wongwian Yai','Pho Nimit','Talat Phlu','Wutthakat','Bang Wa']},
 {system:'MRT',line:'MRT Blue',code:'BL',stations:['Hua Lamphong','Sam Yan','Si Lom','Lumphini','Khlong Toei','Queen Sirikit National Convention Centre','Sukhumvit','Phetchaburi','Phra Ram 9','Thailand Cultural Centre','Huai Khwang','Sutthisan','Ratchadaphisek','Lat Phrao','Phahon Yothin','Chatuchak Park','Kamphaeng Phet','Bang Sue','Tao Poon']}
];
// Walkable/official interchanges between lines (station names differ across systems).
const INTERCHANGES=[['Siam'],['Asok','Sukhumvit'],['Sala Daeng','Si Lom'],['Mo Chit','Chatuchak Park'],['Ha Yaek Lat Phrao','Phahon Yothin']];

export const STATIONS=LINES.flatMap(l=>l.stations.map((name,i)=>({id:`${l.code}-${String(i+1).padStart(2,'0')}`,system:l.system,line:l.line,name,seq:i+1,x:(INTERCHANGES.findIndex(g=>g.includes(name))+1)||null})));
export const stationNames=system=>[...new Set(STATIONS.filter(s=>!system||s.system===system).map(s=>s.name))].sort((a,b)=>a.localeCompare(b));

function graph(){
 const adj=new Map();const key=s=>s.name;
 const add=(a,b)=>{if(!adj.has(a))adj.set(a,new Set());adj.get(a).add(b);};
 for(const l of LINES)for(let i=0;i<l.stations.length;i++){add(l.stations[i],l.stations[i]);if(i)add(l.stations[i],l.stations[i-1]),add(l.stations[i-1],l.stations[i]);}
 const zero=new Map();for(const g of INTERCHANGES)for(const a of g)for(const b of g)if(a!==b){if(!zero.has(a))zero.set(a,new Set());zero.get(a).add(b);}
 return {adj,zero,key};
}
const G=graph();
/** Number of stops between two stations (interchange walks count as 0). Infinity if unknown. */
export function stopsBetween(from,to){
 if(!from||!to)return Infinity;if(from===to)return 0;
 if(!G.adj.has(from)||!G.adj.has(to))return Infinity;
 // 0-1 BFS
 const dist=new Map([[from,0]]);const dq=[from];
 while(dq.length){
  const cur=dq.shift();const d=dist.get(cur);
  for(const z of G.zero.get(cur)||[])if(!dist.has(z)||dist.get(z)>d){dist.set(z,d);dq.unshift(z);}
  for(const n of G.adj.get(cur))if(n!==cur&&(!dist.has(n)||dist.get(n)>d+1)){dist.set(n,d+1);dq.push(n);}
 }
 return dist.has(to)?dist.get(to):Infinity;
}
export function haversineKm(a,b){
 if(![a?.lat,a?.lng,b?.lat,b?.lng].every(Number.isFinite))return Infinity;
 const R=6371,r=x=>x*Math.PI/180;const dLat=r(b.lat-a.lat),dLng=r(b.lng-a.lng);
 const h=Math.sin(dLat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2;
 return 2*R*Math.asin(Math.sqrt(h));
}

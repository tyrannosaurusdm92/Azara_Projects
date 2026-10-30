/* Aza'ra canon from the Aza'ra section of the author's website.
 * No exact Earth-time equivalence is claimed. Clock is a user-controlled
 * campaign simulation; local timezone clocks remain informational only.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const KEY='belavados.aza.calendar.v2';
const LIMITS={year:[1,999999],month:[1,8],week:[1,5],day:[1,6],hour:[0,20],minute:[0,59]};
const defaults={year:1,month:1,week:1,day:1,hour:13,minute:30,playing:false};
const raw=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}})();
const state={...defaults,...raw,playing:false};
const cap=(k,v)=>Math.max(LIMITS[k][0],Math.min(LIMITS[k][1],Math.trunc(Number(v)||0)));
for(const k of Object.keys(LIMITS))state[k]=cap(k,state[k]);
const two=n=>String(n).padStart(2,'0');
const periods=[['Ae','Duvaen'],['W’i',"W'iosamn"],['La','Arvalla']];
const period=()=>periods[Math.floor(state.hour/7)];
const time=()=>two(state.hour)+':'+two(state.minute);
const date=()=>`Year ${state.year} · Month ${state.month}/8 · Week ${state.week}/5 · Day ${state.day}/6`;
const display=()=>`${date()} · ${period()[0]} ${time()}`;
const source24=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);const mins=Math.min(21*60,Math.round(((h||0)*60+(m||0))*21/24));return two(Math.floor(mins/60))+':'+two(mins%60)};
function persist(){try{localStorage.setItem(KEY,JSON.stringify({...state,playing:false}))}catch(_){}}
function broadcast(){document.dispatchEvent(new CustomEvent('aza-calendar:change',{detail:{...state,time:time()}}));}
function render(){
 for(const k of Object.keys(LIMITS)){if($('aza-'+k))$('aza-'+k).value=String(state[k]);}
 if($('bvs-aza-clock-display'))$('bvs-aza-clock-display').textContent=display();
 if($('bvs-aza-moon-display'))$('bvs-aza-moon-display').textContent=`${period()[0]} · ${period()[1]} · hour ${state.hour%7+1} of 7`;
 if($('bvs-aza-play'))$('bvs-aza-play').textContent=state.playing?'Pause time':'Play time';
 if($('bvs-worldBelavadosClock'))$('bvs-worldBelavadosClock').textContent=`${period()[0]} ${time()}`;
 if($('bvs-worldClockSource'))$('bvs-worldClockSource').textContent=`Aza’raan campaign clock · ${date()}`;
 if($('bvs-provinceClock'))$('bvs-provinceClock').textContent=display();
 persist();broadcast();
}
function apply(raw){for(const k of Object.keys(LIMITS))if(raw[k]!==undefined)state[k]=cap(k,raw[k]);render();}
function dayIndex(){return (((((state.year-1)*8+(state.month-1))*5+(state.week-1))*6)+(state.day-1));}
function setDayIndex(day){const d=Math.max(0,Math.floor(day));state.day=(d%6)+1;state.week=Math.floor(d/6)%5+1;state.month=Math.floor(d/30)%8+1;state.year=Math.floor(d/240)+1;}
function stepMinutes(delta){const mins=state.hour*60+state.minute+delta,carry=Math.floor(mins/(21*60)),left=((mins%(21*60))+(21*60))%(21*60);setDayIndex(dayIndex()+carry);state.hour=Math.floor(left/60);state.minute=left%60;render();}
function onReady(){
 for(const k of Object.keys(LIMITS))$('aza-'+k)?.addEventListener('change',()=>apply({[k]:$('aza-'+k).value}));
 $('bvs-aza-hour-plus')?.addEventListener('click',()=>stepMinutes(60));
 $('bvs-aza-hour-minus')?.addEventListener('click',()=>stepMinutes(-60));
 $('bvs-aza-day-plus')?.addEventListener('click',()=>stepMinutes(1260));
 $('bvs-aza-day-minus')?.addEventListener('click',()=>stepMinutes(-1260));
 $('bvs-aza-play')?.addEventListener('click',()=>{state.playing=!state.playing;render();});
 $('bvs-aza-reset')?.addEventListener('click',()=>{Object.assign(state,defaults);render();});
 // 1 real second equals 1 Aza'raan minute while Play is active; offline time is NOT inferred.
 setInterval(()=>{if(state.playing)stepMinutes(1);else{if($('bvs-worldBelavadosClock'))$('bvs-worldBelavadosClock').textContent=`${period()[0]} ${time()}`;if($('bvs-worldClockSource'))$('bvs-worldClockSource').textContent=`Aza’raan campaign clock · ${date()}`;}},1000);
 // Existing province renderer may update local-time label: restore the Aza display.
 document.addEventListener('belavados:viewchange',()=>{if($('bvs-provinceClock'))$('bvs-provinceClock').textContent=display();});
 render();
}
window.AzaCalendar={getState:()=>({...state,time:time(),period:period()[0]}),apply,stepMinutes,display,source24,period};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
})();

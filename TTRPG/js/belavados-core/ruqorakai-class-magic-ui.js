/* Deity-based class and eleven-school explorer, using the author-approved source data. */
(function(){
'use strict';
const api=window.RuqorakaiClassMagic,$=id=>document.getElementById(id);
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(){
 if(!api||!$('bvs-ruqClassSelect'))return;
 const classSelect=$('bvs-ruqClassSelect'),roleSelect=$('bvs-ruqRoleSelect'),schoolSelect=$('bvs-ruqSchoolSelect');
 classSelect.innerHTML=api.listClasses().map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join('');
 roleSelect.innerHTML=api.data.roles.map(r=>'<option value="'+escape(r.id)+'">'+escape(r.name)+'</option>').join('');
 schoolSelect.innerHTML=api.listSchools().map(s=>'<option value="'+escape(s.id)+'">'+escape(s.name)+'</option>').join('');
 function display(){
  const cls=api.getClass(classSelect.value),path=api.getRole(classSelect.value,roleSelect.value),school=api.getSchool(schoolSelect.value);
  if(cls&&path){
   const skillList=(path.abilities||[]).map(a=>'<li><b>Rank '+a.rank+' · '+escape(a.name)+'</b> — '+escape(a.effect)+'</li>').join('');
   const trial=api.trialFor(cls.id);
   $('bvs-ruqClassInfo').innerHTML='<h4>'+escape(cls.name)+' · '+escape(path.title)+'</h4><p><b>'+escape(cls.deity)+'</b> · '+escape(path.role)+' · ranks 0–20</p>'+
    '<p><b>Trial:</b> '+escape(trial.title||'')+'</p>'+
    (cls.domainConstraint?'<p>'+escape(cls.domainConstraint)+'</p>':'')+
    '<p>'+escape(path.description)+'</p>'+(skillList?'<ol class="ruq-abilities">'+skillList+'</ol>':'')+
    (cls.name==='Thorned Reclaimer'?'<p><b>Historical gate:</b> '+escape(cls.temporalGate||'')+'</p>':'');
  }
  if(school){
   $('bvs-ruqSchoolInfo').innerHTML='<h4>'+escape(school.name)+'</h4>'+
    '<p>'+escape(school.focus)+'</p><p><b>Strong:</b> '+escape(school.strongAgainst.join(' / '))+
    ' · <b>Weak:</b> '+escape(school.weakAgainst.join(' / '))+'</p>'+
    '<p><b>Domain links:</b> '+escape(school.domainLinks)+'</p>'+
    '<p><b>Synergy traits:</b> '+escape(school.synergyTraits.join(', '))+' · <b>Mastery:</b> 0–20</p>'+
    '<ul>'+school.trainingObjects.map(o=>'<li><b>'+escape(o.name)+'</b> — '+escape(o.challenge)+'</li>').join('')+'</ul>';
  }
 }
 classSelect.addEventListener('change',display);roleSelect.addEventListener('change',display);schoolSelect.addEventListener('change',display);
 $('bvs-azaraPantheonDeity')?.addEventListener('change',event=>{
  const cls=api.getClassForDeity(event.target.value)[0];if(cls){classSelect.value=cls.id;display();}
 });
 display();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
/* Embedded class-and-school reference, without introducing a third HTML document. */
(function(){
'use strict';
const api=window.RuqorakaiClassMagic;
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(){
 if(!api||!$('bvs-ruqClassSelect'))return;
 const classSelect=$('bvs-ruqClassSelect'),roleSelect=$('bvs-ruqRoleSelect'),schoolSelect=$('bvs-ruqSchoolSelect');
 classSelect.innerHTML=api.listClasses().map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join('');
 roleSelect.innerHTML=api.data.roles.map(x=>'<option value="'+escape(x.id)+'">'+escape(x.name)+'</option>').join('');
 schoolSelect.innerHTML=api.listSchools().map(x=>'<option value="'+escape(x.id)+'">'+escape(x.name)+'</option>').join('');
 function display(){
  const cls=api.getClass(classSelect.value),role=cls?.roles.find(x=>x.id===roleSelect.value),school=api.getSchool(schoolSelect.value);
  if(cls&&role)$('bvs-ruqClassInfo').innerHTML='<h4>'+escape(cls.name)+' · '+escape(role.title)+'</h4>'+
   '<p>'+escape(cls.deity)+' · '+escape(cls.schools)+'</p><p><b>Trial:</b> '+escape(cls.trial)+'</p>'+
   (cls.domainConstraint?'<p>'+escape(cls.domainConstraint)+'</p>':'')+
   '<p>'+escape(role.description)+'</p>'+
   (cls.name==='Thorned Reclaimer'?'<p><b>Era rule:</b> '+escape(cls.temporalGate)+'</p>':'');
  if(school)$('bvs-ruqSchoolInfo').innerHTML='<h4>'+escape(school.name)+'</h4><p>'+escape(school.focus)+'</p>'+
   '<p><b>Strong:</b> '+escape(school.strongAgainst.join(' / '))+' · <b>Weak:</b> '+escape(school.weakAgainst.join(' / '))+'</p>'+
   '<p><b>Domain links:</b> '+escape(school.domainLinks)+'</p>'+
   '<ul>'+school.trainingObjects.map(o=>'<li><b>'+escape(o.name)+'</b> — '+escape(o.challenge)+'</li>').join('')+'</ul>';
 }
 classSelect.addEventListener('change',display);roleSelect.addEventListener('change',display);schoolSelect.addEventListener('change',display);
 $('bvs-azaraPantheonDeity')?.addEventListener('change',event=>{
  const matching=api.listClasses().find(x=>x.deity===event.target.value);if(matching){classSelect.value=matching.id;display();}
 });
 display();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
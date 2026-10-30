/* Belavadós emblem is decorative; the existing Forge markup and generator remain owned by world-forge-ui.js. */
(()=>{'use strict';
function mountBrand(){const hero=document.querySelector('#belavados-worldforge-root .hero');if(!hero||hero.querySelector('.belavados-brandmark'))return;const logo=document.createElement('img');logo.className='belavados-brandmark';logo.src='../images/belavados-emblem.png';logo.alt='Belavadós Universe emblem';logo.decoding='async';hero.insertBefore(logo,hero.firstChild)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountBrand,{once:true});else mountBrand();
})();

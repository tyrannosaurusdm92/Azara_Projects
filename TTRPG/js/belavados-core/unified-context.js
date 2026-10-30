/* One shared, local Belavados identity; no login, portal, or account switcher.
 * TTRPG/Forge has no backend, login or network chat integration. */
(function(root){'use strict';
 const profile='shared';
 document.documentElement.dataset.profile=profile;
 document.documentElement.dataset.belavadosProfile=profile;
 const apply=()=>{if(document.body)document.body.dataset.profile=profile;};
 apply();document.addEventListener('DOMContentLoaded',apply,{once:true});
 root.BelavadosProfiles=Object.freeze({getActiveProfile:()=>profile});
 root.BelavadosAccess=Object.freeze({profileKey:()=>profile,getProfileKey:()=>profile,isAdmin:()=>false,isAuthenticated:()=>false});
 root.BelavadosUnifiedOnyx=Object.freeze({activeProfile:()=>profile,backdrop:'assets/code/index.html'});
})(window);

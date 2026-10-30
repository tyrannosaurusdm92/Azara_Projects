/* Income for meaningful non-game actions in fullscreen Work mode. */
(()=>{
  "use strict";
  if(window.OnyxWorkIncome)return;

  const REWARDS=Object.freeze({
    message:3,
    attachment:2,
    channel:2,
    export:2,
    project:3,
    catalogFiles:3,
    catalog:1,
    settings:1
  });
  const lastAward=new Map();

  function canAward(action,cooldownMs){
    const now=Date.now(),last=Number(lastAward.get(action)||0);
    if(now-last<cooldownMs)return false;
    lastAward.set(action,now);
    return true;
  }
  function ensureUi(){
    const drawerHeader=document.querySelector('#catalogDrawer .catalog-head');
    if(!drawerHeader)return;
    let badge=document.querySelector('.work-wallet');
    if(!badge){
      badge=document.createElement('output');
      badge.className='work-wallet';
      badge.dataset.onyxCurrencyBalance='';
      badge.setAttribute('aria-label','Shared Onyx wallet');
      badge.title='Shared wallet · Work activity earns copper';
      badge.textContent='🟤0 ⚪0 🪙0 🔘0';
    }
    if(badge.parentElement!==drawerHeader)drawerHeader.prepend(badge);
    if(!document.querySelector('.work-income-toast')){
      const toast=document.createElement('div');
      toast.className='work-income-toast';
      toast.setAttribute('role','status');
      toast.setAttribute('aria-live','polite');
      document.body.append(toast);
    }
    window.OnyxCurrency?.updateReadouts?.();
  }
  function showIncome(amount,reason){
    const badge=document.querySelector(".work-wallet"),toast=document.querySelector(".work-income-toast");
    if(badge){badge.classList.remove("earned");void badge.offsetWidth;badge.classList.add("earned");clearTimeout(showIncome.badgeTimer);showIncome.badgeTimer=setTimeout(()=>badge.classList.remove("earned"),900)}
    if(toast){toast.textContent=`+${amount} copper · ${reason}`;toast.classList.add("show");clearTimeout(showIncome.toastTimer);showIncome.toastTimer=setTimeout(()=>toast.classList.remove("show"),1700)}
  }
  function award(action,amount=REWARDS[action]||1,{cooldown=30000,reason=action}={}){
    if(!window.OnyxCurrency||!canAward(action,cooldown))return {ok:false,reason:"cooldown-or-unavailable"};
    const result=window.OnyxCurrency.credit(amount,{
      id:`work:${action}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
      reason,
      source:"work-fullscreen"
    });
    if(result.ok&&!result.duplicate){
      showIncome(amount,reason);
      try{window.parent.postMessage({source:"belavados-onyx-work-income",type:"earned",detail:{action,amount,reason}},"*")}catch(_){}
    }
    return result;
  }

  document.addEventListener("submit",event=>{
    if(event.target?.id!=="composerForm")return;
    if(String(document.getElementById("messageInput")?.value||"").trim())award("message",REWARDS.message,{cooldown:8000,reason:"Work conversation"});
  },true);

  document.addEventListener("change",event=>{
    if(event.target?.id==="fileInput"&&event.target.files?.length)award("attachment",REWARDS.attachment,{cooldown:12000,reason:"Work attachment"});
  },true);

  document.addEventListener("click",event=>{
    const button=event.target?.closest?.("button");
    if(!button)return;
    if(button.matches("#addChannelButton,#newChannelButton"))award("channel",REWARDS.channel,{cooldown:18000,reason:"Work subtab"});
    else if(button.id==="exportChannelButton")award("export",REWARDS.export,{cooldown:25000,reason:"Work export"});
    else if(button.id==="saveProjectButton"){
      if(String(document.getElementById("projectName")?.value||"").trim())award("project",REWARDS.project,{cooldown:15000,reason:"Work project"});
    }else if(button.id==="catalogButton")award("catalog",REWARDS.catalog,{cooldown:60000,reason:"Project catalog"});
    else if(button.id==="saveSettingsButton")award("settings",REWARDS.settings,{cooldown:60000,reason:"Work settings"});
  },true);

  document.addEventListener("drop",event=>{
    if(event.target?.closest?.("#projectDropzone")&&event.dataTransfer?.files?.length){
      award("catalogFiles",REWARDS.catalogFiles,{cooldown:12000,reason:"Cataloged Work files"});
    }
  },true);

  ensureUi();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUi,{once:true});
  window.OnyxWorkIncome=Object.freeze({REWARDS,award});
})();

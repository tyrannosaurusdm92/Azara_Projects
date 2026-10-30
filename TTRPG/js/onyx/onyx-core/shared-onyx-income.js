/* Income for meaningful non-game actions in the Onyx widget.
 * The shared wallet performs all base-10 denomination rollover.
 */
(()=>{
  "use strict";
  if(window.OnyxIncome)return;

  const REWARDS=Object.freeze({
    message:2,
    attachment:2,
    channel:1,
    savedOutput:1,
    design:1,
    feedback:1,
    imageRequest:2
  });
  const lastAward=new Map();
  const widget=()=>document.getElementById("onyxWidget");
  const moduleMode=()=>String(document.documentElement.dataset.runtimeMode||"module")==="module";

  function canAward(action,cooldownMs){
    const now=Date.now(),last=Number(lastAward.get(action)||0);
    if(now-last<cooldownMs)return false;
    lastAward.set(action,now);
    return true;
  }
  function pulse(amount,reason){
    const badge=document.querySelector(".onyx-wallet-badge");
    if(!badge)return;
    badge.classList.remove("earned");
    void badge.offsetWidth;
    badge.classList.add("earned");
    badge.title=`+${amount} copper · ${reason} · ${window.OnyxCurrency?.format?.()||"Shared wallet"}`;
    clearTimeout(pulse.timer);
    pulse.timer=setTimeout(()=>badge.classList.remove("earned"),900);
  }
  function award(action,amount=REWARDS[action]||1,{cooldown=30000,reason=action}={}){
    if(!moduleMode()||!window.OnyxCurrency||!canAward(action,cooldown))return {ok:false,reason:"cooldown-or-mode"};
    const result=window.OnyxCurrency.credit(amount,{
      id:`widget:${action}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
      reason,
      source:"widget"
    });
    if(result.ok&&!result.duplicate){
      pulse(amount,reason);
      window.dispatchEvent(new CustomEvent("onyx-income-earned",{detail:{action,amount,reason,source:"widget",wallet:result.wallet}}));
    }
    return result;
  }

  document.addEventListener("submit",event=>{
    const form=event.target;
    if(!form?.matches?.("#onyxWidget [data-chat-form]"))return;
    const input=form.querySelector("[data-chat-input]");
    if(String(input?.value||"").trim())award("message",REWARDS.message,{cooldown:8000,reason:"Widget conversation"});
  },true);

  document.addEventListener("change",event=>{
    const input=event.target;
    if(input?.matches?.("#onyxWidget [data-file-input]")&&input.files?.length){
      award("attachment",REWARDS.attachment,{cooldown:12000,reason:"Widget file tool"});
    }
  },true);

  document.addEventListener("click",event=>{
    const target=event.target?.closest?.("#onyxWidget button");
    if(!target)return;
    if(target.matches("[data-new-chat]"))award("channel",REWARDS.channel,{cooldown:20000,reason:"Widget channel"});
    else if(target.matches("[data-save-current],[data-save-thread],[data-download-button]"))award("savedOutput",REWARDS.savedOutput,{cooldown:30000,reason:"Widget saved output"});
    else if(target.matches("[data-image-button]")){
      const server=target.dataset.imageButton,input=widget()?.querySelector(`[data-chat-input="${CSS.escape(server||"")}"]`);
      if(String(input?.value||"").trim())award("imageRequest",REWARDS.imageRequest,{cooldown:15000,reason:"Widget image tool"});
    }
  },true);

  window.addEventListener("onyx:design-action",event=>{
    const action=String(event.detail?.action||"edit");
    award("design",REWARDS.design,{cooldown:20000,reason:`Widget design ${action}`});
  });
  window.addEventListener("onyx:response-feedback",event=>{
    if(event.detail?.active!==false)award("feedback",REWARDS.feedback,{cooldown:20000,reason:"Widget response feedback"});
  });

  window.OnyxIncome=Object.freeze({REWARDS,award});
  window.OnyxCurrency?.updateReadouts?.();
})();

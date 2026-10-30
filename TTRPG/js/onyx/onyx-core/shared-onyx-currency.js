/* Shared Feed Him MEOW / Virtual Health wallet.
 * 10 copper = 1 silver, 10 silver = 1 gold, 10 gold = 1 platinum.
 */
(()=>{
  "use strict";
  if(window.OnyxCurrency)return;

  const STORAGE_KEY="belavados.onyx.currency.v1";
  const MAX_LEDGER=240;
  const VALUES=Object.freeze({copper:1,silver:10,gold:100,platinum:1000});
  const SYMBOLS=Object.freeze({copper:"🟤",silver:"⚪",gold:"🪙",platinum:"🔘"});
  const ORDER=Object.freeze(["copper","silver","gold","platinum"]);

  const integer=value=>Math.max(0,Math.floor(Number(value)||0));
  function toCopper(value){
    if(typeof value==="number")return integer(value);
    if(value?.totalCopper!=null)return integer(value.totalCopper);
    return ORDER.reduce((sum,key)=>sum+integer(value?.[key])*VALUES[key],0);
  }
  function fromCopper(total){
    total=integer(total);
    const platinum=Math.floor(total/1000);total%=1000;
    const gold=Math.floor(total/100);total%=100;
    const silver=Math.floor(total/10);total%=10;
    return {copper:total,silver,gold,platinum};
  }
  function cleanLedger(value){
    return (Array.isArray(value)?value:[]).filter(entry=>entry&&Number.isFinite(Number(entry.amount))).slice(-MAX_LEDGER);
  }
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")||{};
      return {totalCopper:integer(saved.totalCopper),ledger:cleanLedger(saved.ledger),updatedAt:Number(saved.updatedAt)||0};
    }catch(_){return {totalCopper:0,ledger:[],updatedAt:0}}
  }
  let state=load();
  function wallet(){return fromCopper(state.totalCopper)}
  function format(value=state.totalCopper){
    const w=fromCopper(toCopper(value));
    return `${SYMBOLS.copper}${w.copper} ${SYMBOLS.silver}${w.silver} ${SYMBOLS.gold}${w.gold} ${SYMBOLS.platinum}${w.platinum}`;
  }
  function announce(type,detail={}){
    const payload={type,totalCopper:state.totalCopper,wallet:wallet(),formatted:format(),...detail};
    try{window.dispatchEvent(new CustomEvent(type,{detail:payload}))}catch(_){}
    updateReadouts();
    return payload;
  }
  function persist(type,detail){
    state.updatedAt=Date.now();
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_){}
    return announce(type,detail);
  }
  function hasLedgerId(id){return id&&state.ledger.some(entry=>entry.id===id)}
  function credit(value,meta={}){
    const amount=toCopper(value),id=String(meta.id||"");
    if(amount<=0)return {ok:false,reason:"invalid-amount",balance:state.totalCopper,wallet:wallet()};
    if(hasLedgerId(id))return {ok:true,duplicate:true,balance:state.totalCopper,wallet:wallet()};
    state.totalCopper+=amount;
    state.ledger.push({id:id||`credit:${Date.now()}:${Math.random().toString(36).slice(2)}`,kind:"credit",amount,at:Date.now(),reason:String(meta.reason||"Reward"),source:String(meta.source||"")});
    state.ledger=state.ledger.slice(-MAX_LEDGER);
    persist("onyx-currency-change",{kind:"credit",amount,reason:meta.reason||"Reward"});
    return {ok:true,amount,balance:state.totalCopper,wallet:wallet()};
  }
  function spend(value,meta={}){
    const amount=toCopper(value),id=String(meta.id||"");
    if(amount<=0)return {ok:false,reason:"invalid-price",price:amount,balance:state.totalCopper,wallet:wallet()};
    if(hasLedgerId(id))return {ok:true,duplicate:true,amount,balance:state.totalCopper,wallet:wallet()};
    if(state.totalCopper<amount)return {ok:false,reason:"insufficient-funds",price:amount,shortfall:amount-state.totalCopper,balance:state.totalCopper,wallet:wallet()};
    state.totalCopper-=amount;
    state.ledger.push({id:id||`spend:${Date.now()}:${Math.random().toString(36).slice(2)}`,kind:"spend",amount:-amount,at:Date.now(),reason:String(meta.reason||"Purchase"),source:String(meta.source||"")});
    state.ledger=state.ledger.slice(-MAX_LEDGER);
    persist("onyx-currency-change",{kind:"spend",amount,reason:meta.reason||"Purchase"});
    return {ok:true,amount,balance:state.totalCopper,wallet:wallet()};
  }
  function canAfford(value){return state.totalCopper>=toCopper(value)}
  function updateReadouts(){
    const w=wallet();
    document.querySelectorAll("[data-onyx-currency-balance]").forEach(node=>{node.textContent=format();node.dataset.totalCopper=String(state.totalCopper)});
    document.querySelectorAll(".currency").forEach(node=>{
      const spans=node.querySelectorAll("span");
      if(spans.length>=4){spans[0].textContent=SYMBOLS.copper+w.copper;spans[1].textContent=SYMBOLS.silver+w.silver;spans[2].textContent=SYMBOLS.gold+w.gold;spans[3].textContent=SYMBOLS.platinum+w.platinum}
      node.dataset.totalCopper=String(state.totalCopper);
      node.title=`Store balance: ${format()}`;
    });
  }
  function refresh(){state=load();announce("onyx-currency-refresh");return getState()}
  function getState(){return {totalCopper:state.totalCopper,wallet:wallet(),formatted:format(),ledger:state.ledger.slice(),updatedAt:state.updatedAt}}

  window.addEventListener("storage",event=>{if(event.key===STORAGE_KEY)refresh()});
  document.addEventListener("DOMContentLoaded",updateReadouts,{once:true});
  window.OnyxCurrency=Object.freeze({STORAGE_KEY,VALUES,SYMBOLS,ORDER,toCopper,fromCopper,format,credit,spend,canAfford,refresh,getState,updateReadouts});
  updateReadouts();
})();

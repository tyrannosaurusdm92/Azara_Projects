/* AWS keyboard visibility: floating keyboard exists everywhere except Language Evolution Breakdown. */
(()=>{'use strict';const bubble=document.getElementById('keyboardBubble'),keyboard=document.getElementById('keyboard');
function visibility(hidden){if(hidden){window.FloatingKeyboard?.collapse?.();bubble.hidden=true;keyboard.hidden=true;}else {bubble.hidden=false;keyboard.hidden=true;}}
window.addEventListener('aws:keyboard-visibility',e=>visibility(!!e.detail.hidden));
window.addEventListener('aws:view',e=>visibility(e.detail.role==='language-evolution'));
window.addEventListener('load',()=>{const state=window.LiteraryFriendApp?.getSnapshot?.();const ch=state?.channels?.find(x=>x.id===state.selectedChannelId);visibility(ch?.role==='language-evolution');});
})();

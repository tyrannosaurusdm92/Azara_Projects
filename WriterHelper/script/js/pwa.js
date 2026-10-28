/* Install WriterHelper, and retire nested registrations from earlier integrations. */
let installPrompt=null;
const installButton=document.getElementById('wh-install');
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event;
  if(installButton)installButton.hidden=false;
});
installButton?.addEventListener('click',async()=>{
  if(!installPrompt)return;
  await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installButton.hidden=true;
});
window.addEventListener('appinstalled',()=>{installPrompt=null;if(installButton)installButton.hidden=true});
if('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))){
  window.addEventListener('load',async()=>{
    const base=new URL('./',location.href);
    try{
      await navigator.serviceWorker.register(new URL('service-worker.js',base),{scope:base.pathname,updateViaCache:'none'});
      for(const registration of await navigator.serviceWorker.getRegistrations()){
        if(['vendor/keyboard/','vendor/LiteraryFriend/'].some(path=>registration.scope===new URL(path,base).href))
          await registration.unregister();
      }
    }catch(error){console.warn('WriterHelper offline setup:',error)}
  });
}

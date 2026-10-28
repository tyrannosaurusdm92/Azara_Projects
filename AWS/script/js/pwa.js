/* Install Aza’raan Writing Studio, and retire nested registrations from earlier integrations. */
let installPrompt=null;
const button=()=>document.getElementById('aws-nav-install');
const alreadyInstalled=()=>Boolean(navigator.standalone||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: minimal-ui)').matches);
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function notify(message){try{window.LiteraryFriendApp?.notify(message)}catch{}}
function updateInstallButton(){
  const node=button();if(!node)return;
  const label=node.querySelector('.aws-nav-install-label');
  const installed=alreadyInstalled();
  if(label)label.textContent=installed?'Installed':'Download app';
  node.title=installed?'App installed on this device. Use Sync devices to share your library.':'Install Aza’raan Writing Studio on this device';
  node.setAttribute('aria-label',installed?'App installed on this device':'Download app');
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;updateInstallButton()});
window.addEventListener('appinstalled',()=>{installPrompt=null;updateInstallButton();notify('App installed. To share writing across devices, use Tools → Sync devices / restore cloud.')});
async function download(){
  if(alreadyInstalled()){
    notify('This device already has the app. Install from the website on your other device, then use Tools → Sync devices / restore cloud.');
    return 'installed';
  }
  if(installPrompt){
    const prompt=installPrompt;installPrompt=null;
    try{
      await prompt.prompt();const choice=await prompt.userChoice;updateInstallButton();
      if(choice?.outcome==='accepted'){notify('Install requested. Connect the same account on each device and use Sync local → cloud / Restore cloud → local to carry writing between them.');return 'accepted'}
      return 'dismissed';
    }catch(error){notify('Install prompt unavailable: '+error.message);return 'error'}
  }
  if(isIOS())alert('To install on iPhone or iPad, open this site in Safari, tap Share, then choose Add to Home Screen. To share your writing, install on both devices, sign into the same account, sync local work to cloud, then restore it on the other device.');
  else alert('Open your browser menu and choose Install app or Add to Home Screen. The app icon comes from the studio manifest. To share your writing between devices, sign into the same account, choose Sync local → cloud on the device with current work, then Restore cloud → local on the other device.');
  return 'instructions';
}
window.AWSInstall=Object.freeze({download,get available(){return Boolean(installPrompt)}});
document.addEventListener('DOMContentLoaded',updateInstallButton,{once:true});
if('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))){
  window.addEventListener('load',async()=>{
    const base=new URL('./',location.href);
    try{
      await navigator.serviceWorker.register(new URL('service-worker.js',base),{scope:base.pathname,updateViaCache:'none'});
      for(const registration of await navigator.serviceWorker.getRegistrations()){
        if(['vendor/keyboard/','vendor/LiteraryFriend/','script/vendor/keyboard/','script/vendor/LiteraryFriend/','../Aza’raan Writing Studio/','../Aza’raan Writing Studio/vendor/keyboard/','../Aza’raan Writing Studio/vendor/LiteraryFriend/'].some(path=>registration.scope===new URL(path,base).href))
          await registration.unregister();
      }
    }catch(error){console.warn('Aza’raan Writing Studio offline setup:',error)}
  });
}

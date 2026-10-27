/* Register the sole WriterHelper service worker and retire nested vendor registrations. */
if('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))){
  window.addEventListener('load',async()=>{
    const base=new URL('./',location.href);
    try{
      await navigator.serviceWorker.register(new URL('service-worker.js',base),{scope:base.pathname});
      for(const registration of await navigator.serviceWorker.getRegistrations()){
        if(['vendor/keyboard/','vendor/LiteraryFriend/'].some(path=>registration.scope===new URL(path,base).href))
          await registration.unregister();
      }
    }catch(error){console.warn('WriterHelper offline setup:',error)}
  });
}

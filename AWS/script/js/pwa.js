/* Offline shell registration. Large research libraries remain on-demand. */
window.addEventListener('load',()=>{
 if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'}).catch(e=>console.warn('Offline support unavailable:',e.message));
});

/* Print Screen for the web app: requires an explicit browser screen-sharing grant.
   No captured pixels are uploaded, stored remotely, or cached by the service worker. */
export async function captureScreenshot() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw Error('Screen capture is not available in this browser. Use your device’s Print Screen shortcut or a native host.');
  }
  let stream;
  let video;
  try {
    // This call must begin in direct response to a user pressing Print Screen.
    stream = await navigator.mediaDevices.getDisplayMedia({ video:true, audio:false });
    video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    if (!video.videoWidth || !video.videoHeight) {
      await new Promise((resolve,reject) => {
        const timeout = setTimeout(() => reject(Error('The selected screen did not provide a frame.')),4000);
        video.onloadeddata = () => {clearTimeout(timeout);resolve();};
      });
    }
    // Crop-free capture of only the user-approved shared surface.
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video,0,0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
    if (!blob) throw Error('Could not encode the screenshot.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `savanski-screenshot-${new Date().toISOString().replace(/[:.]/g,'-')}.png`;
    link.href = url;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),15000);
    return link.download;
  } finally {
    stream?.getTracks().forEach(track => track.stop());
    if (video) video.srcObject = null;
  }
}

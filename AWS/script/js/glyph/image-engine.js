(function () {
  'use strict';

  let loading = null;
  const scriptUrl = './vendor/opencv.js';

  function runtimeReady() {
    if (window.cv && typeof window.cv.then === 'function') return window.cv;
    if (window.cv && window.cv.Mat) return Promise.resolve(window.cv);
    return null;
  }

  function loadOpenCv() {
    if (loading) return loading;
    const ready = runtimeReady();
    if (ready) { loading = Promise.resolve(ready); return loading; }
    loading = new Promise((resolve, reject) => {
      let finished = false;
      let timer;
      const done = api => { if (finished || !api) return; finished = true; clearInterval(timer); resolve(api); };
      const fail = error => { if (finished) return; finished = true; clearInterval(timer); loading = null; reject(error); };
      const previous = window.Module && window.Module.onRuntimeInitialized;
      window.Module = Object.assign(window.Module || {}, {
        onRuntimeInitialized() { if (typeof previous === 'function') previous(); done(window.cv); }
      });
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        const api = runtimeReady();
        if (api) Promise.resolve(api).then(done, fail);
      };
      script.onerror = () => fail(new Error('The local OpenCV image engine could not load.'));
      document.head.append(script);
      timer = setInterval(() => {
        const api = runtimeReady();
        if (api) Promise.resolve(api).then(done, fail);
      }, 100);
      setTimeout(() => fail(new Error('OpenCV took too long to start.')), 45000);
    });
    return loading;
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(1024, image.naturalWidth || image.width);
        canvas.height = Math.min(1024, image.naturalHeight || image.height);
        const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight, 1);
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      };
      image.onerror = () => reject(new Error('Could not open the selected glyph image.'));
      image.src = dataUrl;
    });
  }

  async function trace(dataUrl, threshold = 185, detail = 1.5) {
    const cv = await loadOpenCv();
    const canvas = await loadImage(dataUrl);
    const source = cv.imread(canvas);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    try {
      cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
      cv.threshold(gray, binary, threshold, 255, cv.THRESH_BINARY_INV);
      const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
      cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel);
      kernel.delete();
      cv.findContours(binary, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
      const all = [];
      for (let index = 0; index < contours.size(); index += 1) {
        const contour = contours.get(index);
        const area = Math.abs(cv.contourArea(contour));
        if (area < 5) { contour.delete(); continue; }
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, Math.max(.7, perimeter * .0025 * Number(detail)), true);
        const values = approx.data32S;
        const points = [];
        for (let point = 0; point + 1 < values.length; point += 2) points.push([values[point] / canvas.width, values[point + 1] / canvas.height]);
        const parent = hierarchy.data32S[index * 4 + 3];
        let depth = 0;
        let ancestor = parent;
        while (ancestor >= 0 && depth < 12) { depth += 1; ancestor = hierarchy.data32S[ancestor * 4 + 3]; }
        if (points.length >= 3) all.push({ points, hole: depth % 2 === 1, area });
        approx.delete();
        contour.delete();
      }
      if (!all.length) throw new Error('No dark contours were found. Increase ink contrast or lower the threshold.');
      const maxPoints = 12000;
      const pointCount = all.reduce((sum, item) => sum + item.points.length, 0);
      if (pointCount > maxPoints) throw new Error('This scan has too much edge detail. Raise Neaten or simplify the image before tracing.');
      return all;
    } finally {
      source.delete(); gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
    }
  }

  async function neaten(dataUrl, threshold = 185, strength = 1) {
    const cv = await loadOpenCv();
    const canvas = await loadImage(dataUrl);
    const source = cv.imread(canvas);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const output = new cv.Mat();
    try {
      cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
      cv.threshold(gray, binary, threshold, 255, cv.THRESH_BINARY_INV);
      const size = Math.max(1, Math.min(9, Math.round(Number(strength) * 2 + 1)));
      const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(size, size));
      cv.morphologyEx(binary, output, cv.MORPH_CLOSE, kernel);
      cv.morphologyEx(output, output, cv.MORPH_OPEN, kernel);
      kernel.delete();
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = 512;
      resultCanvas.height = 512;
      const resultContext = resultCanvas.getContext('2d');
      const pad = (512 - Math.max(canvas.width, canvas.height) * .84) / 2;
      const fit = Math.min(.84 * 512 / canvas.width, .84 * 512 / canvas.height);
      const temp = document.createElement('canvas');
      temp.width = output.cols;
      temp.height = output.rows;
      cv.imshow(temp, output);
      resultContext.drawImage(temp, pad, pad, output.cols * fit, output.rows * fit);
      const pixels = resultContext.getImageData(0, 0, 512, 512);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const luminance = (pixels.data[index] + pixels.data[index + 1] + pixels.data[index + 2]) / 3;
        if (luminance > 190) pixels.data[index + 3] = 0;
        else { pixels.data[index] = 24; pixels.data[index + 1] = 62; pixels.data[index + 2] = 58; }
      }
      resultContext.putImageData(pixels, 0, 0);
      return resultCanvas.toDataURL('image/png');
    } finally { source.delete(); gray.delete(); binary.delete(); output.delete(); }
  }

  window.GlyphImageEngine = { loadOpenCv, trace, neaten };
}());

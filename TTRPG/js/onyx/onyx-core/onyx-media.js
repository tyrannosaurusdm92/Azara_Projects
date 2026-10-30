(function(root){'use strict';
function attachmentKey(a={}){return[String(a.fileId||a.id||''),String(a.url||''),String(a.name||a.fileName||''),Number(a.sizeBytes||a.size||0)].join('|')}
function generateImage(prompt,options={}){return root.OnyxBackendClient?.imageGenerate?.(String(prompt||''),options)}
function parseFile(file,options={}){return root.OnyxBackendClient?.fileParse?.(file,options)}
root.OnyxMedia=Object.freeze({attachmentKey,generateImage,parseFile});
})(window);

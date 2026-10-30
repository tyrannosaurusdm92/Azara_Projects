(function(root){'use strict';
function plan({lane='virtual',mode='chat',listenOnly=false,serious=false}={}){return{identity:'Onyx',tone:serious?'direct-caring':listenOnly?'receptive':'warm-dry',lane,mode,avoid:['shaming','generic assistant filler','forced therapy framing','fabricated sensor claims'],keep:['service-cat personality','natural conversation','clear useful answers']}}
root.OnyxVoice=Object.freeze({plan});
})(window);

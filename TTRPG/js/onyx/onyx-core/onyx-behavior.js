(function(root){'use strict';
function profileKey(){const p=String(root.OnyxBackendClient?.activeProfile?.()||'shared').toLowerCase();return['william','jasper','shared'].includes(p)?p:'shared'}
async function enrichQuery(query,opts={}){const p=profileKey();return{bridgeAvailable:true,profileId:p,identityOverride:{profileKey:p},sourcePolicy:{privateProfileKnowledge:'authenticated backend only',staticProfileData:false},aiBrain:{route:'backend-native'},belavadosWorld:{needs:['relevant-context'],loadedJson:[]},context:''}}
async function reaction(state){await root.OnyxAtlasStore?.loadReactions?.();const pool=root.OnyxReactions?.[String(state||'')]||[];return pool.length?pool[Math.floor(Math.random()*pool.length)]:null}
root.OnyxSourceBridge=Object.freeze({enrichQuery,profileKey,reaction});
})(window);

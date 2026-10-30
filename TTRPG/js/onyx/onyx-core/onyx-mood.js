/* Belavados has exactly five public Onyx static-image moods. */
(function(root){'use strict';
const names=Object.freeze(['thinking','listening','snuggly','hungry','judgmental']);
const ids=Object.freeze(names.map(m=>'onyx_'+m));
const aliases=Object.freeze({
  thoughtful:'thinking',advising_professor:'thinking',professor:'thinking',advising:'thinking',clipboard:'thinking',
  curious:'thinking',think:'thinking',inspect:'thinking',checkin:'thinking',pawtap:'thinking',
  caring:'snuggly',purring:'snuggly',sleepy:'snuggly',sleep:'snuggly',nap:'snuggly',
  resting:'snuggly',rest:'snuggly',cozy:'snuggly',purr:'snuggly',nuzzle:'snuggly',pet:'snuggly',
  scratch:'snuggly',brush:'snuggly',blep:'snuggly',wake:'snuggly',zoom:'snuggly',
  knead:'snuggly',slowblink:'snuggly',bowtie:'snuggly',play:'snuggly',
  loaf:'snuggly',pillow:'snuggly',blanket:'snuggly',returnwarm:'snuggly',sprawl:'snuggly',
  fan:'snuggly',stretch:'snuggly',rotisserie:'snuggly',
  feed:'hungry',treat:'hungry',food:'hungry',
  judge:'judgmental',grumble:'judgmental',sermon:'judgmental',bored:'judgmental',overstimulated:'judgmental',sit:'judgmental',
  listen:'listening',alert:'listening',watch:'listening',patrol:'listening',boundary:'listening',pounce:'listening'
});
const token=v=>String(v||'').trim().toLowerCase().replace(/^onyx_/,'').replace(/[\s-]+/g,'_');
const normalizeOrNull=v=>{const t=token(v);return names.includes(t)?t:(aliases[t]||null)};
const normalize=v=>normalizeOrNull(v)||'listening';
const toId=Object.freeze(Object.fromEntries(names.map(m=>[m,'onyx_'+m])));
const toName=Object.freeze(Object.fromEntries(names.map(m=>['onyx_'+m,m])));
root.OnyxMoodContract=Object.freeze({names,ids,aliases,toId,toName,normalize,normalizeOrNull,
  isCanonical:v=>names.includes(token(v)),toCanonicalId:v=>'onyx_'+normalize(v)});
})(window);

(function(global){
  'use strict';
  const LF=global.LF;

  const FILLERS=['very','really','just','quite','rather','actually','basically','literally','somewhat','maybe','perhaps','suddenly','somehow','thing','things','stuff','got','get','went','nice','good','bad','beautiful','interesting'];
  const WEAK_PHRASES=['there is','there are','there was','there were','began to','started to','seemed to','appeared to','in order to','due to the fact that','at this point in time','for the purpose of'];
  const SENSORY={sight:['saw','looked','visible','bright','dark','color','glow','shadow'],sound:['heard','sound','voice','whisper','shout','silence','ring','hum'],touch:['felt','touch','rough','smooth','warm','cold','soft','hard'],smell:['smell','scent','odor','perfume','stink','aroma'],taste:['taste','sweet','bitter','salty','sour','savory']};
  const COMMON_WORDS=new Set(('the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because these give day most us is are was were been being am has had did does doing very really quite rather much many more most less least own same too s t don should now').split(/\s+/));

  function plain(text){return LF.stripHtml(text||'').replace(/\s+/g,' ').trim();}
  function words(text){return plain(text).match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9’'-]+/g)||[];}
  function sentences(text){return plain(text).split(/(?<=[.!?…])\s+(?=["“‘']?[A-Z0-9])/).map(s=>s.trim()).filter(Boolean);}
  function syllables(word){word=String(word||'').toLowerCase().replace(/[^a-z]/g,'');if(word.length<=3)return word?1:0;word=word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');const m=word.match(/[aeiouy]{1,2}/g);return Math.max(1,m?m.length:1);}

  LF.writer={
    stats(text){
      const p=plain(text),w=words(p),s=sentences(p),paras=String(text||'').replace(/<\/(p|div|h[1-6]|li)>/gi,'\n').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'').split(/\n\s*\n|\n/).filter(x=>x.trim()).length|| (p?1:0);
      const chars=p.length,charsNoSpaces=p.replace(/\s/g,'').length;const mins=w.length/230;
      const syll=w.reduce((n,x)=>n+syllables(x),0);const asl=w.length/Math.max(1,s.length);const asw=syll/Math.max(1,w.length);const flesch=LF.clamp(206.835-(1.015*asl)-(84.6*asw),0,100);
      return{words:w.length,sentences:s.length,paragraphs:paras,characters:chars,charactersNoSpaces:charsNoSpaces,readingMinutes:Math.max(1,Math.ceil(mins)),avgSentence:+asl.toFixed(1),flesch:+flesch.toFixed(1)};
    },
    readabilityLabel(score){return score>=80?'Very easy':score>=70?'Easy':score>=60?'Standard':score>=50?'Fairly difficult':score>=30?'Difficult':'Very difficult';},
    repeatedWords(text,limit=20){const counts=new Map();for(const w of words(text).map(x=>x.toLowerCase())){if(w.length<4||COMMON_WORDS.has(w))continue;counts.set(w,(counts.get(w)||0)+1);}return [...counts].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([word,count])=>({word,count}));},
    phraseCounts(text){const p=plain(text).toLowerCase();return [...FILLERS,...WEAK_PHRASES].map(phrase=>({phrase,count:(p.match(new RegExp(`\\b${phrase.replace(/ /g,'\\s+')}\\b`,'g'))||[]).length})).filter(x=>x.count).sort((a,b)=>b.count-a.count);},
    adverbs(text){const list=words(text).filter(w=>/ly$/i.test(w)&&!/(family|only|early|friendly|lovely|likely|lonely|ugly|holy|silly)$/i.test(w));const c={};list.forEach(w=>c[w.toLowerCase()]=(c[w.toLowerCase()]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([word,count])=>({word,count}));},
    passiveCandidates(text){return sentences(text).filter(s=>/\b(?:am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?\w+(?:ed|en)\b/i.test(s)).slice(0,30);},
    sentenceLengths(text){return sentences(text).map(s=>words(s).length);},
    dialogueRatio(text){const p=plain(text);const quoted=(p.match(/[“"][^”"]+[”"]/g)||[]).join(' ');const q=words(quoted).length,total=words(p).length;return total?Math.round(q/total*100):0;},
    sensory(text){const p=plain(text).toLowerCase();const out={};Object.entries(SENSORY).forEach(([sense,list])=>out[sense]=list.reduce((n,w)=>n+(p.match(new RegExp(`\\b${w}\\w*\\b`,'g'))||[]).length,0));return out;},
    analyze(text){const st=this.stats(text),lengths=this.sentenceLengths(text);const mean=lengths.reduce((a,b)=>a+b,0)/Math.max(1,lengths.length);const variance=lengths.reduce((n,x)=>n+Math.pow(x-mean,2),0)/Math.max(1,lengths.length);return{stats:st,repeated:this.repeatedWords(text),phrases:this.phraseCounts(text),adverbs:this.adverbs(text),passive:this.passiveCandidates(text),dialogueRatio:this.dialogueRatio(text),sensory:this.sensory(text),sentenceVariation:+Math.sqrt(variance).toFixed(1),longSentences:sentences(text).filter(s=>words(s).length>35).slice(0,20),shortRun:findShortSentenceRun(sentences(text))};},
    findReplacePreview(text,find,replacement,{caseSensitive=false,wholeWord=false,regex=false}={}){if(!find)return{text,count:0};let re;try{const source=regex?find:(wholeWord?`\\b${escapeRegExp(find)}\\b`:escapeRegExp(find));re=new RegExp(source,caseSensitive?'g':'gi');}catch(err){throw new Error(`Invalid search pattern: ${err.message}`);}let count=0;const next=String(text||'').replace(re,m=>{count++;return typeof replacement==='function'?replacement(m):replacement;});return{text:next,count};},
    extractLinks(html){const box=document.createElement('div');box.innerHTML=html||'';return [...box.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')}));},
    extractWikiLinks(text){return [...String(text||'').matchAll(/\[\[([^\]]{1,180})\]\]/g)].map(m=>m[1].trim());},
    smartQuotes(text){return String(text||'').replace(/(^|[\s([{])"(?=\S)/g,'$1“').replace(/"/g,'”').replace(/(^|[\s([{])'(?=\S)/g,'$1‘').replace(/'/g,'’');},
    sceneQuestions(scene={}){return[
      `What does the viewpoint character want in ${scene.title||'this scene'}?`,
      'What changes between the opening and closing beat?',
      'What concrete obstacle prevents the easiest path?',
      'Which character relationship is altered, tested, or revealed?',
      'What new question, pressure, or consequence pulls the reader forward?',
      'Which sensory detail makes the setting specific to this moment?',
      'Can any exposition be converted into action, conflict, or discovery?',
      'Does each speaker sound recognizably like themselves?'
    ];},
    preflight(project={},scene={}){return[
      {label:'Scene objective is specific',done:!!scene.objective},
      {label:'Point of view is chosen',done:!!scene.pov},
      {label:'Location is known',done:!!scene.location},
      {label:'Time/date relationship is known',done:!!scene.timeLabel},
      {label:'Characters present are identified',done:Array.isArray(scene.characters)&&scene.characters.length>0},
      {label:'Conflict or pressure is stated',done:!!scene.conflict},
      {label:'Ending change or turn is planned',done:!!scene.turn},
      {label:'Project premise is available for context',done:!!project.premise}
    ];},
    continuityScan({documents=[],entities=[],timeline=[]}={}){
      const issues=[];const full=documents.map(d=>plain(d.content)).join('\n');
      const todos=[...full.matchAll(/\b(?:TODO|FIXME|TK|TBD|CHECK|RESEARCH)\b[^.!?\n]{0,120}/gi)].slice(0,50);todos.forEach(m=>issues.push({issueType:'placeholder',severity:'medium',title:`Draft marker: ${m[0].slice(0,70)}`,description:'An unresolved drafting marker remains in manuscript text.'}));
      entities.forEach(e=>{const names=[e.name,...(e.aliases||[])].filter(Boolean);if(!names.length)return;const hits=names.reduce((n,name)=>n+(full.toLowerCase().split(name.toLowerCase()).length-1),0);if(hits===0)issues.push({issueType:'entity',severity:'low',title:`Unused entity: ${e.name}`,description:'This project entity is not currently named in manuscript text.'});});
      const cap=new Map();for(const m of full.matchAll(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g)){const key=m[0].toLowerCase();if(!cap.has(key))cap.set(key,new Set());cap.get(key).add(m[0]);}for(const variants of cap.values()){if(variants.size>1)issues.push({issueType:'spelling',severity:'medium',title:`Capitalization variants: ${[...variants].join(' / ')}`,description:'Check whether these variants refer to the same proper noun.'});}
      const times=timeline.filter(t=>t.sortOrder!=null).sort((a,b)=>Number(a.sortOrder)-Number(b.sortOrder));for(let i=1;i<times.length;i++){if(Number(times[i].sortOrder)<Number(times[i-1].sortOrder))issues.push({issueType:'timeline',severity:'high',title:'Timeline order conflict',description:`${times[i].title} sorts before an earlier event.`});}
      return issues.slice(0,100);
    },
    citation(item,style='mla'){
      const author=(item.author||'').trim(),title=(item.title||'Untitled').trim(),site=(item.publication||item.site||'').trim(),date=(item.publishedAt||'').trim(),url=(item.url||'').trim(),access=LF.formatDate(LF.now());
      if(style==='chicago')return `${author?author+'. ':''}“${title}.”${site?' '+site+'.':''}${date?' '+date+'.':''}${url?' '+url+'.':''} Accessed ${access}.`;
      if(style==='apa')return `${author||'Author unknown'}. (${date||'n.d.'}). ${title}.${site?' '+site+'.':''}${url?' '+url:''}`;
      return `${author?author+'. ':''}“${title}.”${site?' '+site+',':''}${date?' '+date+',':''}${url?' '+url+'.':''} Accessed ${access}.`;
    },
    exportMarkdown(record){const title=record.title||record.name||'Untitled';const tags=(record.tags||[]).map(t=>`#${t}`).join(' ');let body=record.content||record.description||record.notes||'';body=htmlToMarkdown(body);return `# ${title}\n\n${tags?tags+'\n\n':''}${body}\n`;},
    markdownToHtml(md){let s=LF.escapeHtml(String(md||''));s=s.replace(/^######\s+(.+)$/gm,'<h6>$1</h6>').replace(/^#####\s+(.+)$/gm,'<h5>$1</h5>').replace(/^####\s+(.+)$/gm,'<h4>$1</h4>').replace(/^###\s+(.+)$/gm,'<h3>$1</h3>').replace(/^##\s+(.+)$/gm,'<h2>$1</h2>').replace(/^#\s+(.+)$/gm,'<h1>$1</h1>');s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');s=s.replace(/^>\s?(.+)$/gm,'<blockquote>$1</blockquote>').replace(/^[-*]\s+(.+)$/gm,'<li>$1</li>').replace(/(?:<li>.*<\/li>\n?)+/g,m=>`<ul>${m}</ul>`);return s.split(/\n{2,}/).map(x=>/^<(h\d|ul|blockquote)/.test(x)?x:`<p>${x.replace(/\n/g,'<br>')}</p>`).join('');}
  };

  function escapeRegExp(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  function findShortSentenceRun(list){let best=[],run=[];for(const s of list){if(words(s).length<=5){run.push(s);if(run.length>best.length)best=[...run];}else run=[];}return best.slice(0,8);}
  function htmlToMarkdown(html){const box=document.createElement('div');box.innerHTML=html||'';const walk=node=>{if(node.nodeType===3)return node.nodeValue;if(node.nodeType!==1)return'';const tag=node.tagName.toLowerCase(),inner=[...node.childNodes].map(walk).join('');if(/^h[1-6]$/.test(tag))return `${'#'.repeat(Number(tag[1]))} ${inner}\n\n`;if(tag==='p'||tag==='div')return `${inner}\n\n`;if(tag==='br')return'\n';if(tag==='strong'||tag==='b')return`**${inner}**`;if(tag==='em'||tag==='i')return`*${inner}*`;if(tag==='code')return`\`${inner}\``;if(tag==='blockquote')return`> ${inner.replace(/\n/g,'\n> ')}\n\n`;if(tag==='li')return`- ${inner}\n`;if(tag==='a')return`[${inner}](${node.getAttribute('href')||''})`;if(tag==='hr')return'---\n\n';return inner;};return walk(box).replace(/\n{3,}/g,'\n\n').trim();}
})(window);

/* npm install --no-save playwright; PLAYWRIGHT_MODULE and CHROME_BINARY can override it. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const output=process.env.TEST_ARTIFACT_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'aws-qa-'));
fs.mkdirSync(output,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json','.wasm':'application/wasm'};
const passed=[];
function pass(name){passed.push(name);console.log('PASS '+name)}
async function main(){
  const errors=[],missing=[];
  const server=http.createServer((req,res)=>{
    const filename=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname.replace(/^\/AWS\//,'')));
    if(!filename.startsWith(root+'/')||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
      missing.push(req.url);res.writeHead(404).end();return;
    }
    res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BINARY||undefined,args:JSON.parse(process.env.TEST_CHROME_ARGS||'["--no-sandbox"]')});
  let page;
  try{
    const context=await browser.newContext({viewport:{width:1600,height:1100},acceptDownloads:true});
    page=await context.newPage();
    page.on('pageerror',e=>{errors.push(e.message);console.error('Page error:',e.message)});
    await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
    const url=origin+'/AWS/index.html';
    const ready=async()=>{
      await page.waitForFunction(()=>window.LiteraryFriendApp?.getSnapshot()?.workspaces?.length===9);
      await page.waitForFunction(()=>document.getElementById('wh-aza-book-frame').contentWindow.AZA_STUDIO&&document.getElementById('wh-language-frame').contentWindow.AZA_STUDIO);
    };
    await page.goto(url);await ready();
    const state=await page.evaluate(()=>LiteraryFriendApp.getSnapshot());
    assert.equal(state.channels.length,46);
    assert.equal(state.workspaces[8].name,'09 Book Eight: Unraveled');
    pass('All nine sections and 46 starter pages');

    assert.equal(await page.title(),'Aza’raan Writing Studio');
    const nav=page.locator('#aws-master-nav'),grip=nav.getByRole('button',{name:'Move master navigation',exact:true});
    const before=await nav.boundingBox(),drag=await grip.boundingBox();
    await page.mouse.move(drag.x+drag.width/2,drag.y+drag.height/2);await page.mouse.down();
    await page.mouse.move(drag.x+drag.width/2+80,drag.y+drag.height/2+90,{steps:8});await page.mouse.up();
    const after=await nav.boundingBox();assert(after.x>before.x+50&&after.y>before.y+50);
    const edgeGrip=await grip.boundingBox();await page.mouse.move(edgeGrip.x+10,edgeGrip.y+10);await page.mouse.down();
    await page.mouse.move(1550,1050,{steps:8});await page.mouse.up();
    await nav.locator('summary').filter({hasText:'Sections'}).click();
    await page.waitForFunction(()=>document.querySelector('#aws-master-nav details[open] .aws-nav-menu')?.style.position==='fixed');
    const menu=await nav.locator('details[open] .aws-nav-menu').boundingBox();
    assert(menu.x>=0&&menu.y>=0&&menu.x+menu.width<=1600&&menu.y+menu.height<=1100);
    await nav.locator('summary').filter({hasText:'Sections'}).click();
    pass('Moved navigation menus stay inside the viewport and can open above the bar');
    await nav.getByRole('button',{name:'Collapse master navigation',exact:true}).click();
    const bubble=page.locator('#aws-nav-bubble'),bubbleStart=await bubble.boundingBox();
    await page.mouse.move(bubbleStart.x+20,bubbleStart.y+20);await page.mouse.down();
    await page.mouse.move(bubbleStart.x+140,bubbleStart.y-100,{steps:8});await page.mouse.up();
    assert.equal(await nav.isVisible(),false,'Dragging a bubble must not accidentally open it');
    const bubbleMoved=await bubble.boundingBox();assert(bubbleMoved.x>bubbleStart.x+90);
    pass('Master navigation and its collapsed bubble both drag without accidental toggles');
    await page.reload();await ready();
    assert.equal(await nav.isVisible(),false);
    assert(Math.abs((await bubble.boundingBox()).x-bubbleMoved.x)<2);
    await bubble.click();await grip.press('ArrowLeft');
    assert.equal(await nav.isVisible(),true);
    await nav.locator('summary').filter({hasText:'Tools'}).click();
    await nav.getByRole('button',{name:'Reset navigation position',exact:true}).click();
    pass('Collapsed state and positions survive reload; navigation also moves with arrow keys');
    await nav.locator('summary').filter({hasText:'Sections'}).click();
    await nav.getByRole('button',{name:'09 Book Eight: Unraveled',exact:true}).click();
    await nav.locator('summary').filter({hasText:'Pages'}).click();
    await nav.getByRole('button',{name:'Drafting Table',exact:true}).click();
    assert.equal(await page.locator('.rich-editor').count(),2);
    await nav.locator('summary').filter({hasText:'Sections'}).click();
    await nav.getByRole('button',{name:'Modern',exact:true}).click();
    assert.equal(await page.evaluate(()=>LiteraryFriendApp.currentDocument().title),'Modern');
    await nav.locator('summary').filter({hasText:'Sections'}).click();
    await page.screenshot({path:path.join(output,'master-navigation.png')});
    await nav.locator('summary').filter({hasText:'Sections'}).click();
    pass('Master menus navigate books, drafting pages and individual language eras');

    const language=page.frameLocator('#wh-language-frame');
    for(const era of ['Proto','Ancient','Archaic','Classical','Traditional','Modern']){
      await page.locator('#writing-channels .channel-button').filter({hasText:era}).click();
      if(['Proto','Ancient'].includes(era))await language.locator('#tab-evolution').getAttribute('aria-selected').then(v=>assert.equal(v,'true'));
      else await language.locator('#era').inputValue().then(v=>assert.equal(v,era));
    }
    const channelBounds=await page.locator('#channels-pane').boundingBox();
    const studioBounds=await page.locator('#wh-language-overlay').boundingBox();
    assert(studioBounds.x>=channelBounds.x+channelBounds.width-1);
    pass('Six era channels remain clickable beside the studio');
    const key=language.locator('.key[data-letter="B"]');
    await key.hover();await page.mouse.down();
    await language.locator('#palette-backdrop').waitFor({state:'visible'});await page.mouse.up();
    assert.deepEqual(await language.locator('.family-option strong').allTextContents(),['B','F','V','W']);
    await language.locator('.family-option[data-base="B"]').click();
    for(const mark of ['C01','K01','S01'])await language.locator('.mark-choice[data-id="'+mark+'"]').click();
    assert.equal(await language.locator('#draft-count').textContent(),'3/3 stacked marks');
    await language.locator('#palette-close').click();
    pass('Real long press opens B/F/V/W and accepts a three-mark stack');

    await page.locator('#wh-open-font-workshop').click();
    await page.waitForFunction(()=>/Modern (font ready|draft restored)/.test(document.getElementById('wh-font-status').textContent));
    for(const [id,value] of Object.entries({'wh-font-family':'WriterHelper QA Modern','wh-font-designer':'WriterHelper QA','wh-font-license':'Test license','wh-font-license-url':'https://example.test/license'}))await page.locator('#'+id).fill(value);
    await page.locator('#wh-font-baseline').fill('30');await page.locator('#wh-font-baseline').dispatchEvent('input');
    await page.locator('#wh-font-spacing').fill('20');await page.locator('#wh-font-spacing').dispatchEvent('input');
    await page.locator('#wh-font-kern-left').fill('U+1780');await page.locator('#wh-font-kern-right').fill('U+1781');
    await page.locator('#wh-font-kern-value').fill('-45');await page.locator('#wh-font-kern-save').click();
    assert.match(await page.locator('#wh-font-kern-list').textContent(),/-45/);
    await page.locator('#wh-font-new-codepoint').fill('U+E101');await page.locator('#wh-font-add-glyph').click();
    await page.locator('#wh-font-glyph-name').fill('qaNewGlyph');
    const png=await page.evaluate(()=>{
      const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,128,128);ctx.fillStyle='#000';ctx.fillRect(28,18,72,92);ctx.fillStyle='#fff';ctx.fillRect(45,35,38,58);
      return c.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#wh-font-glyph-upload').setInputFiles({name:'white-background-glyph.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await page.waitForFunction(()=>document.getElementById('wh-font-status').textContent.startsWith('Glyph outline imported'));
    await page.locator('#wh-font-offset-x').fill('15');await page.locator('#wh-font-scale-x').fill('90');await page.locator('#wh-font-transform').click();
    await page.locator('#wh-font-save').click();
    await page.waitForFunction(()=>document.getElementById('wh-font-status').textContent.includes('saved in this browser'));
    const fontDownload=page.waitForEvent('download');await page.locator('#wh-font-export').click();
    await (await fontDownload).saveAs(path.join(output,'edited-modern.ttf'));
    await page.locator('#wh-font-use').click();
    await page.waitForFunction(()=>document.getElementById('wh-font-status').textContent.includes('saved for books'));
    const family=await page.evaluate(()=>WriterHelperFonts.family('Modern'));
    assert.match(family,/^WH-Modern-/);
    pass('Metadata, baseline, global spacing, pair spacing, PNG tracing and TTF download');
    const projectDownload=page.waitForEvent('download');await page.locator('#wh-font-export-json').click();
    await (await projectDownload).saveAs(path.join(output,'modern-project.json'));
    await page.locator('#wh-font-era').selectOption('Proto');
    await page.waitForFunction(()=>document.getElementById('wh-font-status').textContent.startsWith('Proto font ready'));
    await page.locator('#wh-font-new-codepoint').fill('U+E102');await page.locator('#wh-font-add-glyph').click();await page.locator('#wh-font-glyph-name').fill('protoGlyph');
    await page.locator('#wh-font-glyph-upload').setInputFiles({name:'proto.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 90 L50 10 L90 90 Z"/></svg>')});
    await page.waitForFunction(()=>document.getElementById('wh-font-status').textContent.startsWith('Glyph outline imported'));
    const protoDownload=page.waitForEvent('download');await page.locator('#wh-font-export').click();
    await (await protoDownload).saveAs(path.join(output,'new-proto.ttf'));
    await page.locator('#wh-font-import-json').setInputFiles(path.join(output,'modern-project.json'));
    await page.waitForFunction(()=>document.getElementById('wh-font-status').textContent.startsWith('Imported Modern font project'));
    assert.equal(await page.locator('#wh-font-family').inputValue(),'WriterHelper QA Modern');
    pass('Proto glyph creation, SVG import and portable font project round trip');
    await page.screenshot({path:path.join(output,'font-workshop.png')});
    await page.locator('#wh-font-close').click();

    for(let book=1;book<=8;book++){
      await page.locator('#workspace-list .workspace-pill').nth(book).click();
      await page.locator('.rich-editor').first().click({position:{x:20,y:20}});
      await page.frameLocator('#wh-aza-book-frame').locator('.key[data-letter="A"]').click();
      await page.waitForFunction(()=>document.querySelector('.rich-editor').textContent.includes('ឯ'));
    }
    pass('Aza’raan keyboard inserts into every book');
    const phrase='ត៊ា រ័ ត៊ា',selection='រ័ ត៊ា';
    for(let book=1;book<=8;book++){
      await page.locator('#workspace-list .workspace-pill').nth(book).click();
      await page.evaluate(({phrase,family})=>LiteraryFriendApp.appendCurrent('<p>English before <span style="font-family:'+family+'">'+phrase+'</span> English after</p>'),{phrase,family});
      await page.locator('.rich-editor').evaluate((editor,selection)=>{
        editor.focus();const span=editor.querySelector('p:last-child span'),node=span.firstChild,start=node.textContent.indexOf(selection),range=document.createRange();
        range.setStart(node,start);range.setEnd(node,start+selection.length);const selected=getSelection();selected.removeAllRanges();selected.addRange(range);
      },selection);
      await page.waitForFunction(selection=>getSelection().toString()===selection,selection);
      await page.locator('#wh-input-mode').selectOption('qwerty');
      await page.locator('#wh-aza-speak').click();
      assert.equal(await page.frameLocator('#wh-aza-book-frame').locator('#speechText').inputValue(),selection,'Speak must read exactly the selected Aza’raan sentence in QWERTY mode');
      await page.locator('#wh-aza-stop').click();
    }
    pass('Selected Aza’raan sentences, excluding surrounding English, reach TTS in all eight books even in QWERTY mode');
    await page.locator('#wh-input-mode').selectOption('qwerty');
    const q=page.frameLocator('#wh-kb-frame');
    await q.locator('.sk-key[data-key="a"]').click();
    await page.waitForFunction(()=>document.querySelector('.rich-editor').textContent.includes('a'));
    await page.locator('#wh-sound-pack').selectOption('classic');
    await q.locator('.sk-key[data-key="b"]').click();
    await page.waitForFunction(()=>document.getElementById('wh-kb-frame').contentWindow.SavanskiKeyboardAudio?.buffers?.size>0);
    await page.locator('#wh-audio-on').uncheck();
    assert.equal(await page.evaluate(()=>document.getElementById('wh-kb-frame').contentWindow.SavanskiKeyboardAudio.muted),true);
    await page.locator('#wh-audio-on').check();
    pass('QWERTY insertion, decoded key audio and the shared mute control');
    await page.locator('#wh-input-mode').selectOption('aza');
    await page.locator('#new-studio').click();
    await page.locator('#dialog-fields input').first().fill('QA two pane');await page.locator('#dialog-submit').click();
    await page.locator('.rich-editor').nth(1).click({position:{x:20,y:20}});
    await page.frameLocator('#wh-aza-book-frame').locator('.key[data-letter="B"]').click();
    await page.waitForFunction(()=>document.querySelectorAll('.rich-editor')[1]?.textContent.includes('ប'));
    assert.equal(await page.locator('.rich-editor').first().textContent(),'');
    pass('The keyboard targets the selected right-hand drafting pane');
    await page.locator('#new-writing').click();await page.locator('#dialog-fields input').first().fill('QA new page');await page.locator('#dialog-submit').click();
    await page.locator('.rich-editor').click({position:{x:20,y:20}});
    await page.frameLocator('#wh-aza-book-frame').locator('.key[data-letter="A"]').click();
    await page.waitForFunction(()=>document.querySelector('.rich-editor').textContent.includes('ឯ'));
    assert.match(await page.locator('.rich-editor span').first().getAttribute('style'),new RegExp(family));
    await page.locator('#export-doc').click();
    const htmlDownload=page.waitForEvent('download');await page.locator('#dialog-submit').click();
    await (await htmlDownload).saveAs(path.join(output,'manuscript.html'));
    assert(fs.readFileSync(path.join(output,'manuscript.html'),'utf8').includes('data:font/ttf;base64,'));
    pass('New pages use the custom era font and exported manuscripts embed it');
    await page.evaluate(()=>{
      window.whSpeakClicks=0;
      document.getElementById('wh-aza-book-frame').contentDocument.getElementById('speakText').addEventListener('click',()=>window.whSpeakClicks++);
    });
    await page.locator('#wh-aza-speak').click();
    assert.equal(await page.evaluate(()=>window.whSpeakClicks),1);
    assert.match(await page.frameLocator('#wh-aza-book-frame').locator('#speechText').inputValue(),/ឯ/);
    await page.locator('#wh-aza-stop').click();
    pass('Book Speak/Stop routes the manuscript to the canonical Aza’raan voice engine');
    const endpoint='https://script.google.com/macros/s/AKfycbyvpUn2_fADmOAOMqh1pHatTlegwZKYloWRPSSrM1kBkSwP2l5LzADQ7jKMr7TCJJP2/exec';
    await context.route(endpoint+'?action=bridge',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><script>
      const allowed=${JSON.stringify(origin)};
      addEventListener('message',event=>{
        if(event.source!==parent||event.origin!==allowed)return;
        const msg=event.data;if(msg.type!=='AWS_RPC_REQUEST')return;
        const action=msg.payload.action;
        const result=action==='auth.login'?{ok:true,token:'fixture-session-token',user:{username:'QA'}}:{ok:true,action};
        parent.postMessage({type:'AWS_RPC_RESPONSE',id:msg.id,result},allowed);
      });parent.postMessage({type:'AWS_RPC_READY'},allowed);
    <\/script>`}));
    assert.equal(await page.evaluate(async()=>{const r=await WriterHelperBridge.request('auth.login',{email:'qa@example.invalid',password:'fixture'});return !!r.token&&WriterHelperBridge.signedIn}),true);
    await page.evaluate(()=>LiteraryFriendCloud.logout());
    assert.equal(await page.evaluate(()=>WriterHelperBridge.signedIn),false);
    pass('AWS_RPC_* request/response contract and shared session lifecycle (mock server)');
    await page.screenshot({path:path.join(output,'book-workspace.png')});
    await page.evaluate(()=>new Promise(resolve=>{
      const listener=()=>{removeEventListener('literaryfriend:saved',listener);resolve()};
      addEventListener('literaryfriend:saved',listener);document.querySelector('.rich-editor').dispatchEvent(new InputEvent('input',{bubbles:true}));
    }));
    await page.reload();await ready();
    assert.match(await page.locator('.rich-editor').textContent(),/ឯ/);
    await page.waitForFunction(font=>document.fonts.check('20px "'+font+'"'),family);
    assert.equal(await page.evaluate(()=>WriterHelperFonts.family('Modern')),family);
    pass('Manuscripts and applied fonts survive reload');
    await page.waitForFunction(()=>navigator.serviceWorker.controller,{timeout:60000});
    await context.setOffline(true);await page.reload();await ready();
    await page.locator('#wh-input-mode').selectOption('qwerty');
    await page.locator('.rich-editor').click({position:{x:20,y:20}});
    await page.frameLocator('#wh-kb-frame').locator('.sk-key[data-key="c"]').click();
    await page.waitForFunction(()=>document.querySelector('.rich-editor').textContent.includes('c'));
    await page.locator('#workspace-list .workspace-pill').first().click();
    await page.locator('#writing-channels .channel-button').filter({hasText:'Modern'}).click();
    await page.locator('#wh-open-font-workshop').click();
    await page.waitForFunction(()=>document.getElementById('wh-font-status').textContent.startsWith('Modern draft restored'));
    assert.equal(await page.locator('#wh-font-family').inputValue(),'WriterHelper QA Modern');
    pass('Offline reload initializes both keyboards, the language studio and saved fonts');
    await context.setOffline(false);

    await page.locator('#wh-font-close').click();
    await page.setViewportSize({width:390,height:844});
    if(await page.locator('#close-inspector').isVisible())await page.locator('#close-inspector').click();
    await page.locator('#toggle-sidebar').click();
    await page.locator('#writing-channels .channel-button').filter({hasText:'Ancient'}).click();
    await page.waitForFunction(()=>LiteraryFriendApp.currentDocument().title==='Ancient');
    await page.screenshot({path:path.join(output,'mobile-language.png')});
    pass('Mobile sidebar keeps era navigation usable');
    await nav.locator('summary').filter({hasText:'Sections'}).click();
    await nav.getByRole('button',{name:'08 Book Seven: Collision Of Worlds',exact:true}).click();
    assert.equal(await page.evaluate(()=>LiteraryFriendApp.currentDocument().workspace),'08 Book Seven: Collision Of Worlds');
    await nav.getByRole('button',{name:'Collapse master navigation',exact:true}).click();
    assert.equal(await bubble.isVisible(),true);await bubble.click();
    pass('Mobile master navigation selects books and restores from its bubble');
    assert.deepEqual(errors,[]);assert.deepEqual(missing.filter(x=>!x.includes('favicon.ico')),[]);
    pass('No uncaught page errors or missing local resources');
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed,errors,missing},null,2));
    console.log('Artifacts: '+output);
  }catch(error){
    if(page){console.error('Font status:',await page.locator('#wh-font-status').textContent().catch(()=>''));await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{})}
    throw error;
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(error=>{console.error(error);process.exitCode=1});

from playwright.sync_api import sync_playwright
import json,traceback,os
r='/mnt/data/v8work'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8877/index.html',wait_until='domcontentloaded',timeout=120000)
 page.wait_for_timeout(6000)
 print('startup',page.title(),page.locator('#provinceSettlementDropdown').count())
 print('startup errors',errors[:12]);print('world UI',page.evaluate('typeof window.BelavadosLivingWorld'), 'map module',page.evaluate('typeof window.BelavadosLivingMaps'))
 try:
  print('province',page.evaluate('window.BelavadosLivingWorld.ui.province.name'),'settlement',page.evaluate('window.BelavadosLivingWorld.ui.settlement.name'))
  print('first town',page.locator('#livingMapLayer').get_attribute('hidden'),page.locator('#livingBuildingGlyphs path').count())
  print('fallback',page.locator('#worldMapTemplateStatus').inner_text()[:240]);
  print('map screenshot...')
  page.screenshot(path=r+'/docs/V8_PROVINCE_SAMPLE.png',full_page=False,timeout=120000)
  page.locator('#livingBuildingGlyphs path').nth(12).click(force=True,timeout=3000)
  print('selected inspector',page.locator('#livingMapInspector h3').first.inner_text()[:150]);
  print('original NPC in data',page.evaluate('window.BelavadosLivingMaps.getCurrent().npcs.some(n=>!!n.sourceNpcId)'))
  npc=page.evaluate('window.BelavadosLivingMaps.getCurrent().npcs.find(n=>n.sourceNpcId).id')
  page.evaluate('(id)=>window.BelavadosLivingMaps.selectNpc(id)',npc)
  print('selected NPC',page.locator('#livingMapInspector h3').first.inner_text())
  print('person circles',page.locator('#livingNpcGlyphs circle').count())
  page.screenshot(path=r+'/docs/V8_SELECTED_NPC.png',full_page=False,timeout=120000)
  print('switch to Elarvess')
  page.evaluate('window.BelavadosLivingWorld.changeSettlement("aelvanyr-elarvess")')
  page.wait_for_timeout(2500)
  print('Elarvess map',page.locator('#elarvessMapLayer').count(),page.locator('#elarvessMapLayer').get_attribute('hidden'),'generic hidden',page.locator('#livingMapLayer').get_attribute('hidden'))
  print('switch to other province')
  page.evaluate('window.BelavadosLivingWorld.changeProvince("province-braesyl")')
  page.wait_for_timeout(3500)
  print('current',page.evaluate('window.BelavadosLivingWorld.ui.province.name'),page.evaluate('window.BelavadosLivingWorld.ui.settlement.name'),'map',page.locator('#livingBuildingGlyphs path').count())
 except Exception as e:
  print('ERROR',repr(e));print(traceback.format_exc())
 print('pageerrors',errors[:40],len(errors))
 browser.close()

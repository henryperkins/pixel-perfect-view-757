async(page)=>{
 const browser=page.context().browser(),engine=browser.browserType().name();
 const dir='/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a';
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 await ctx.route(/https:\/\/([^/]*\.)?stripe\.(com|network)\//,r=>r.abort('blockedbyclient'));
 const p=await ctx.newPage(),result={engine,version:browser.version(),navigation:{},scrolling:{}};
 try{
  await p.goto('http://127.0.0.1:4207/');await p.locator('.today-check-in').waitFor();
  await p.getByRole('navigation',{name:'Today sections'}).getByRole('link',{name:'Check-in',exact:true}).click();
  await p.getByRole('textbox',{name:'Reflection note',exact:false}).fill('Keep while visiting the Journal');
  await p.getByRole('navigation',{name:'Quick navigation'}).getByRole('link',{name:'Journal',exact:true}).click();
  await p.getByRole('heading',{name:'Journal',exact:true}).waitFor();
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  result.navigation.journal=await p.evaluate(()=>({path:location.pathname,activeTag:document.activeElement.tagName,activeText:document.activeElement.textContent?.slice(0,50),activeHref:document.activeElement.getAttribute('href')}));
  await p.keyboard.press('Tab');
  result.navigation.firstTab=await p.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent?.slice(0,80),href:document.activeElement.getAttribute('href')}));
  await p.goBack();await p.locator('.today-check-in').waitFor();
  result.navigation.back=await p.getByRole('textbox',{name:'Reflection note',exact:false}).inputValue();
  const trigger=p.locator('button[aria-controls="mobile-navigation"]');
  await trigger.click();await p.locator('button[aria-controls="mobile-navigation"][aria-expanded=true]').waitFor();
  result.navigation.menuOpened=await trigger.getAttribute('aria-expanded');
  await p.goBack();await p.locator('button[aria-controls="mobile-navigation"][aria-expanded=false]').waitFor();
  result.navigation.menuAfterHistoryBack=await trigger.getAttribute('aria-expanded');
  await p.goForward();await p.locator('button[aria-controls="mobile-navigation"][aria-expanded=true]').waitFor();
  result.navigation.menuAfterHistoryForward=await trigger.getAttribute('aria-expanded');
  await trigger.click();await p.locator('button[aria-controls="mobile-navigation"][aria-expanded=false]').waitFor();
  await p.getByRole('textbox',{name:'Reflection note',exact:false}).fill('Short note');
  await p.getByRole('textbox',{name:'Reflection note',exact:false}).focus();
  await p.screenshot({path:`${dir}/${engine}-check-in-viewport.png`,fullPage:false});
  result.scrolling=await p.evaluate(()=>({rootOverflowY:getComputedStyle(document.documentElement).overflowY,rootOverscrollY:getComputedStyle(document.documentElement).overscrollBehaviorY,noteOverscrollY:getComputedStyle(document.querySelector('textarea')).overscrollBehaviorY,noteTouchAction:getComputedStyle(document.querySelector('textarea')).touchAction,scrollPaddingTop:getComputedStyle(document.documentElement).scrollPaddingTop,scrollPaddingBottom:getComputedStyle(document.documentElement).scrollPaddingBottom,animations:document.querySelector('main').getAnimations({subtree:true}).filter(x=>x.playState==='running').length}));
  result.status='pass';
 }catch(e){result.status='fail';result.error=String(e);}
 await ctx.close();return result;
}

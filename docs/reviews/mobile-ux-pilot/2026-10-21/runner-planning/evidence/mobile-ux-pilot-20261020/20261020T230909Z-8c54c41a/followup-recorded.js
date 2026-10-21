async (page) => {
  const browser=page.context().browser(), engine=browser.browserType().name();
  const dir='/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a';
  const output={engine,version:browser.version(),storage:null,selectionTrials:[],navigation:{},scrolling:{},performance:{}};
  const fresh=async(init)=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
    await ctx.route(/https:\/\/([^/]*\.)?stripe\.(com|network)\//,r=>r.abort('blockedbyclient'));
    if(init)await ctx.addInitScript(init);
    const p=await ctx.newPage();await p.goto('http://127.0.0.1:4207/');await p.locator('.today-check-in').waitFor();return {ctx,p};
  };
  {
    const {ctx,p}=await fresh(()=>{
      window.__storageFaultCalls=0;
      Object.defineProperty(Object.getPrototypeOf(indexedDB),'open',{configurable:true,writable:true,value:function(){window.__storageFaultCalls++;throw new DOMException('Synthetic blocked IndexedDB','SecurityError');}});
    });
    await p.getByRole('textbox',{name:'Reflection note',exact:false}).fill('A draft with confirmed blocked IndexedDB');
    await p.waitForFunction(()=>window.__storageFaultCalls>0);
    await p.getByText('This draft is only kept while this page stays open. Save it to your account or copy it before leaving.',{exact:true}).waitFor({timeout:7000});
    output.storage=await p.evaluate(()=>({injectionCallCount:window.__storageFaultCalls,notice:document.querySelector('.draft-recovery').innerText,note:document.querySelector('textarea[name=note]').value}));
    await p.screenshot({path:`${dir}/${engine}-recorded-confirmed-storage-unavailable.png`,fullPage:false});
    await ctx.close();
  }
  for(const method of ['mouse-label','touch-label','keyboard']) {
    for(let trial=1;trial<=3;trial++) {
      const {ctx,p}=await fresh();
      await p.evaluate(()=>{
        window.__inputTrace=[];
        for(const name of ['pointerdown','pointerup','click','focusin','change'])document.addEventListener(name,e=>{
          const target=e.target;window.__inputTrace.push({name,time:performance.now(),target:target?.getAttribute?.('aria-label')||target?.textContent?.slice(0,40),scrollY,pointerType:e.pointerType||null});
        },true);
      });
      await p.getByRole('navigation',{name:'Today sections'}).getByRole('link',{name:'Check-in',exact:true}).click();
      const mood=p.getByRole('radio',{name:'Mood: 4 of 5, Good',exact:true});
      const energy=p.getByRole('radio',{name:'Energy: 3 of 5, Steady',exact:true});
      if(method==='keyboard'){
        await mood.focus();await p.keyboard.press('Space');await energy.focus();await p.keyboard.press('Space');
      } else if(method==='touch-label') {
        await mood.locator('..').tap();await energy.locator('..').tap();
      } else {
        await mood.locator('..').click();await energy.locator('..').click();
      }
      await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const row=await p.evaluate(()=>({checked:[...document.querySelectorAll('.today-check-in input:checked')].map(e=>e.getAttribute('aria-label')),trace:window.__inputTrace,scrollY}));
      row.method=method;row.trial=trial;row.pass=row.checked.includes('Mood: 4 of 5, Good')&&row.checked.includes('Energy: 3 of 5, Steady');
      output.selectionTrials.push(row);
      if(!row.pass)await p.screenshot({path:`${dir}/${engine}-recorded-${method}-${trial}-selection-miss.png`,fullPage:false});
      await ctx.close();
    }
  }
  return output;
}

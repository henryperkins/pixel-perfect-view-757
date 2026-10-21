async (page) => {
  const browser=page.context().browser(), engine=browser.browserType().name();
  const dir='/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-pilot-20261020/20261020T230909Z-8c54c41a';
  const result={engine,version:browser.version(),environment:'desktop_emulation',level:'proxy',cases:[]};
  const check=(condition,message)=>{if(!condition)throw new Error(message);};
  const run=async(name,action,init)=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await ctx.route(/https:\/\/([^/]*\.)?stripe\.(com|network)\//,r=>r.abort('blockedbyclient'));
    if(init) await ctx.addInitScript(init);
    const p=await ctx.newPage();
    const item={name,status:'not_run',additionalSubstitutions:[],observations:{}};
    try {
      await p.goto('http://127.0.0.1:4207/');
      await p.locator('.today-check-in').waitFor();
      await action(p,ctx,item);
      item.status='pass';
    } catch(e) {
      item.status='fail';item.error=String(e);
      item.observations.failure=await p.locator('.today-check-in').innerText().catch(()=>p.locator('body').innerText());
      await p.screenshot({path:`${dir}/${engine}-${name}-failure.png`,fullPage:true}).catch(()=>{});
    }
    result.cases.push(item);
    await ctx.close();
  };
  const note=p=>p.getByRole('textbox',{name:'Reflection note',exact:false});
  const save=p=>p.getByRole('button',{name:'Save check-in',exact:true});
  const status=p=>p.locator('.today-check-in-status');
  const saved=async p=>p.waitForFunction(()=>/^Saved /.test(document.querySelector('.today-check-in-status').textContent),null,{timeout:7000});
  const calls=p=>p.evaluate(()=>window.mobileAudit.state.calls.filter(x=>x.name==='saveDailyCheckIn').length);
  await run('rejected-save',async(p,ctx,r)=>{
    r.additionalSubstitutions=[{boundary:'check-in API',configured_response:'saveDailyCheckIn throws Synthetic network failure before persisting'}];
    await p.evaluate(()=>window.mobileAudit.state.fail=['saveDailyCheckIn']);
    await note(p).fill('Keep this rejected-save draft');
    await save(p).click();
    await p.getByRole('button',{name:'Check save',exact:true}).waitFor();
    r.observations.failure={status:await status(p).innerText(),note:await note(p).inputValue(),calls:await calls(p)};
    await p.getByRole('button',{name:'Check save',exact:true}).click();
    await p.getByRole('button',{name:'Keep my draft and review before saving',exact:true}).waitFor();
    check(await calls(p)===1,'Check save resubmitted instead of checking');
    await p.getByRole('button',{name:'Keep my draft and review before saving',exact:true}).click();
    await p.evaluate(()=>window.mobileAudit.state.fail=[]);
    await save(p).click();await saved(p);
    r.observations.recovered={status:await status(p).innerText(),note:await note(p).inputValue(),calls:await calls(p)};
    check(await note(p).inputValue()==='Keep this rejected-save draft','Rejected draft lost');
    check(await calls(p)===2,'Unexpected write count');
  });
  await run('lost-response',async(p,ctx,r)=>{
    r.additionalSubstitutions=[{boundary:'check-in API',configured_response:'saveDailyCheckIn applies the fixture write then throws Synthetic lost acknowledgement'}];
    await p.evaluate(()=>window.mobileAudit.state.dropResponse=['saveDailyCheckIn']);
    await note(p).fill('A saved reflection with a lost acknowledgement');
    await save(p).click();await p.getByRole('button',{name:'Check save',exact:true}).waitFor();
    r.observations.unknown={status:await status(p).innerText(),note:await note(p).inputValue(),fixtureSaved:await p.evaluate(()=>window.mobileAudit.state.wellness.note),calls:await calls(p)};
    await p.screenshot({path:`${dir}/${engine}-lost-response-unknown.png`,fullPage:true});
    await p.getByRole('button',{name:'Check save',exact:true}).click();await saved(p);
    r.observations.confirmed={status:await status(p).innerText(),note:await note(p).inputValue(),calls:await calls(p)};
    check(await calls(p)===1,'Lost acknowledgement caused duplicate write');
    check(await note(p).inputValue()==='A saved reflection with a lost acknowledgement','Lost-response note changed');
  });
  await run('edit-during-save',async(p,ctx,r)=>{
    r.additionalSubstitutions=[{boundary:'all fixture API calls',configured_response:'450ms delay; normal synthetic responses'}];
    await p.evaluate(()=>window.mobileAudit.state.delay=450);
    await note(p).fill('Earlier submitted note');await save(p).click();
    await p.waitForFunction(()=>window.mobileAudit.state.calls.some(x=>x.name==='saveDailyCheckIn'));
    await note(p).fill('Newer unsaved note typed during the request');
    await p.waitForFunction(()=>window.mobileAudit.state.wellness.note==='Earlier submitted note' && document.querySelector('.today-check-in-status').textContent.startsWith('Unsaved changes'),null,{timeout:7000});
    r.observations.afterFirstSave={status:await status(p).innerText(),note:await note(p).inputValue(),fixtureSaved:await p.evaluate(()=>window.mobileAudit.state.wellness.note)};
    check(await note(p).inputValue()==='Newer unsaved note typed during the request','Newer edit overwritten');
    await save(p).click();await saved(p);
    r.observations.afterSecondSave={status:await status(p).innerText(),fixtureSaved:await p.evaluate(()=>window.mobileAudit.state.wellness.note),calls:await calls(p)};
    check(r.observations.afterSecondSave.fixtureSaved==='Newer unsaved note typed during the request','Second save missed latest edit');
  });
  await run('unsaved-reload',async(p,ctx,r)=>{
    await note(p).fill('Unsubmitted draft survives an ordinary reload');
    await p.getByText('Draft saved on this device',{exact:true}).waitFor();
    r.observations.before=await p.locator('.draft-recovery').innerText();
    await p.reload();await p.locator('.today-check-in').waitFor();
    const summary=p.locator('.draft-recovery summary').filter({hasText:'Resume draft'});
    await summary.waitFor();await summary.click();
    await p.getByRole('button',{name:'Resume draft',exact:true}).click();
    r.observations.after={note:await note(p).inputValue(),status:await status(p).innerText(),calls:await calls(p)};
    check(r.observations.after.note==='Unsubmitted draft survives an ordinary reload','Recovered draft differs');
    check(r.observations.after.calls===0,'Draft recovery submitted unexpectedly');
  });
  await run('offline-queue',async(p,ctx,r)=>{
    r.scenarioState='Playwright browser context offline; API remains the standing local function fixture';
    await ctx.setOffline(true);
    await note(p).fill('Offline submitted checkpoint');await save(p).click();
    await p.waitForFunction(()=>document.querySelector('.today-check-in-status').textContent.startsWith('Waiting for a connection'),null,{timeout:7000});
    check(await calls(p)===0,'Offline mutation did not pause');
    await note(p).fill('Newer offline edit is still unsaved');
    r.observations.offline={status:await status(p).innerText(),calls:await calls(p),online:await p.evaluate(()=>navigator.onLine)};
    await ctx.setOffline(false);
    await p.waitForFunction(()=>window.mobileAudit.state.wellness.note==='Offline submitted checkpoint' && document.querySelector('.today-check-in-status').textContent.startsWith('Unsaved changes'),null,{timeout:7000});
    r.observations.reconnected={status:await status(p).innerText(),note:await note(p).inputValue(),fixtureSaved:await p.evaluate(()=>window.mobileAudit.state.wellness.note),calls:await calls(p)};
    check(r.observations.reconnected.note==='Newer offline edit is still unsaved','Reconnection lost newer text');
    check(r.observations.reconnected.calls===1,'Queued checkpoint write count wrong');
  });
  await run('reading-retry',async(p,ctx,r)=>{
    r.additionalSubstitutions=[{boundary:'Today API',configured_response:'fetchToday throws Synthetic network failure on forced foreground refetch; returns normal response after clearing failure'}];
    await p.evaluate(async()=>{window.mobileAudit.state.fail=['fetchToday'];await window.auditQueryClient.refetchQueries({queryKey:['today']});});
    await p.getByRole('button',{name:'Refresh reading',exact:true}).waitFor();
    r.observations.failed={message:await p.getByText('Your reading couldn’t refresh. You’re viewing the last version loaded.',{exact:true}).innerText(),readingVisible:await p.getByRole('heading',{level:1}).innerText()};
    await p.evaluate(()=>window.mobileAudit.state.fail=[]);
    await p.getByRole('button',{name:'Refresh reading',exact:true}).click();
    await p.getByRole('button',{name:'Refresh reading',exact:true}).waitFor({state:'detached'});
    r.observations.retried={heading:await p.getByRole('heading',{level:1}).innerText()};
  });
  await run('long-note',async(p,ctx,r)=>{
    await note(p).fill('A long reflection line. '.repeat(100).slice(0,2000));
    await p.waitForFunction(()=>document.querySelector('textarea[name=note]').hasAttribute('data-scrollable'));
    await note(p).focus();
    r.observations.long=await note(p).evaluate(e=>({length:e.value.length,maxLength:e.maxLength,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,overscrollY:getComputedStyle(e).overscrollBehaviorY,touchAction:getComputedStyle(e).touchAction}));
    check(r.observations.long.length===2000,'Long input limit incorrect');
    check(r.observations.long.overscrollY==='contain','Overflowing note lacks scroll containment');
    await save(p).click();await saved(p);
    await note(p).fill('Short note');
    await p.waitForFunction(()=>!document.querySelector('textarea[name=note]').hasAttribute('data-scrollable'));
    r.observations.short=await note(p).evaluate(e=>({scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,overscrollY:getComputedStyle(e).overscrollBehaviorY}));
    check(r.observations.short.overscrollY==='auto','Short field still contains document swipes');
  });
  await run('storage-unavailable',async(p,ctx,r)=>{
    r.additionalSubstitutions=[{boundary:'IndexedDB draft store',configured_response:'indexedDB.open throws synthetic SecurityError; sessionStorage fixture backend remains available'}];
    await note(p).fill('Draft is only in this tab');
    await p.getByText('This draft is only kept while this page stays open. Save it to your account or copy it before leaving.',{exact:true}).waitFor();
    r.observations={message:await p.locator('.draft-recovery').innerText(),note:await note(p).inputValue()};
    check(!r.observations.message.includes('Draft saved on this device'),'Unavailable storage claimed durable save');
    await p.screenshot({path:`${dir}/${engine}-storage-unavailable.png`,fullPage:true});
  },()=>{indexedDB.open=()=>{throw new DOMException('Synthetic blocked IndexedDB','SecurityError');};});
  return result;
}

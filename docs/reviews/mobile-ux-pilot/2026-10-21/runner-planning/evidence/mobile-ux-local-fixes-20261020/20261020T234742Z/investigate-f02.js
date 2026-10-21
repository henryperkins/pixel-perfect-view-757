async (page) => {
 const browser=page.context().browser(),engine=browser.browserType().name(),origin=new URL(page.url()).origin;
 const results=[];
 const groups=engine==='webkit'?[['native',8],['settled-native',4],['router-hash',4],['restoration-disabled',4]]:[['native',4]];
 for(const [group,total] of groups)for(let trial=1;trial<=total;trial++){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await ctx.route(/https:\/\/([^/]*\.)?stripe\.(com|network)\//,r=>r.abort('blockedbyclient'));
  await ctx.addInitScript(()=>{
   window.__f02=[];
   const log=(kind,detail)=>window.__f02.push({kind,t:performance.now(),y:scrollY,href:location.href,...detail});
   for(const name of ['scrollTo','scrollBy']){
    const original=window[name];window[name]=function(...args){log(name,{args,stack:new Error().stack});return original.apply(this,args);};
   }
   for(const [proto,name] of [[Element.prototype,'scrollIntoView'],[HTMLElement.prototype,'focus']]){
    const original=proto[name];proto[name]=function(...args){log(name,{target:this.getAttribute('aria-label')||this.id||this.tagName,args,stack:new Error().stack});return original.apply(this,args);};
   }
   for(const type of ['pointerdown','pointerup','click','focusin','change','hashchange','popstate'])document.addEventListener(type,e=>log(type,{target:e.target?.getAttribute?.('aria-label')||e.target?.textContent?.slice(0,45),pointer:e.pointerType||null}),true);
  });
  const p=await ctx.newPage();p.setDefaultTimeout(7000);
  try{
   await p.goto(origin+'/');await p.locator('.today-check-in').waitFor();
   await p.evaluate(()=>{
    for(const name of ['onBeforeNavigate','onBeforeLoad','onLoad','onBeforeRouteMount','onResolved','onRendered'])window.auditRouter.subscribe(name,e=>window.__f02.push({kind:name,t:performance.now(),y:scrollY,href:location.href,from:e.fromLocation?.href,to:e.toLocation.href,key:e.toLocation.state.__TSR_key,pathChanged:e.pathChanged}));
   });
   if(group==='restoration-disabled')await p.evaluate(()=>window.auditRouter.update({scrollRestoration:()=>false}));
   if(group==='router-hash')await p.evaluate(()=>{void window.auditRouter.navigate({hash:'today-reflection'});});
   else await p.getByRole('navigation',{name:'Today sections'}).getByRole('link',{name:'Check-in',exact:true}).click();
   if(group==='settled-native'){
    await p.waitForFunction(()=>!window.auditRouter.state.isLoading&&window.auditRouter.state.resolvedLocation?.href===window.auditRouter.latestLocation.href);
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   }
   await p.getByRole('radio',{name:'Mood: 4 of 5, Good',exact:true}).locator('..').click();
   await p.getByRole('radio',{name:'Energy: 3 of 5, Steady',exact:true}).locator('..').click();
   await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const record=await p.evaluate(()=>({checked:[...document.querySelectorAll('.today-check-in input:checked')].map(e=>e.getAttribute('aria-label')),trace:window.__f02,y:scrollY,router:{href:window.auditRouter.state.location.href,resolved:window.auditRouter.state.resolvedLocation?.href,isLoading:window.auditRouter.state.isLoading}}));
   results.push({group,trial,pass:record.checked.length===2,...record});
  }catch(e){results.push({group,trial,error:String(e),pass:false});}
  await ctx.close();
 }
 return {engine,version:browser.version(),sourceState:'before F-01/F-03 changes',level:'proxy',instrumentation:'pass-through scroll/focus wrappers log stacks; no source behavior changed; instrumentation timing may affect reproduction',additionalSubstitutions:{'native':'none beyond standing fixture','settled-native':'wait for router resolution and two animation frames before selecting','router-hash':'test-only navigation uses router.navigate instead of native anchor activation','restoration-disabled':'test-only router option scrollRestoration function returns false; no application code edit'},results};
}

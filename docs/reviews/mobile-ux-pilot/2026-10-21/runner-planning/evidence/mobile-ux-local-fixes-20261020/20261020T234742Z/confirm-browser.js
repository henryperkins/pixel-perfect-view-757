async (page) => {
  const ctx = await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const blocked = [];
  await ctx.route(/https:\/\/([^/]*\.)?stripe\.(com|network)\//, route=>{blocked.push(new URL(route.request().url()).host);return route.abort('blockedbyclient');});
  page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4208/');
  const dir = '/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z';
  const engine = page.context().browser().browserType().name();
  const result = { engine, version: page.context().browser().version(), environment: 'desktop_emulation', level: 'proxy', errors: [], journey: {}, layouts: [], accessibility: [], themes: [], overlays: {} };
  page.on('pageerror', e => result.errors.push(String(e)));
  await page.locator('.today-check-in').waitFor();
  await page.evaluate(() => document.fonts.ready);
  result.identity = await page.evaluate(() => ({url: location.href, userAgent: navigator.userAgent, date: window.mobileAudit.state.day, owner: window.mobileAudit.state.ownerId, viewport: {width: innerWidth, height: innerHeight}, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, viewportMeta: document.querySelector('meta[name=viewport]').content, fontStatus: document.fonts.status}));
  await page.screenshot({path: `${dir}/${engine}-today-390.png`, fullPage:true});
  await page.getByRole('navigation', {name:'Today sections'}).getByRole('link', {name:'Check-in',exact:true}).click();
  result.journey.checkInAnchor = await page.evaluate(() => ({hash: location.hash, sectionY:document.querySelector('#today-reflection').getBoundingClientRect().top}));
  await page.getByRole('radio', {name:'Mood: 4 of 5, Good',exact:true}).locator('..').click();
  await page.getByRole('radio', {name:'Energy: 3 of 5, Steady',exact:true}).locator('..').click();
  await page.getByRole('textbox', {name:'Reflection note',exact:false}).fill('Pilot: a short pause helped. Café — 日本語 🙂');
  await page.getByRole('button', {name:'Save check-in',exact:true}).click();
  await page.waitForFunction(() => /^Saved /.test(document.querySelector('.today-check-in-status').textContent));
  result.journey.saved = await page.evaluate(() => ({status:document.querySelector('.today-check-in-status').textContent, wellness:structuredClone(window.mobileAudit.state.wellness), calls:window.mobileAudit.state.calls.filter(x=>x.name==='saveDailyCheckIn')}));
  await page.screenshot({path: `${dir}/${engine}-check-in-saved.png`, fullPage:true});
  await page.reload();
  await page.locator('.today-check-in').waitFor();
  result.journey.reloaded = await page.evaluate(() => ({value:document.querySelector('textarea[name=note]').value, status:document.querySelector('.today-check-in-status').textContent,checked:[...document.querySelectorAll('.today-check-in input:checked')].map(x=>x.getAttribute('aria-label'))}));
  await page.getByRole('navigation', {name:'Today sections'}).getByRole('link', {name:'Sources',exact:true}).click();
  result.journey.sources = {expanded:await page.locator('[aria-controls=today-evidence]').getAttribute('aria-expanded'), content:await page.locator('#today-evidence').innerText()};
  await page.getByRole('button', {name:'Hide sources behind this reading',exact:true}).click();
  await page.addScriptTag({path:'/tmp/googleplato-axe/package/axe.min.js'});
  for (const theme of ['light','dark']) {
    await page.evaluate(t=>document.documentElement.classList.toggle('dark',t==='dark'),theme);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const axe = await page.evaluate(async()=>{const a=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return {version:a.testEngine.version,violations:a.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,help:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))})),incomplete:a.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),passes:a.passes.length};});
    result.accessibility.push({theme,...axe});
    result.themes.push(await page.evaluate(theme=>{
      const e=document.querySelector('textarea[name=note]'),s=getComputedStyle(e),p=getComputedStyle(e.closest('form'));
      const rgba=c=>{const cvs=document.createElement('canvas');cvs.width=cvs.height=1;const x=cvs.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,1,1);x.fillStyle=c;x.fillRect(0,0,1,1);return [...x.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
      const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])).concat([1]);
      const bg=el=>{if(!el)return [255,255,255,1];const c=rgba(getComputedStyle(el).backgroundColor);return c[3]<1?over(c,bg(el.parentElement)):c;};
      const contrast=(a,b)=>{const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
      const outer=bg(e.parentElement),inner=bg(e),border=over(rgba(s.borderTopColor),inner);
      return {theme, textarea:{fontSize:s.fontSize,inputMode:e.inputMode,autocomplete:e.autocomplete,enterKeyHint:e.enterKeyHint,autocapitalize:e.autocapitalize,spellcheck:e.spellcheck,maxLength:e.maxLength,describedBy:e.getAttribute('aria-describedby'),borderColor:s.borderTopColor,background:s.backgroundColor,outerBackground:p.backgroundColor,borderVsInner:contrast(border,inner),borderVsOuter:contrast(border,outer),fillVsOuter:contrast(inner,outer),textContrast:contrast(over(rgba(s.color),inner),inner)}};
    },theme));
    if(theme==='dark') await page.screenshot({path:`${dir}/${engine}-today-dark-390.png`,fullPage:true});
  }
  await page.evaluate(()=>document.documentElement.classList.remove('dark'));
  for(const [width,height,font] of [[320,568,16],[360,800,16],[390,844,16],[430,932,16],[667,375,16],[768,1024,16],[1280,900,16],[320,568,32],[667,375,32]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(font=>document.documentElement.style.fontSize=`${font}px`,font);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    result.layouts.push(await page.evaluate(({width,height,font})=>{
      const measure=e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y};};
      const form=document.querySelector('.today-check-in');
      return {width,height,rootFont:font,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,form:measure(form),save:measure(form.querySelector('button[type=submit]')),radioHitAreas:[...form.querySelectorAll('input[type=radio]')].map(e=>({label:e.getAttribute('aria-label'),...measure(e.closest('label'))})),note:measure(form.querySelector('textarea')),sectionLinks:[...document.querySelectorAll('.today-section-nav a')].map(e=>({text:e.textContent,...measure(e)})),contentOrder:[...document.querySelectorAll('main h1,main h2,main h3')].map(e=>e.textContent)};
    },{width,height,font}));
    if(width===320 || (width===667&&font===16)) await page.screenshot({path:`${dir}/${engine}-${width}x${height}-text${font}.png`,fullPage:true});
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='16px');
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Open menu',exact:true}).click();
  result.overlays.open=await page.evaluate(()=>({expanded:document.querySelector('button[aria-expanded=true]')?.getAttribute('aria-label'),focus:document.activeElement?.outerHTML,menu:document.querySelector('#mobile-menu')?.outerHTML,bodyOverflow:getComputedStyle(document.body).overflow,rootOverflow:getComputedStyle(document.documentElement).overflow,historyState:history.state}));
  await page.screenshot({path:`${dir}/${engine}-menu-open.png`,fullPage:true});
  await page.keyboard.press('Escape');
  result.overlays.closed=await page.evaluate(()=>({open:!!document.querySelector('button[aria-expanded=true]'),focus:document.activeElement?.getAttribute('aria-label')}));
  const mood=page.getByRole('radio',{name:'Mood: 4 of 5, Good',exact:true});
  await mood.focus();
  await page.keyboard.press('ArrowRight');
  result.journey.keyboard=await page.evaluate(()=>({focused:document.activeElement?.getAttribute('aria-label'),checked:[...document.querySelectorAll('.today-check-in input:checked')].map(x=>x.getAttribute('aria-label')),visual:document.activeElement?.closest('label')?.getBoundingClientRect().toJSON()}));
  result.blockedStripeHosts = [...new Set(blocked)];
  await ctx.close();
  return result;
}

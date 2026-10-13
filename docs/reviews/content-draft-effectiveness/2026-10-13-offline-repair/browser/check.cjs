async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const checks = [];
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:width===390?844:1000});
    for (let i=0;i<4;i++) {
      await page.goto('http://127.0.0.1:4176/case/'+i);
      const reflection = await page.locator('#today-reflection > p').innerText();
      if ((reflection.match(/\?/g)||[]).length !== 1) throw Error('Expected one reflection question');
      if (/out of date|needs rest|pressure running high/.test(reflection)) throw Error('Inherited premise appended');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) throw Error('Horizontal overflow');
      await page.getByRole('link',{name:'Check-in',exact:true}).focus();
      await page.keyboard.press('Enter');
      if (!(await page.locator('#today-reflection').isVisible())) throw Error('Reflection unavailable');
      if (i===1) await page.screenshot({path:'output/playwright/content-offline-repair/saturn-'+width+'.png',fullPage:true});
      checks.push({caseIndex:i,width,reflection,questionCount:1,overflow:false});
    }
  }
  if (errors.length) throw Error(JSON.stringify(errors));
  return {browser:'Chromium',modelAttempts:0,checks,errors};
}

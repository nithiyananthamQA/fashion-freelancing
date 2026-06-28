const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  await page.setViewport({width: 500, height: 702});
  await page.goto('http://localhost:4326/pages/agency.html');
  const layout = await page.evaluate(() => {
    const s1 = document.getElementById('side-01').getBoundingClientRect();
    const s2 = document.getElementById('side-02').getBoundingClientRect();
    const t1 = document.querySelector('#side-01 .px-track').getBoundingClientRect();
    const c1 = document.querySelectorAll('#side-01 .px-card')[4].getBoundingClientRect();
    const h2 = document.querySelector('#side-02 .px-head-wrap').getBoundingClientRect();
    return {
      s1: {top: s1.top, bottom: s1.bottom, height: s1.height},
      t1: {top: t1.top, bottom: t1.bottom, height: t1.height},
      c1: {top: c1.top, bottom: c1.bottom, height: c1.height},
      s2: {top: s2.top, bottom: s2.bottom, height: s2.height},
      h2: {top: h2.top, bottom: h2.bottom, height: h2.height},
    };
  });
  console.log(JSON.stringify(layout, null, 2));
  await browser.close();
})();

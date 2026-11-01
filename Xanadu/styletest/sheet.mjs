// labelled comparison sheet of the style samples: node styletest/sheet.mjs <folder>
import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core';
const dir = process.argv[2], rows = process.argv[3] ? JSON.parse(process.argv[3]) : [['1 Pulp Comic', 'Pulp horror comic', 'comic page, halftone dots, panel-to-panel camera', [2, 3, 4, 5]], ['2 PS1 Found Footage', 'PS1 low-poly horror', '3D, chunky pixels, dithering, camcorder footage', [1, 2, 3, 4]], ['3 Haunted Dollhouse', 'Haunted Dollhouse (3D)', 'miniature dollhouse, porcelain doll, tilt-shift, stop-motion', [1, 3, 4, 5]]];
const img = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
const html = `<html><body style="margin:0;background:#111;font-family:Helvetica,Arial;color:#eee;padding:30px">` + rows.map(([pre, name, sub, ks]) => `<div style="margin-bottom:34px"><div style="font-size:40px;font-weight:800">${name}</div><div style="font-size:24px;color:#aaa;margin:6px 0 14px">${sub}</div>
  <div style="display:flex;gap:14px">${ks.map(k => `<img src="${img(`${pre} - ${k}.jpg`)}" style="width:360px;height:640px;border-radius:10px">`).join('')}</div></div>`).join('') + `</body></html>`;
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true }); const page = await browser.newPage();
await page.setViewport({ width: 1562, height: 2400 }); await page.setContent(html); const h = await page.evaluate(() => document.body.scrollHeight); await page.setViewport({ width: 1562, height: h });
await page.screenshot({ path: path.join(dir, process.argv[4] || '0 Style comparison.jpg'), type: 'jpeg', quality: 88, fullPage: true }); await browser.close(); console.log('sheet written');

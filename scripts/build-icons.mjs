#!/usr/bin/env node
/**
 * 아이콘 만들기 — public/brand/icon-source.svg «하나»에서 favicon.ico · PNG 를 렌더한다
 *
 *   node scripts/build-icons.mjs
 *
 * 왜 스크립트인가: 손으로 그린 ico/png 를 따로 두면 SVG 를 고쳐도 탭 아이콘은 옛것이 남는다.
 * 원본은 SVG 하나이고, 나머지는 전부 «만들어지는 것»이다.
 *
 * 렌더는 Playwright(크로미움)로 한다 — 폰트·그라데이션을 브라우저와 똑같이 그린다.
 *   yarn add -D playwright   (또는 이미 설치된 곳의 것을 PLAYWRIGHT_PATH 로 가리킨다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(here, '..', 'public');
const SRC = path.join(PUB, 'brand', 'icon-source.svg');

// playwright 를 찾는다 — 이 프로젝트에 없으면 환경변수로 가리킨 곳
const pwEntry = process.env.PLAYWRIGHT_PATH
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs')).href
    : 'playwright';
const { chromium } = await import(pwEntry);

const svg = fs.readFileSync(SRC, 'utf8');
const browser = await chromium.launch();

/** SVG 를 정확히 size×size 로 렌더해 PNG 바이트를 돌려준다 */
async function renderPng(size) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
        `<html><body style="margin:0;background:transparent">${svg.replace(/width="64" height="64"/, `width="${size}" height="${size}"`)}</body></html>`);
    const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    return buf;
}

/** PNG 들을 하나의 .ico 로 묶는다(ICO 는 PNG 를 그대로 품을 수 있다 — Vista 이후) */
function buildIco(pngs) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);            // reserved
    header.writeUInt16LE(1, 2);            // type: icon
    header.writeUInt16LE(pngs.length, 4);  // count

    const dirSize = 16 * pngs.length;
    let offset = 6 + dirSize;
    const entries = [];
    for (const { size, buf } of pngs) {
        const e = Buffer.alloc(16);
        e.writeUInt8(size >= 256 ? 0 : size, 0);   // width  (0 = 256)
        e.writeUInt8(size >= 256 ? 0 : size, 1);   // height
        e.writeUInt8(0, 2);                         // palette
        e.writeUInt8(0, 3);                         // reserved
        e.writeUInt16LE(1, 4);                      // planes
        e.writeUInt16LE(32, 6);                     // bpp
        e.writeUInt32LE(buf.length, 8);
        e.writeUInt32LE(offset, 12);
        offset += buf.length;
        entries.push(e);
    }
    return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

const icoSizes = [16, 24, 32, 48, 64];
const pngs = [];
for (const s of icoSizes) pngs.push({ size: s, buf: await renderPng(s) });
fs.writeFileSync(path.join(PUB, 'favicon.ico'), buildIco(pngs));
console.log(`favicon.ico  ← ${icoSizes.join('/')}px`);

for (const s of [192, 512]) {
    fs.writeFileSync(path.join(PUB, `icon-${s}.png`), await renderPng(s));
    console.log(`icon-${s}.png`);
}

await browser.close();
console.log('\n원본: public/brand/icon-source.svg — 여기를 고치고 다시 돌린다.');

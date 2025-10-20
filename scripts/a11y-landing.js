#!/usr/bin/env node
// Lightweight a11y audit for LandingPage using jsdom and axe-core
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const html = readFileSync('./dist/index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only' });
// inject axe
const { window } = dom;
window.eval(axe.source);

(async () => {
    const results = await window.axe.run(window.document);
    console.log('Axe violations:', results.violations.length);
    for (const v of results.violations) {
        console.log(v.id, v.help);
        for (const node of v.nodes) {
            console.log(' -', node.target.join(', '));
        }
    }
    process.exit(results.violations.length > 0 ? 1 : 0);
})();

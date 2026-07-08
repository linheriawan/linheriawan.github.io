#!/usr/bin/env node
/*
 * Convert an XMLTV guide file into the app's slim epg.json.
 *
 * Usage: node xmltv-to-json.js <guide.xml> > epg.json
 *
 * Output: { "<channel-id>": [{ "start": <epoch s>, "stop": <epoch s>, "title": "..." }] }
 * Programmes that ended more than 1h ago are dropped (keeps the file small
 * and removes stale data — the "cron cleanup" happens here, at build time).
 */
'use strict';

const fs = require('fs');

const KEEP_PAST_MS = 3600 * 1000;      // keep programmes that ended < 1h ago
const KEEP_FUTURE_MS = 48 * 3600 * 1000; // and those starting < 48h from now

function parseXmltvTime(s) {
    // "20260708123000 +0700" (offset optional)
    const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?/.exec(s);
    if (!m) { return NaN; }
    let t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    if (m[7]) {
        const off = ((+m[8]) * 60 + (+m[9])) * 60000;
        t += m[7] === '+' ? -off : off;
    }
    return t;
}

function unescapeXml(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
        .replace(/&amp;/g, '&');
}

const file = process.argv[2];
if (!file) {
    console.error('usage: node xmltv-to-json.js <guide.xml>');
    process.exit(1);
}

const xml = fs.readFileSync(file, 'utf8');
const now = Date.now();
const out = {};
let total = 0;
let kept = 0;

for (const m of xml.matchAll(/<programme\b([^>]*)>([\s\S]*?)<\/programme>/g)) {
    total++;
    const attrs = m[1];
    const attr = (name) => {
        const a = new RegExp(`${name}="([^"]*)"`).exec(attrs);
        return a ? a[1] : '';
    };
    const channel = attr('channel');
    const start = parseXmltvTime(attr('start'));
    const stop = parseXmltvTime(attr('stop'));
    if (!channel || isNaN(start)) { continue; }
    const end = isNaN(stop) ? start : stop;
    if (end < now - KEEP_PAST_MS || start > now + KEEP_FUTURE_MS) { continue; }

    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/.exec(m[2]);
    const title = titleMatch ? unescapeXml(titleMatch[1].trim()) : '';

    if (!out[channel]) { out[channel] = []; }
    out[channel].push({
        start: Math.round(start / 1000),
        stop: Math.round(end / 1000),
        title: title
    });
    kept++;
}

for (const id in out) {
    out[id].sort((a, b) => a.start - b.start);
}

process.stdout.write(JSON.stringify(out));
console.error(`programmes: kept ${kept}/${total} across ${Object.keys(out).length} channels`);

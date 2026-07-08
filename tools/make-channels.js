#!/usr/bin/env node
/*
 * Build a custom channels.xml for iptv-org/epg from an M3U playlist.
 *
 * Usage: node make-channels.js <playlist.m3u> <path-to-epg-repo>/sites > channels.xml
 *
 * For every tvg-id in the playlist, scans the epg repo's per-site channel
 * maps (sites/<site>/<site>.channels.xml) and picks one site per channel,
 * preferring sites known to be fast/reliable. Unmatched ids are reported
 * on stderr and simply won't have guide data.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// preferred grabber sites, best first (covers this playlist's lineup)
const SITE_PRIORITY = [
    'i.mjh.nz', 'tvtv.us', 'tv.mail.ru', 'tv.cctv.com',
    'watch.whaletvplus.com', 'cubmu.com', 'maxtvgo.mk',
    'plex.tv', 'pluto.tv', 'tvguide.com', 'vidio.com'
];

function siteRank(site) {
    const i = SITE_PRIORITY.indexOf(site);
    return i === -1 ? SITE_PRIORITY.length : i;
}

function xmlEscape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const [, , m3uPath, sitesDir] = process.argv;
if (!m3uPath || !sitesDir) {
    console.error('usage: node make-channels.js <playlist.m3u> <epg-repo>/sites');
    process.exit(1);
}

const m3u = fs.readFileSync(m3uPath, 'utf8');
const wanted = new Set();
for (const m of m3u.matchAll(/tvg-id="([^"]+)"/g)) {
    wanted.add(m[1]);
}
console.error(`playlist: ${wanted.size} unique tvg-ids`);

// best match per channel id: { site, lang, site_id, name }
const best = new Map();

for (const site of fs.readdirSync(sitesDir)) {
    const file = path.join(sitesDir, site, `${site}.channels.xml`);
    if (!fs.existsSync(file)) { continue; }
    const xml = fs.readFileSync(file, 'utf8');
    for (const m of xml.matchAll(/<channel\s+([^>]*)>([^<]*)<\/channel>/g)) {
        const attrs = m[1];
        const attr = (name) => {
            const a = new RegExp(`${name}="([^"]*)"`).exec(attrs);
            return a ? a[1] : '';
        };
        const xmltvId = attr('xmltv_id');
        if (!wanted.has(xmltvId)) { continue; }
        const prev = best.get(xmltvId);
        if (!prev || siteRank(site) < siteRank(prev.site)) {
            best.set(xmltvId, {
                site: site,
                lang: attr('lang') || 'en',
                site_id: attr('site_id'),
                name: m[2].trim()
            });
        }
    }
}

const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<channels>'];
for (const [id, ch] of [...best.entries()].sort()) {
    lines.push(`  <channel site="${xmlEscape(ch.site)}" lang="${xmlEscape(ch.lang)}" ` +
        `xmltv_id="${xmlEscape(id)}" site_id="${xmlEscape(ch.site_id)}">${xmlEscape(ch.name)}</channel>`);
}
lines.push('</channels>');
console.log(lines.join('\n'));

for (const id of wanted) {
    if (!best.has(id)) { console.error(`WARN no guide site found for: ${id}`); }
}
console.error(`matched: ${best.size}/${wanted.size} channels`);

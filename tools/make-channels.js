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
    'i.mjh.nz', 'tvtv.us', 'epg.iptvx.one', 'tv.cctv.com',
    'watch.whaletvplus.com', 'cubmu.com', 'maxtvgo.mk',
    'plex.tv', 'pluto.tv', 'tvguide.com', 'vidio.com'
];

// sites that crash or block requests from GitHub Actions runners
// (tv.mail.ru geo-blocks non-RU IPs and returns HTML, killing the grab)
const SITE_BLOCKLIST = ['tv.mail.ru'];

function siteRank(site) {
    const i = SITE_PRIORITY.indexOf(site);
    return i === -1 ? SITE_PRIORITY.length : i;
}

/*
 * Site maps use channel+feed ids ("DW.de@English", "BBCNews.uk@SD").
 * We match on the base channel id and prefer the most useful feed.
 */
function feedRank(feed) {
    if (!feed) { return 0; }
    if (/english/i.test(feed)) { return 1; }
    if (/^HD$/i.test(feed)) { return 2; }
    if (/^SD$/i.test(feed)) { return 3; }
    return 4;
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
    if (SITE_BLOCKLIST.includes(site)) { continue; }
    const siteDir = path.join(sitesDir, site);
    if (!fs.statSync(siteDir).isDirectory()) { continue; }
    // a site can split its map into several files (i.mjh.nz_plex.channels.xml, ...)
    let xml = '';
    for (const f of fs.readdirSync(siteDir)) {
        if (f.endsWith('.channels.xml')) {
            xml += fs.readFileSync(path.join(siteDir, f), 'utf8');
        }
    }
    if (!xml) { continue; }
    for (const m of xml.matchAll(/<channel\s+([^>]*)>([^<]*)<\/channel>/g)) {
        const attrs = m[1];
        const attr = (name) => {
            const a = new RegExp(`${name}="([^"]*)"`).exec(attrs);
            return a ? a[1] : '';
        };
        const xmltvId = attr('xmltv_id');
        const at = xmltvId.indexOf('@');
        const baseId = at === -1 ? xmltvId : xmltvId.substring(0, at);
        const feed = at === -1 ? '' : xmltvId.substring(at + 1);
        if (!wanted.has(baseId)) { continue; }
        const prev = best.get(baseId);
        const better = !prev ||
            siteRank(site) < siteRank(prev.siteScore) ||
            (siteRank(site) === siteRank(prev.siteScore) && feedRank(feed) < feedRank(prev.feed));
        if (better) {
            best.set(baseId, {
                site: site,
                siteScore: site,
                feed: feed,
                xmltv_id: xmltvId, // keep the @feed so the grabber targets the right feed
                lang: attr('lang') || 'en',
                site_id: attr('site_id'),
                name: m[2].trim()
            });
        }
    }
}

const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<channels>'];
for (const [, ch] of [...best.entries()].sort()) {
    lines.push(`  <channel site="${xmlEscape(ch.site)}" lang="${xmlEscape(ch.lang)}" ` +
        `xmltv_id="${xmlEscape(ch.xmltv_id)}" site_id="${xmlEscape(ch.site_id)}">${xmlEscape(ch.name)}</channel>`);
}
lines.push('</channels>');
console.log(lines.join('\n'));

for (const id of wanted) {
    if (!best.has(id)) { console.error(`WARN no guide site found for: ${id}`); }
}
console.error(`matched: ${best.size}/${wanted.size} channels`);

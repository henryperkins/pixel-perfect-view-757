// SPDX-License-Identifier: AGPL-3.0-or-later
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import sweph from 'sweph';

const manifest = JSON.parse(readFileSync(new URL('../ephemeris.lock.json', import.meta.url)));
const FLAGS = 258;
const BODIES = {sun:0, moon:1, mercury:2, venus:3, mars:4, jupiter:5, saturn:6, uranus:7, neptune:8, pluto:9, node:11};
const NAMES = {sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto',node:'TrueNode'};
const ASPECTS = {conjunction:0, sextile:60, square:90, trine:120, quincunx:150, opposition:180};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const norm = angle => ((angle % 360) + 360) % 360;
const angleDelta = angle => norm(angle + 180) - 180;

/** Conservative order-independent interior of the pinned 1800/2399 files. */
const coverage = Object.freeze({from:Date.parse('1800-01-02T00:00:00Z'), to:Date.parse('2399-12-30T00:00:00Z')});

function utcToUt(ms) {
  if (!Number.isFinite(ms) || ms < coverage.from || ms > coverage.to) throw new Error('source_range');
  const d = new Date(ms);
  const converted = sweph.utc_to_jd(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()+d.getUTCMilliseconds()/1000, sweph.constants.SE_GREG_CAL);
  if (converted.flag !== 0 || !Number.isFinite(converted.data?.[1])) throw new Error('time_conversion');
  return converted.data[1];
}

export function createEngine({ephemerisPath = process.env.SE_EPHE_PATH || fileURLToPath(new URL('../data/ephe/', import.meta.url))} = {}) {
  for (const file of manifest.files) {
    let bytes;
    try { bytes = readFileSync(join(ephemerisPath, file.name)); } catch { throw new Error('ephemeris_integrity'); }
    if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('ephemeris_integrity');
  }
  if (sweph.version() !== '2.10.03') throw new Error('engine_version');
  sweph.set_ephe_path(ephemerisPath);
  const dataId = `sha256:${sha(JSON.stringify(manifest.files.map(({name, sha256}) => ({name, sha256}))))}`;
  const source = Object.freeze({engine:'swiss-ephemeris',engineVersion:sweph.version(),dataId,frame:'tropical-apparent-geocentric-true-equinox-of-date',timeScale:'UT',returnedFlags:FLAGS});
  const sourceId = `pattern-swiss-1:${sha(JSON.stringify({source,utc:'swe_utc_to_jd',wrapper:'sweph@2.10.3-7',solver:'transit-episode-1'})).slice(0,32)}`;
  const position = (body, ms) => {
    if (!Object.hasOwn(BODIES, body)) throw new Error('unsupported_body');
    const result = sweph.calc_ut(utcToUt(ms), BODIES[body], FLAGS);
    if (result.flag !== FLAGS || !result.data?.every(Number.isFinite)) throw new Error('unqualified_source');
    return {longitude:norm(result.data[0]), latitude:result.data[1], speed:result.data[3]};
  };
  const chart = input => {
    const keys = ['date','time','timezoneOffset','latitude','longitude'];
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !keys.includes(k)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}:\d{2}$/.test(input.time) || input.timezoneOffset !== 0 ||
      !Number.isFinite(input.latitude) || Math.abs(input.latitude)>90 || !Number.isFinite(input.longitude) || Math.abs(input.longitude)>180) throw new Error('invalid_request');
    const iso = `${input.date}T${input.time}.000Z`, ms = Date.parse(iso);
    if (!Number.isFinite(ms) || new Date(ms).toISOString() !== iso) throw new Error('invalid_request');
    const jd = utcToUt(ms);
    const planets = Object.keys(BODIES).map(body => ({name:NAMES[body], ...position(body, ms)}));
    let houseSystem = 'P', houses = sweph.houses_ex2(jd, 0, input.latitude, input.longitude, 'P');
    if (houses.flag !== 0) {
      houseSystem = 'O';
      houses = sweph.houses_ex2(jd, 0, input.latitude, input.longitude, 'O');
    }
    if (houses.flag !== 0 || houses.data?.houses?.length !== 12 || !houses.data.houses.every(Number.isFinite) ||
      !houses.data.points.every(Number.isFinite)) throw new Error('houses_unavailable');
    const aspects = [];
    for (let i=0;i<planets.length;i++) for (let j=i+1;j<planets.length;j++) {
      const a=planets[i],b=planets[j], delta=angleDelta(a.longitude-b.longitude);
      const separation=Math.abs(delta);
      for (const [name, angle] of Object.entries(ASPECTS)) {
        const orb=Math.abs(separation-angle);
        const luminary = [a.name,b.name].some(n => n==='Sun'||n==='Moon');
        const limit = name==='quincunx' ? 3 : luminary ? 8 : 6;
        if (orb <= limit) aspects.push({planet1:a.name,planet2:b.name,type:{name},orb,isApplying:(separation-angle)*Math.sign(delta)*(a.speed-b.speed)<0});
      }
    }
    return {data:{planets, houses:{system:houseSystem,cusps:houses.data.houses.map(norm),ascendant:norm(houses.data.points[0]),mc:norm(houses.data.points[1])}, aspects, positionSource:source,
      meta:{engineVersion:source.engineVersion,sourceId,houseFallback:houseSystem==='P'?null:'placidus_unavailable'}}};
  };
  const metadata = Object.freeze({source,sourceId,wrapper:'sweph@2.10.3-7',files:manifest.files,upstreamCommit:manifest.commit,utcConversion:'swe_utc_to_jd: UT1 result -> swe_calc_ut; pre-1972 input follows Swiss UT convention',coverage:{from:new Date(coverage.from).toISOString(),to:new Date(coverage.to).toISOString()},houseSystem:'placidus',houseFallback:'porphyry-explicit',license:'AGPL-3.0-or-later'});
  return {source,sourceId,coverage,metadata,position,chart};
}

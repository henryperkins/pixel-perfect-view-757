// SPDX-License-Identifier: AGPL-3.0-or-later
import {readFile, writeFile, mkdir, rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const manifest = JSON.parse(await readFile(new URL('../ephemeris.lock.json', import.meta.url)));
const folder = process.env.SE_EPHE_PATH || fileURLToPath(new URL('../data/ephe/', import.meta.url));
const matches = (bytes, file) => bytes.length === file.bytes && createHash('sha256').update(bytes).digest('hex') === file.sha256;
await mkdir(folder, {recursive:true});
for (const file of manifest.files) {
  const dest = join(folder, file.name);
  const old = await readFile(dest).catch(() => null);
  if (old && matches(old, file)) continue;
  const url = `https://raw.githubusercontent.com/aloistr/swisseph/${manifest.commit}/${manifest.path}/${file.name}`;
  const response = await fetch(url, {signal:AbortSignal.timeout(30000), redirect:'error'});
  if (!response.ok) throw new Error(`ephemeris_download_${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!matches(bytes, file)) throw new Error('ephemeris_integrity');
  await writeFile(`${dest}.tmp`, bytes);
  await rename(`${dest}.tmp`, dest);
}
console.log(`Verified ${manifest.files.length} pinned ephemeris files.`);

#!/usr/bin/env node
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFile(resolve(root, path), 'utf8');
const exists = async (path) => {
  try {
    await access(resolve(root, path), constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const internalPaths = [
  'KingdomSolutionz.Web/ClientApp/src/app/platform',
  'KingdomSolutionz.Web/Controllers/KingdomIntegrationController.cs',
  'KingdomSolutionz.Web/Controllers/KingdomSessionController.cs',
  'KingdomSolutionz.Web/Security/KingdomIdentity.cs',
  'docs/module-boundaries.md',
];

for (const path of internalPaths) {
  assert.equal(
    await exists(path),
    false,
    `${path} belongs in a KingdomOS product repository, not the public website.`,
  );
}

const program = await read('KingdomSolutionz.Web/Program.cs');
assert.doesNotMatch(program, /KingdomOS|ModuleKey|IntegrationInbox|ModuleEntitlement/i);
assert.match(program, /ILeadService/);
assert.match(program, /MapControllers\(\)/);
assert.match(program, /MapFallbackToFile\("index\.html"\)/);

const routing = await read('KingdomSolutionz.Web/ClientApp/src/app/app-routing.module.ts');
assert.doesNotMatch(routing, /path:\s*['"]app['"]/i);
assert.doesNotMatch(routing, /platform\/|assignment-travel|care-network/i);

for (const publicPage of [
  'home',
  'about',
  'services',
  'pricing',
  'portfolio',
  'contact',
  'start-project',
]) {
  assert.equal(
    await exists(`KingdomSolutionz.Web/ClientApp/src/app/pages/${publicPage}`),
    true,
    `The public ${publicPage} page is missing.`,
  );
}

console.log('KingdomSolutionz remains a public website with no internal KingdomOS module code.');

// Run: npx tsx --test lib/route-access.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { PRIVATE_ROUTES, PUBLIC_ROUTES, needsSignIn } from './route-access';

test('every top-level app folder is classified as private or public, once', () => {
    const appDir = path.join(__dirname, '..', 'app');
    const folders = readdirSync(appDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        // api routes guard themselves; route groups and private folders aren't URLs
        .filter((name) => name !== 'api' && !name.startsWith('(') && !name.startsWith('_'));

    const privateSet = new Set<string>(PRIVATE_ROUTES);
    const publicSet = new Set<string>(PUBLIC_ROUTES);
    for (const name of folders) {
        const route = `/${name}`;
        const listed = Number(privateSet.has(route)) + Number(publicSet.has(route));
        assert.equal(listed, 1, `${route} must be in exactly one of PRIVATE_ROUTES or PUBLIC_ROUTES`);
    }
});

test('private pages need sign-in, including their sub-pages', () => {
    assert.equal(needsSignIn('/settings'), true);
    assert.equal(needsSignIn('/settings/my-data'), true);
    assert.equal(needsSignIn('/episodes/abc'), true);
    assert.equal(needsSignIn('/snips'), true);
});

test('public pages and unknown addresses do not', () => {
    assert.equal(needsSignIn('/'), false);
    assert.equal(needsSignIn('/snip/abc'), false, 'a shared highlight opens for the person it was sent to');
    assert.equal(needsSignIn('/share/abc'), false);
    assert.equal(needsSignIn('/no-such-page'), false, 'unknown addresses reach the 404 page');
});

test('matching is by whole path segment', () => {
    assert.equal(needsSignIn('/snipsy'), false);
    assert.equal(needsSignIn('/searching'), false);
});

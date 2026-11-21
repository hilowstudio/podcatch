// Run: npx tsx --test lib/player/logic.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    positionAtEnd, positionNext, moveUpdates, nextInQueue, resumeAt, isFinished, sleepDeadline, sleepLabel,
} from './logic';

const q = [
    { episodeId: 'a', position: 1 },
    { episodeId: 'b', position: 2 },
    { episodeId: 'c', position: 3 },
];

test('adding to the end goes after the last episode', () => {
    assert.equal(positionAtEnd([]), 1);
    assert.equal(positionAtEnd(q), 4);
});

test('play next goes straight after the episode playing now', () => {
    assert.equal(positionNext(q, 'a'), 1.5);
    assert.equal(positionNext(q, 'c'), 4);
});

test('play next goes to the front when nothing in the queue is playing', () => {
    assert.equal(positionNext(q, null), 0);
    assert.equal(positionNext(q, 'not-queued'), 0);
    assert.equal(positionNext([], null), 1);
});

test('moving swaps with the neighbour, and does nothing at the edges', () => {
    assert.deepEqual(moveUpdates(q, 'b', 'up'), [{ episodeId: 'b', position: 1 }, { episodeId: 'a', position: 2 }]);
    assert.deepEqual(moveUpdates(q, 'b', 'down'), [{ episodeId: 'b', position: 3 }, { episodeId: 'c', position: 2 }]);
    assert.deepEqual(moveUpdates(q, 'a', 'up'), []);
    assert.deepEqual(moveUpdates(q, 'c', 'down'), []);
    assert.deepEqual(moveUpdates(q, 'zzz', 'up'), []);
});

test('the next episode skips the one playing now', () => {
    assert.equal(nextInQueue(q, 'a'), 'b');
    assert.equal(nextInQueue(q, null), 'a');
    assert.equal(nextInQueue([{ episodeId: 'a', position: 1 }], 'a'), null);
});

test('resume backs up a few seconds, and starts finished episodes from the top', () => {
    assert.equal(resumeAt(120, 600, false), 117);
    assert.equal(resumeAt(2, 600, false), 0);
    assert.equal(resumeAt(590, 600, false), 0);
    assert.equal(resumeAt(300, 600, true), 0);
    assert.equal(resumeAt(null, null, false), 0);
    assert.equal(resumeAt(300, null, false), 297);
});

test('an episode counts as finished in its last 30 seconds', () => {
    assert.equal(isFinished(575, 600), true);
    assert.equal(isFinished(500, 600), false);
    assert.equal(isFinished(500, null), false);
});

test('sleep timer deadline and label', () => {
    const now = 1_000_000;
    assert.equal(sleepDeadline({ kind: 'minutes', minutes: 15 }, now), now + 900_000);
    assert.equal(sleepDeadline({ kind: 'end-of-episode' }, now), null);
    assert.equal(sleepLabel({ kind: 'off' }, now, null), 'Sleep timer');
    assert.equal(sleepLabel({ kind: 'end-of-episode' }, now, null), 'Sleep: end');
    assert.equal(sleepLabel({ kind: 'minutes', minutes: 15 }, now, now + 61_000), 'Sleep: 2 min');
});

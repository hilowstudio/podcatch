// Run: npx tsx --test lib/billing/cancel-on-delete.test.ts
// No network: Stripe is a fake that records what was cancelled.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancelSubscriptionsBeforeDelete } from './cancel-on-delete';

type Sub = { id: string; status: string };

function fakeStripe(subs: Sub[], opts: { failOn?: 'list' | 'cancel' } = {}) {
    const cancelled: string[] = [];
    const client = {
        subscriptions: {
            list: (_params: unknown) => {
                if (opts.failOn === 'list') throw new Error('network down');
                return (async function* () {
                    for (const s of subs) yield s;
                })();
            },
            cancel: async (id: string) => {
                if (opts.failOn === 'cancel') throw new Error('stripe refused');
                cancelled.push(id);
                return { id, status: 'canceled' };
            },
        },
    };
    return { client: client as any, cancelled };
}

test('a user with no Stripe customer is deleted with nothing to cancel', async () => {
    const { client, cancelled } = fakeStripe([]);
    assert.deepEqual(await cancelSubscriptionsBeforeDelete(client, null), { ok: true, cancelled: [] });
    assert.deepEqual(cancelled, []);
});

test('every subscription that could still charge is cancelled', async () => {
    const { client, cancelled } = fakeStripe([
        { id: 'sub_active', status: 'active' },
        { id: 'sub_trial', status: 'trialing' },
        { id: 'sub_late', status: 'past_due' },
        { id: 'sub_old', status: 'canceled' },
        { id: 'sub_dead', status: 'incomplete_expired' },
    ]);
    const result = await cancelSubscriptionsBeforeDelete(client, 'cus_1');
    assert.equal(result.ok, true);
    assert.deepEqual(cancelled, ['sub_active', 'sub_trial', 'sub_late']);
});

test('if Stripe cannot be reached, deletion is stopped', async () => {
    const { client } = fakeStripe([{ id: 'sub_active', status: 'active' }], { failOn: 'list' });
    assert.deepEqual(await cancelSubscriptionsBeforeDelete(client, 'cus_1'), { ok: false, error: 'stripe' });
});

test('if a cancellation fails, deletion is stopped', async () => {
    const { client } = fakeStripe([{ id: 'sub_active', status: 'active' }], { failOn: 'cancel' });
    assert.deepEqual(await cancelSubscriptionsBeforeDelete(client, 'cus_1'), { ok: false, error: 'stripe' });
});

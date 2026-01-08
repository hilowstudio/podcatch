
const { Client } = require('pg');

// Using the Transaction Mode URL for query
const connectionString = "postgresql://postgres.zbkdztckegnnstlbnuxs:Bogusjack3!!!@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const client = new Client({
    connectionString,
});

async function main() {
    await client.connect();
    const feedId = 'cmk2ztnux00000ajrn0u3uv0f';
    const res = await client.query('SELECT * FROM "Feed" WHERE id = $1', [feedId]);
    console.log('Feed:', res.rows[0]);
    await client.end();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

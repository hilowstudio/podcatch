
import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    await client.connect();

    console.log('--- Checking Feed Table Columns ---');
    const feedRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Feed';`);
    feedRes.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    console.log('\n--- Checking Subscription Table Columns ---');
    const subRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Subscription';`);
    subRes.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    console.log('\n--- Checking User Table Columns ---');
    const userRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User';`);
    userRes.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    console.log('\n--- Checking Episode Table Columns ---');
    const epRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Episode';`);
    epRes.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    await client.end();
}

main().catch(console.error);

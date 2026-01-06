import 'dotenv/config';
import { stripe } from '../lib/stripe';

async function main() {
    const products = ['prod_Tk7JuMY6NHDrdW', 'prod_Tk7JaHrb4ZQR7w'];

    console.log('Fetching prices...');

    for (const prod of products) {
        try {
            const prices = await stripe.prices.list({ product: prod, active: true });
            console.log(`Product ${prod}:`);
            prices.data.forEach(p => {
                console.log(` - ${p.id} : ${p.unit_amount ? p.unit_amount / 100 : 0} ${p.currency.toUpperCase()} / ${p.recurring?.interval}`);
            });
        } catch (e: any) {
            console.error(`Error fetching ${prod}:`, e.message);
        }
    }
}
main();

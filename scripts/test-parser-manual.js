
const Parser = require('rss-parser');

const rssParser = new Parser({
    customFields: {
        item: [['podcast:transcript', 'transcript']],
    },
    // xml2js: {
    //     strict: false,
    // }
});

async function run() {
    const url = 'https://feeds.simplecast.com/54nAGcIl'; // The Daily
    try {
        console.log(`Parsing ${url}...`);
        const feed = await rssParser.parseURL(url);
        console.log('Feed Title:', feed.title);
        console.log('Items:', feed.items.length);
        console.log('iTunes Data:', feed.itunes);
    } catch (e) {
        console.error('Error:', e);
    }
}

run();

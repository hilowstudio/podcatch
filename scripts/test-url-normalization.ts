
function normalizeLinks(links: string[]): string[] {
    return links.map(link => {
        const trimmed = link.trim();
        if (!trimmed) return trimmed;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        return `https://${trimmed}`;
    });
}

const testCases = [
    { input: ['copper.com/agency'], expected: ['https://copper.com/agency'] },
    { input: ['https://google.com'], expected: ['https://google.com'] },
    { input: ['http://example.com'], expected: ['http://example.com'] },
    { input: ['sub.domain.co.uk/path?q=1'], expected: ['https://sub.domain.co.uk/path?q=1'] },
    { input: ['  spaces.com  '], expected: ['https://spaces.com'] },
    { input: ['', 'valid.com'], expected: ['', 'https://valid.com'] }
];

testCases.forEach(({ input, expected }, i) => {
    const result = normalizeLinks(input);
    const success = JSON.stringify(result) === JSON.stringify(expected);
    console.log(`Test ${i + 1}: ${success ? '✅' : '❌'}`);
    if (!success) {
        console.log(`  Input: ${JSON.stringify(input)}`);
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Result: ${JSON.stringify(result)}`);
    }
});

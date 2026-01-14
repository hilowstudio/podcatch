'use client';

import Image from 'next/image';

const integrations = [
    { name: 'Claude', logo: '/claude.png' },
    { name: 'Google Drive', logo: '/drive.png' },
    { name: 'Jira', logo: '/jira.png' },
    { name: 'Linear', logo: '/linear.png' },
    { name: 'Make', logo: '/make.svg' },
    { name: 'n8n', logo: '/n8n.svg' },
    { name: 'Notion', logo: '/notion.png' },
    { name: 'Obsidian', logo: '/obsidian.png' },
    { name: 'OpenAI', logo: '/openai.png' },
    { name: 'Readwise', logo: '/readwise.svg' },
    { name: 'Slack', logo: '/slack.png' },
    { name: 'Tana', logo: '/tana.png' },
    { name: 'Zapier', logo: '/zapier.png' },
];

export function IntegrationsCarousel() {
    return (
        <section className="py-12 overflow-hidden bg-muted/30 border-y">
            <div className="container mx-auto px-4 text-center mb-8">
                <h2 className="text-xl font-semibold text-muted-foreground">
                    Works with your favorite tools
                </h2>
            </div>
            <div className="relative flex overflow-hidden">
                {/* Gradient overlays for fade effect */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

                {/* Scrolling track - duplicated for seamless loop */}
                <div className="flex animate-marquee gap-12 py-4">
                    {integrations.map((integration) => (
                        <div
                            key={integration.name}
                            className="flex items-center justify-center flex-shrink-0 w-24 h-16 grayscale hover:grayscale-0 transition-all duration-300"
                            title={integration.name}
                        >
                            <Image
                                src={integration.logo}
                                alt={integration.name}
                                width={64}
                                height={64}
                                className="object-contain max-h-12"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex animate-marquee gap-12 py-4" aria-hidden="true">
                    {integrations.map((integration) => (
                        <div
                            key={`dup-${integration.name}`}
                            className="flex items-center justify-center flex-shrink-0 w-24 h-16 grayscale hover:grayscale-0 transition-all duration-300"
                            title={integration.name}
                        >
                            <Image
                                src={integration.logo}
                                alt={integration.name}
                                width={64}
                                height={64}
                                className="object-contain max-h-12"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

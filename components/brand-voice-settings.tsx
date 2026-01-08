'use client';

import { useState } from 'react';
import { updateBrandVoice } from '@/actions/settings-actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles, ArrowRight, ArrowLeft, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandVoiceSettings({ initialVoice }: { initialVoice: string }) {
    const [step, setStep] = useState(0); // 0=Intro/Preview, 1=Tone, 2=Persona, 3=Mechanics, 4=Constraints
    const [result, setResult] = useState(initialVoice || '');
    const [isLoading, setIsLoading] = useState(false);

    // Wizard State
    const [tone, setTone] = useState({
        formal: 50, // 0=Casual, 100=Formal
        enthusiasm: 50, // 0=Matter-of-fact, 100=Enthusiastic
        humor: 30, // 0=Serious, 100=Funny
        modern: 60, // 0=Classic, 100=Modern/Slang
        concise: 50, // 0=Descriptive, 100=Concise
    });

    const [persona, setPersona] = useState({
        celebrity: '',
        relationship: 'Peer', // Mentor, Peer, Cheerleader, Challenger
    });

    const [mechanics, setMechanics] = useState({
        formatting: 'Mixed', // Bullets, Prose, Mixed
        emoji: 'Minimal', // None, Minimal, Heavy
    });

    const [constraints, setConstraints] = useState({
        cringeWords: '',
        competitor: '',
    });

    // --- Helpers ---

    const getToneLabel = (val: number, left: string, right: string) => {
        if (val < 30) return left;
        if (val > 70) return right;
        return 'Balanced';
    };

    const generateVoice = () => {
        const toneDesc = `
- Tone: ${getToneLabel(tone.formal, 'Casual and conversational', 'Formal and professional')}
- Energy: ${getToneLabel(tone.enthusiasm, 'Matter-of-fact and calm', 'Enthusiastic and high-energy')}
- Humor: ${getToneLabel(tone.humor, 'Serious and direct', 'Witty and humorous')}
- Diction: ${getToneLabel(tone.modern, 'Classic and timeless', 'Modern and current')}
- Length: ${getToneLabel(tone.concise, 'Descriptive and storytelling', 'Concise and to-the-point')}
        `.trim();

        const personaDesc = `
- Persona/Archetype: ${persona.celebrity || 'Helpful expert'}
- Relationship to User: ${persona.relationship}
        `.trim();

        const mechDesc = `
- Formatting: ${mechanics.formatting}
- Emoji Usage: ${mechanics.emoji}
        `.trim();

        const constDesc = `
- Avoid these words/phrases: ${constraints.cringeWords || 'None'}
- Anti-Persona (Do NOT sound like): ${constraints.competitor || 'Generic AI'}
        `.trim();

        const prompt = `You are a specialized writer. Adhere strictly to this Brand Voice Style Guide:

### 1. Tone & Style
${toneDesc}

### 2. Persona
${personaDesc}

### 3. Mechanics & Formatting
${mechDesc}

### 4. Constraints (Strict adherence required)
${constDesc}

Important: Never mention that you are an AI. Stay in character.`;

        setResult(prompt);
        setStep(0); // Go back to preview
    };

    async function handleSave() {
        setIsLoading(true);
        try {
            const res = await updateBrandVoice(result);
            if (res.success) {
                toast.success('Brand Voice updated');
            } else {
                toast.error('Failed to save');
            }
        } catch (e) {
            toast.error('Error saving settings');
        } finally {
            setIsLoading(false);
        }
    }

    // --- Steps Render ---

    const renderToneStep = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
                <ToneSlider
                    label="Formal vs. Casual"
                    left="Casual"
                    right="Formal"
                    value={tone.formal}
                    onChange={(v) => setTone(prev => ({ ...prev, formal: v }))}
                />
                <ToneSlider
                    label="Energy"
                    left="Matter-of-fact"
                    right="Enthusiastic"
                    value={tone.enthusiasm}
                    onChange={(v) => setTone(prev => ({ ...prev, enthusiasm: v }))}
                />
                <ToneSlider
                    label="Humor"
                    left="Serious"
                    right="Funny"
                    value={tone.humor}
                    onChange={(v) => setTone(prev => ({ ...prev, humor: v }))}
                />
                <ToneSlider
                    label="Language Style"
                    left="Classic"
                    right="Modern/Slang"
                    value={tone.modern}
                    onChange={(v) => setTone(prev => ({ ...prev, modern: v }))}
                />
                <ToneSlider
                    label="Verbosity"
                    left="Descriptive"
                    right="Concise"
                    value={tone.concise}
                    onChange={(v) => setTone(prev => ({ ...prev, concise: v }))}
                />
            </div>
        </div>
    );

    const renderPersonaStep = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>The "Celebrity" Proxy</Label>
                    <Input
                        placeholder="e.g. Ryan Reynolds, Neil deGrasse Tyson, Friendly Neighbor"
                        value={persona.celebrity}
                        onChange={(e) => setPersona({ ...persona, celebrity: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Who would play your brand in a movie?</p>
                </div>
                <div className="space-y-2">
                    <Label>Relationship to Audience</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Mentor', 'Peer', 'Cheerleader', 'Challenger'].map(r => (
                            <Button
                                key={r}
                                variant={persona.relationship === r ? 'default' : 'outline'}
                                onClick={() => setPersona({ ...persona, relationship: r })}
                                className="w-full"
                            >
                                {r}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMechanicsStep = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Formatting Preference</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Bullets', 'Prose', 'Mixed'].map(f => (
                            <Button
                                key={f}
                                variant={mechanics.formatting === f ? 'default' : 'outline'}
                                onClick={() => setMechanics({ ...mechanics, formatting: f })}
                                className="w-full"
                            >
                                {f}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Emoji Usage</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {['None', 'Minimal', 'Heavy'].map(e => (
                            <Button
                                key={e}
                                variant={mechanics.emoji === e ? 'default' : 'outline'}
                                onClick={() => setMechanics({ ...mechanics, emoji: e })}
                                className="w-full"
                            >
                                {e}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConstraintsStep = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>The "Cringe" List (Forbidden Words)</Label>
                    <Input
                        placeholder="e.g. synergy, unlock, delve, tapestry"
                        value={constraints.cringeWords}
                        onChange={(e) => setConstraints({ ...constraints, cringeWords: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Anti-Persona (Do NOT sound like...)</Label>
                    <Input
                        placeholder="e.g. A pushy salesperson, a boring textbook"
                        value={constraints.competitor}
                        onChange={(e) => setConstraints({ ...constraints, competitor: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <Card className="border-indigo-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
                <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: step === 0 ? '100%' : `${(step / 4) * 100}%` }}
                />
            </div>

            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        <CardTitle>{step === 0 ? 'Brand Voice & Style Guide' : getStepTitle(step)}</CardTitle>
                    </div>
                    {step === 0 && (
                        <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-2">
                            <Wand2 className="h-4 w-4" /> Open Wizard
                        </Button>
                    )}
                </div>
                <CardDescription>
                    {step === 0
                        ? 'Define your persona, tone, and formatting rules. This will be applied to all AI-generated content.'
                        : 'Let\'s define your unique style.'}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {step === 0 && (
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Your generated system instructions will appear here..."
                            className="min-h-[250px] font-mono text-sm leading-relaxed"
                            value={result}
                            onChange={(e) => setResult(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> Save Brand Voice
                            </Button>
                        </div>
                    </div>
                )}

                {step === 1 && renderToneStep()}
                {step === 2 && renderPersonaStep()}
                {step === 3 && renderMechanicsStep()}
                {step === 4 && renderConstraintsStep()}
            </CardContent>

            {step > 0 && (
                <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="ghost" onClick={() => setStep(step - 1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    {step < 4 ? (
                        <Button onClick={() => setStep(step + 1)}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={generateVoice} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Wand2 className="mr-2 h-4 w-4" /> Generate Voice
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}

function ToneSlider({ label, value, onChange, left, right }: { label: string, value: number, onChange: (v: number) => void, left: string, right: string }) {
    return (
        <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">{label}</span>
                <span className="font-bold text-indigo-500">{value}%</span>
            </div>
            <Slider
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
                max={100}
                step={1}
                className="py-1"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{left}</span>
                <span>{right}</span>
            </div>
        </div>
    );
}

function getStepTitle(step: number) {
    switch (step) {
        case 1: return 'Step 1: The "Slider" Questions (Tone)';
        case 2: return 'Step 2: Persona & Archetype';
        case 3: return 'Step 3: Mechanics & Formatting';
        case 4: return 'Step 4: Anti-Persona (Constraints)';
        default: return '';
    }
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminImportPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleImport = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/admin/import-sermons', {
                method: 'POST',
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                toast.success(`Imported ${data.imported} sermons!`);
            } else {
                toast.error(data.errors?.[0] || 'Import failed');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
            setResult({ success: false, errors: ['Network error or server failed'] });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-12">
            <Card className="border-indigo-500/20 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Admin Tools: Batch Import
                    </CardTitle>
                    <CardDescription>
                        Trigger the batch import of sermon MP3 URLs from Pastor Adam Vega.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Details:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Target: Pastor Adam Vega (Virtual Feed)</li>
                            <li>Count: 114 Sermons</li>
                            <li>Action: Creates episodes and triggers transcription/AI analysis</li>
                        </ul>
                    </div>

                    {!result && (
                        <Button
                            onClick={handleImport}
                            disabled={isLoading}
                            className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Importing Sermons...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-5 w-5 fill-current" />
                                    Start Import Now
                                </>
                            )}
                        </Button>
                    )}

                    {result && (
                        <div className={`p-6 rounded-lg border ${result.success ? 'bg-status-success/5 border-status-success/20' : 'bg-status-danger/5 border-status-danger/20'}`}>
                            <div className="flex items-start gap-3">
                                {result.success ? (
                                    <CheckCircle2 className="h-6 w-6 text-status-success shrink-0" />
                                ) : (
                                    <AlertCircle className="h-6 w-6 text-status-danger shrink-0" />
                                )}
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">
                                        {result.success ? 'Import Complete' : 'Import Failed'}
                                    </h3>
                                    {result.success && (
                                        <div className="text-sm space-y-1">
                                            <p>Successfully imported: <span className="font-bold">{result.imported}</span></p>
                                            <p>Already existed (skipped): <span className="font-bold">{result.skipped}</span></p>
                                        </div>
                                    )}
                                    {result.errors && result.errors.length > 0 && (
                                        <div className="mt-4 p-3 bg-status-danger/10 rounded border border-status-danger/20 text-xs font-mono max-h-40 overflow-y-auto">
                                            {result.errors.map((err: string, i: number) => (
                                                <p key={i} className="text-status-danger mb-1">• {err}</p>
                                            ))}
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => setResult(null)} className="mt-2">
                                        Run Again
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

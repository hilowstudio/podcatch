'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Check } from 'lucide-react';
import { exportUserData } from '@/actions/data-export-actions';
import { toast } from 'sonner';

export function DataExportButton() {
    const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

    const handleExport = async () => {
        setState('loading');
        try {
            const result = await exportUserData();
            if (!result.success || !result.data) {
                toast.error(result.error || 'Export failed');
                setState('idle');
                return;
            }

            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `podcatch-export-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setState('done');
            toast.success('Data exported successfully');
        } catch {
            toast.error('Export failed');
            setState('idle');
        }
    };

    return (
        <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            disabled={state === 'loading'}
        >
            {state === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>
            ) : state === 'done' ? (
                <><Check className="h-4 w-4" /> Exported</>
            ) : (
                <><Download className="h-4 w-4" /> Export My Data</>
            )}
        </Button>
    );
}

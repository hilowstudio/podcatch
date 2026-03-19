import { cn } from "@/lib/utils";

interface UsageBarProps {
    usage: number;
    limit: number;
    className?: string;
}

export function UsageBar({ usage, limit, className }: UsageBarProps) {
    const percentage = Math.min((usage / Math.max(limit, 1)) * 100, 100);

    // Color logic
    let colorClass = "bg-primary";
    if (percentage >= 90) colorClass = "bg-status-danger";
    else if (percentage >= 75) colorClass = "bg-status-warning";

    return (
        <div className={cn("space-y-1 w-full", className)}>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Monthly Usage</span>
                <span>{usage} / {limit}</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-500 ease-in-out", colorClass)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

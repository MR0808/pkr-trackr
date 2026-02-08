import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Props = {
    title: string;
    value: string | number;
    subtitle?: string;
    className?: string;
};

export function StatCard({ title, value, subtitle, className }: Props) {
    return (
        <Card className={className}>
            <CardHeader className="pb-1">
                <p className="text-sm font-medium text-muted-foreground">
                    {title}
                </p>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                {subtitle != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

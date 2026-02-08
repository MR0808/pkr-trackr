import { StatsNav } from '@/components/stats/StatsNav';

export default function StatsLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-w-0">
            <StatsNav />
            <div className="min-w-0">{children}</div>
        </div>
    );
}

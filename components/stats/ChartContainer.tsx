'use client';

import { useRef, useState, useLayoutEffect } from 'react';

/** Measures container and renders chart only when width/height > 0 to avoid Recharts -1 warning. */
export function ChartContainer({
    className,
    style,
    children
}: {
    className?: string;
    style?: React.CSSProperties;
    children: (width: number, height: number) => React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (w > 0 && h > 0) setSize({ width: w, height: h });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{ minHeight: 200, ...style }}
        >
            {size.width > 0 && size.height > 0
                ? children(size.width, size.height)
                : null}
        </div>
    );
}

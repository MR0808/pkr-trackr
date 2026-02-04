'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonProps {
    shareId: string;
    className?: string;
}

export function ShareButton({ shareId, className }: ShareButtonProps) {
    const [isPending, setIsPending] = useState(false);

    const handleShare = async () => {
        if (!shareId) return;
        setIsPending(true);
        try {
            const url =
                typeof window !== 'undefined'
                    ? `${window.location.origin}/r/${shareId}`
                    : `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/r/${shareId}`;
            await navigator.clipboard.writeText(url);
            toast.success('Link copied', {
                description: 'Share link copied to clipboard'
            });
        } catch {
            toast.error('Failed to copy link');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isPending}
            className={className}
        >
            <Share2 className="mr-2 h-4 w-4" />
            {isPending ? 'Copying…' : 'Share'}
        </Button>
    );
}

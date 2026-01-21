
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// This component now acts as a redirector.
// It takes any query parameters from the old /booking route and forwards them,
// although the new /dashboard/book page doesn't use them.
// This is a safe fallback for any old links.
function BookingRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        // The new page is at /dashboard/book. We redirect there.
        // We can pass old params if needed, but the new flow starts from course selection.
        router.replace(`/dashboard/book?${params.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Redirecting to our new booking page...</p>
        </div>
    );
}


export default function RedirectPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>}>
            <BookingRedirect />
        </Suspense>
    );
};

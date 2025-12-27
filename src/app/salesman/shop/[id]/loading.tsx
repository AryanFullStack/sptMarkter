import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 w-full md:w-1/2">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                            <Skeleton className="h-8 w-64 mb-2" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                    </div>
                    <div className="space-y-2 pl-14">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-60" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                {/* Status Card Skeleton */}
                <div className="w-full md:w-1/2">
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>

            {/* Ledger Skeleton */}
            <div>
                <Skeleton className="h-8 w-40 mb-4" />
                <div className="grid md:grid-cols-3 gap-6">
                    <Skeleton className="h-40 w-full rounded-xl md:col-span-1" />
                    <Skeleton className="h-40 w-full rounded-xl md:col-span-2" />
                </div>
            </div>

            {/* Orders Skeleton */}
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
            </div>

            {/* Actions Skeleton */}
            <div>
                <Skeleton className="h-8 w-32 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                </div>
            </div>
        </div>
    );
}

"use client";

import SalesmanOverview from "@/app/salesman/page";

// This component is now deprecated in favor of the modular route-based pages in /app/salesman/*
// We export the Overview for backward compatibility if needed, but it should be removed eventually.
export default function SalesmanDashboard() {
    return <SalesmanOverview />;
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Clock,
    Search,
    ChevronRight,
    Store,
    BarChart3,
    ArrowUpRight,
    ArrowRightCircle,
    Mail,
    Phone
} from "lucide-react";
import { notify } from "@/lib/notifications";
import { formatCurrency } from "@/utils/export-utils";
import { getSalesmenPerformanceAction } from "@/app/admin/actions";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesmanManagement } from "@/components/admin/salesman-management";

export default function SalesmenPage() {
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSalesman, setSelectedSalesman] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            setFilteredData(performanceData.filter(s =>
                s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else {
            setFilteredData(performanceData);
        }
    }, [searchTerm, performanceData]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getSalesmenPerformanceAction();
            setPerformanceData(data);
            setFilteredData(data);
        } catch (error: any) {
            notify.error("Error", "Failed to load performance data");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-[#6B6B6B]">
                <div className="h-10 w-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                Analyzing performance metrics...
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                        Sales Force Command
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Manage your team, assign routes, and track performance
                    </p>
                </div>
            </div>

            <Tabs defaultValue="management" className="space-y-8">
                <TabsList className="bg-[#F7F5F2] p-1 border border-[#E8E8E8]">
                    <TabsTrigger value="management" className="px-6 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Users className="h-4 w-4 mr-2" />
                        Management & Routes
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="px-6 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="animate-in fade-in duration-500">
                    <SalesmanManagement />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-8 animate-in fade-in duration-500">
                    {/* Search Bar only for analytics */}
                    <div className="flex justify-end">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B]" />
                            <Input
                                placeholder="Search analytics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 bg-white"
                            />
                        </div>
                    </div>

                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-l-4 border-l-blue-600 bg-white shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                                    Total Force
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 rounded-lg">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <span className="text-2xl font-bold">{performanceData.length}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-emerald-600 bg-white shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                                    Today's Order Volume
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 rounded-lg">
                                        <ShoppingBag className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <span className="text-2xl font-bold">
                                        {performanceData.reduce((sum, s) => sum + s.stats.todayOrders, 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-[#D4AF37] bg-white shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                                    Cumulative Sales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-yellow-50 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                                    </div>
                                    <span className="text-2xl font-bold">
                                        {formatCurrency(performanceData.reduce((sum, s) => sum + s.stats.totalSales, 0))}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-[#C77D2E] bg-white shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
                                    Pending Collections
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-50 rounded-lg">
                                        <Clock className="h-5 w-5 text-[#C77D2E]" />
                                    </div>
                                    <span className="text-2xl font-bold">
                                        {formatCurrency(performanceData.reduce((sum, s) => sum + s.stats.totalPending, 0))}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Salesmen List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
                                <BarChart3 className="h-6 w-6 text-[#D4AF37]" />
                                Performance Leaderboard
                            </h2>

                            <div className="grid gap-4">
                                {filteredData.map((salesman) => (
                                    <Card
                                        key={salesman.id}
                                        className={`cursor-pointer transition-all border-none shadow-sm hover:shadow-md ${selectedSalesman?.id === salesman.id ? 'ring-2 ring-[#D4AF37]' : ''}`}
                                        onClick={() => setSelectedSalesman(salesman)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                            {salesman.full_name?.charAt(0) || "S"}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-[#1A1A1A]">{salesman.full_name || "Unknown"}</h3>
                                                            <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                                                                <Mail className="h-3 w-3" /> {salesman.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-8 text-center border-l md:pl-8">
                                                    <div>
                                                        <p className="text-[10px] text-[#6B6B6B] uppercase font-bold mb-1">Total Sales</p>
                                                        <p className="font-bold text-[#2D5F3F]">{formatCurrency(salesman.stats.totalSales)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-[#6B6B6B] uppercase font-bold mb-1">Pending</p>
                                                        <p className="font-bold text-red-600">{formatCurrency(salesman.stats.totalPending)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-[#6B6B6B] uppercase font-bold mb-1">Shops</p>
                                                        <p className="font-bold text-[#1A1A1A]">{salesman.stats.shopCount}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-[#6B6B6B] uppercase font-bold mb-1">Today</p>
                                                        <p className={`font-bold ${salesman.stats.todayOrders > 0 ? 'text-[#C77D2E]' : 'text-gray-400'}`}>
                                                            {salesman.stats.todayOrders}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end">
                                                    <ChevronRight className={`h-6 w-6 transition-transform ${selectedSalesman?.id === salesman.id ? 'rotate-90 text-[#D4AF37]' : 'text-gray-300'}`} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Detail: Shop Visibility */}
                        <div className="space-y-4">
                            <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
                                <Store className="h-6 w-6 text-[#C77D2E]" />
                                Shop Visibility
                            </h2>

                            {selectedSalesman ? (
                                <Card className="border-none shadow-md bg-[#FDFCF9]">
                                    <CardHeader className="border-b bg-white">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="font-serif">
                                                Active Portfolio
                                                <p className="text-xs text-[#6B6B6B] font-sans font-normal mt-1">
                                                    Real order activity for {selectedSalesman.full_name}
                                                </p>
                                            </CardTitle>
                                            <ArrowUpRight className="h-5 w-5 text-[#D4AF37]" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y max-h-[600px] overflow-y-auto">
                                            {selectedSalesman.shops.map((shop: any) => (
                                                <div key={shop.id} className="p-4 hover:bg-white transition-colors group">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors">{shop.name}</p>
                                                        <p className="text-xs font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {shop.orderCount} ord
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <p className="text-[#6B6B6B] italic">Contribution</p>
                                                        <div className="text-right">
                                                            <p className="font-bold text-[#2D5F3F]">{formatCurrency(shop.totalSales)} sales</p>
                                                            <p className="text-[10px] font-bold text-red-600">{formatCurrency(shop.totalPending)} pending</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {selectedSalesman.shops.length === 0 && (
                                                <div className="p-8 text-center text-[#6B6B6B]">
                                                    No actual orders placed yet.
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-white border-t">
                                            <Button
                                                className="w-full bg-[#1A1A1A] hover:bg-black gap-2"
                                                onClick={() => router.push(`/admin/orders?salesman=${selectedSalesman.id}`)}
                                            >
                                                Full Order History
                                                <ArrowRightCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-dashed border-2 flex items-center justify-center p-12 text-center text-[#6B6B6B]">
                                    <div className="space-y-3">
                                        <Users className="h-12 w-12 mx-auto opacity-10" />
                                        <p>Select a salesman to view their<br />order-based shop portfolio</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

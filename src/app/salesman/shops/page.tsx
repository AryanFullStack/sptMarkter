"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, User, Store, ArrowRight, Loader2, Globe, List, Calendar, Clock, Navigation } from "lucide-react";
import { searchClients, getSalesmanAssignedShops } from "@/app/actions/salesman-actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { createClient } from "@/supabase/client";
import { cn } from "@/lib/utils";

export default function FindShopsPage() {
    const [query, setQuery] = useState("");
    const [allAssignedShops, setAllAssignedShops] = useState<any[]>([]);
    const [filteredShops, setFilteredShops] = useState<any[]>([]);
    const [searchMode, setSearchMode] = useState<"route" | "global">("route");
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    useEffect(() => {
        loadAssignedShops();
    }, []);

    async function loadAssignedShops() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const res = await getSalesmanAssignedShops(user.id);
            if (res.shops) {
                setAllAssignedShops(res.shops);
                setFilteredShops(res.shops);
            }
        }
        setLoading(false);
    }

    // Handle Search/Filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchMode, allAssignedShops]);

    async function handleSearch() {
        if (searchMode === 'route') {
            if (!query.trim()) {
                setFilteredShops(allAssignedShops);
            } else {
                const lowerQuery = query.toLowerCase();
                const filtered = allAssignedShops.filter(shop =>
                    shop.full_name?.toLowerCase().includes(lowerQuery) ||
                    shop.phone?.toLowerCase().includes(lowerQuery) ||
                    (shop.address && shop.address[0]?.city?.toLowerCase().includes(lowerQuery))
                );
                setFilteredShops(filtered);
            }
        } else {
            if (!query.trim()) {
                setFilteredShops([]);
                return;
            }
            setLoading(true);
            try {
                const { clients } = await searchClients(query);
                setFilteredShops(clients || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
    }

    const shopsForSelectedDay = useMemo(() => {
        return allAssignedShops.filter(shop =>
            shop.schedule?.recurring?.includes(selectedDay) ||
            shop.schedule?.dates?.includes(new Date().toISOString().split('T')[0]) // Simplified date check
        );
    }, [allAssignedShops, selectedDay]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
            {/* Breadcrumb & Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <Link href="/salesman" className="hover:text-[#D4AF37] transition-colors">Dashboard</Link>
                    <span>/</span>
                    <span className="font-medium text-[#1A1A1A]">My Shops</span>
                </div>
                <div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A]">Manage Shop Portfolio</h1>
                    <p className="text-[#6B6B6B] mt-2">View your scheduled route or find new shops in the territory.</p>
                </div>
            </div>

            {/* Main Navigation Tabs */}
            <Tabs value={searchMode} onValueChange={(v: any) => setSearchMode(v)} className="space-y-6">
                <TabsList className="bg-[#F7F5F2] p-1 border border-[#E8E8E8] h-12">
                    <TabsTrigger value="route" className="px-8 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Navigation className="h-4 w-4 mr-2" />
                        My Schedule
                    </TabsTrigger>
                    <TabsTrigger value="global" className="px-8 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Globe className="h-4 w-4 mr-2" />
                        Global Directory
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="route" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Day Selection */}
                    <div className="flex bg-white border border-[#E8E8E8] rounded-xl overflow-hidden shadow-sm overflow-x-auto no-scrollbar">
                        {days.map((day) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    "flex-1 min-w-[100px] py-4 px-2 text-center transition-all border-r last:border-r-0 border-[#E8E8E8 relative",
                                    selectedDay === day ? "bg-[#D4AF37]/5" : "hover:bg-gray-50",
                                    day === today && "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#D4AF37]"
                                )}
                            >
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider block",
                                    selectedDay === day ? "text-[#D4AF37]" : "text-[#6B6B6B]"
                                )}>
                                    {day.substring(0, 3)}
                                </span>
                                {day === today && <span className="text-[10px] text-[#D4AF37] font-bold">TODAY</span>}
                                <div className={cn(
                                    "h-1.5 w-1.5 rounded-full mx-auto mt-1",
                                    selectedDay === day ? "bg-[#D4AF37]" : "bg-transparent"
                                )} />
                            </button>
                        ))}
                    </div>

                    {/* Schedule Content */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                                <Calendar className="h-6 w-6 text-[#D4AF37]" />
                                {selectedDay}'s Route
                            </h2>
                            <Badge variant="outline" className="text-[#D4AF37] border-[#D4AF37]">
                                {shopsForSelectedDay.length} Shops Assigned
                            </Badge>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {shopsForSelectedDay.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-[#F7F5F2] rounded-2xl border-2 border-dashed border-[#E8E8E8]">
                                        <Store className="h-16 w-16 mx-auto mb-4 opacity-10" />
                                        <h3 className="text-xl font-bold text-[#1A1A1A]">No Assignments for {selectedDay}</h3>
                                        <p className="text-[#6B6B6B]">Enjoy your break or visit a global client instead.</p>
                                    </div>
                                ) : (
                                    shopsForSelectedDay.map((shop) => (
                                        <Link key={shop.id} href={`/salesman/shop/${shop.id}`}>
                                            <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-white shadow-md relative overflow-hidden h-full">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D4AF37]" />
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-2.5 bg-[#F7F5F2] rounded-xl group-hover:bg-[#D4AF37] transition-colors">
                                                            <Store className="h-6 w-6 text-[#D4AF37] group-hover:text-white transition-colors" />
                                                        </div>
                                                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                    <h3 className="font-bold text-xl text-[#1A1A1A] mb-2">{shop.full_name}</h3>
                                                    <div className="space-y-2">
                                                        {shop.address && shop.address[0] && (
                                                            <div className="flex items-start gap-2 text-sm text-[#6B6B6B]">
                                                                <MapPin className="h-4 w-4 mt-0.5 text-[#D4AF37]/60" />
                                                                <span>{shop.address[0].address_line1}, {shop.address[0].city}</span>
                                                            </div>
                                                        )}
                                                        {shop.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                                                                <Phone className="h-4 w-4 text-[#D4AF37]/60" />
                                                                <span>{shop.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-6 flex items-center gap-2 border-t pt-4">
                                                        <Badge variant="secondary" className="capitalize bg-gray-100 text-gray-600 font-normal">
                                                            {shop.role?.replace('_', ' ')}
                                                        </Badge>
                                                        <span className="text-[10px] text-gray-400 ml-auto uppercase tracking-tighter">Click to visit</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="global" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    {/* Search Section */}
                    <div className="bg-[#1A1A1A] rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-white font-serif text-2xl font-bold">Global Shop Directory</h2>
                            <p className="text-gray-400 max-w-xl">Search the entire network of registered shops and beauty parlors across the territory.</p>
                            <div className="relative max-w-2xl pt-2">
                                <Search className="absolute left-4 top-[22px] h-6 w-6 text-[#D4AF37]" />
                                <Input
                                    placeholder="Search by name, phone, city..."
                                    className="pl-14 h-14 text-lg bg-white/10 border-white/10 text-white placeholder:text-gray-500 focus:bg-white focus:text-[#1A1A1A] transition-all rounded-xl"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Global Results */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShops.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <Globe className="h-20 w-20 mx-auto mb-6 opacity-5" />
                                    <p className="text-[#6B6B6B] text-lg">
                                        {query ? "No shops found in global directory." : "Type a name or phone number above to begin searching."}
                                    </p>
                                </div>
                            ) : (
                                filteredShops.map(client => (
                                    <Link key={client.id} href={`/salesman/shop/${client.id}`}>
                                        <Card className="hover:shadow-lg transition-all cursor-pointer border-[#E8E8E8] hover:border-[#D4AF37] group h-full">
                                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="font-bold text-lg text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors">{client.full_name}</h3>
                                                        <Badge className="bg-[#1A1A1A] text-white hover:bg-black font-normal">
                                                            {client.role?.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-1.5 text-sm text-[#6B6B6B]">
                                                        {client.phone && (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="h-3.5 w-3.5" /> {client.phone}
                                                            </div>
                                                        )}
                                                        {client.addresses && client.addresses.length > 0 && (
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="h-3.5 w-3.5 mt-0.5" />
                                                                <span className="truncate">{client.addresses[0].city}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t flex items-center text-[#D4AF37] font-bold text-xs uppercase tracking-widest gap-2">
                                                    View Details <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

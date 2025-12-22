"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, User, Store, ArrowRight, Loader2 } from "lucide-react";
import { searchClients } from "@/app/actions/salesman-actions";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists, or I'll implement simple debounce

export default function FindShopsPage() {
    const [query, setQuery] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Custom Debounce Effect since hook might not be there
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 0 || query === "") handleSearch();
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    async function handleSearch() {
        setLoading(true);
        try {
            const { clients } = await searchClients(query);
            setClients(clients || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/salesman" className="hover:text-primary">Dashboard</Link>
                <span>/</span>
                <span className="font-medium text-foreground">Find Shop</span>
            </div>

            <div>
                <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Find Shop</h1>
                <p className="text-[#6B6B6B]">Search for Beauty Parlors and Retailers to manage orders</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by name, phone, or email..."
                    className="pl-10 h-12 text-lg bg-white"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {clients.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No shops found matching your search.</p>
                        </div>
                    ) : (
                        clients.map(client => (
                            <Link key={client.id} href={`/salesman/shop/${client.id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-[#D4AF37]">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-lg text-[#1A1A1A]">{client.full_name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-[#6B6B6B]">
                                                {client.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {client.phone}
                                                    </span>
                                                )}
                                                <Badge variant="secondary" className="text-xs uppercase bg-[#F7F5F2] text-[#6B6B6B]">
                                                    {client.role?.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            {client.addresses && client.addresses.length > 0 && (
                                                <div className="flex items-start gap-2 text-sm text-[#6B6B6B] mt-1">
                                                    <MapPin className="h-3 w-3 mt-0.5" />
                                                    <span>
                                                        {client.addresses[0].address_line1}, {client.addresses[0].city}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

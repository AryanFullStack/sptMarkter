"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchable?: boolean;
    searchPlaceholder?: string;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    className?: string;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchable = false,
    searchPlaceholder = "Search...",
    onRowClick,
    emptyMessage = "No data available",
    className,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchQuery, setSearchQuery] = useState("");

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    // Filter data based on search
    let filteredData = data;
    if (searchable && searchQuery) {
        filteredData = data.filter(row =>
            columns.some(col => {
                const value = row[col.key];
                return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
            })
        );
    }

    // Sort data
    if (sortKey) {
        filteredData = [...filteredData].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            if (aValue === bValue) return 0;

            const comparison = aValue < bValue ? -1 : 1;
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }

    return (
        <div className={cn("space-y-4", className)}>
            {searchable && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            )}

            <div className="border border-[#E8E8E8] rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F7F5F2]">
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        column.sortable && "cursor-pointer hover:bg-[#F0EDE7] select-none",
                                        column.className
                                    )}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {column.sortable && sortKey === column.key && (
                                            sortDirection === "asc" ?
                                                <ChevronUp className="h-4 w-4" /> :
                                                <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center py-12 text-[#6B6B6B]"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((row, index) => (
                                <TableRow
                                    key={index}
                                    className={cn(
                                        onRowClick && "cursor-pointer hover:bg-[#F7F5F2]"
                                    )}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column.key} className={column.className}>
                                            {column.render ? column.render(row) : row[column.key]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {filteredData.length > 0 && (
                <div className="text-sm text-[#6B6B6B]">
                    Showing {filteredData.length} {filteredData.length === 1 ? "result" : "results"}
                </div>
            )}
        </div>
    );
}

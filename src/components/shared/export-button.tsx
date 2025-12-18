"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileText } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToJSON } from "@/utils/export-utils";

interface ExportButtonProps {
    data: any[];
    filename: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg";
}

export function ExportButton({
    data,
    filename,
    variant = "outline",
    size = "default"
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: "csv" | "json") => {
        setIsExporting(true);
        try {
            if (format === "csv") {
                exportToCSV(data, filename);
            } else {
                exportToJSON(data, filename);
            }
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} disabled={isExporting || !data || data.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Export as JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

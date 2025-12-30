// Export Utilities for DataTable
export function exportToCSV(data: Record<string, unknown>[], filename: string, selectedColumns?: string[]) {
    if (data.length === 0) {
        alert("No data to export");
        return;
    }

    // Determine columns
    const columns = selectedColumns || Object.keys(data[0]);

    // Create CSV header
    const header = columns.join(",");

    // Create CSV rows
    const rows = data.map(row =>
        columns.map(col => {
            const value = row[col];
            // Handle values with commas or quotes
            if (value === null || value === undefined) return "";
            const str = String(value);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(",")
    );

    // Combine header and rows
    const csv = [header, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportToExcel(data: Record<string, unknown>[], filename: string, selectedColumns?: string[]) {
    // For now, export as CSV (Excel can open CSV files)
    // In future, can use library like 'xlsx' for true .xlsx format
    exportToCSV(data, filename, selectedColumns);
}

export interface ExportConfig {
    filename: string;
    format: 'csv' | 'excel';
    includeAllColumns?: boolean;
    selectedColumns?: string[];
    selectedRowsOnly?: boolean;
}

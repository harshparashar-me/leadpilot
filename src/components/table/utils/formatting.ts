// Conditional Row Formatting Utility
export interface RowFormattingRule {
    id: string;
    condition: (row: Record<string, unknown>) => boolean;
    className: string;
    priority: number;
}

export const defaultFormattingRules: RowFormattingRule[] = [
    // High priority leads (status = "Interested" AND budget > 100L)
    {
        id: "hot_lead",
        condition: (row) => {
            if (row.status === "Interested" && row.budget) {
                const budgetStr = String(row.budget).replace(/[^\d.]/g, "");
                const budgetNum = parseFloat(budgetStr);
                return budgetNum > 100;
            }
            return false;
        },
        className: "bg-green-50 border-l-2 border-green-500",
        priority: 1,
    },
    // Junk/Not Interested
    {
        id: "cold_lead",
        condition: (row) => row.status === "Junk" || row.status === "Not Interested",
        className: "bg-red-50/30 text-gray-400",
        priority: 2,
    },
    // Recent activity (modified in last 24h)
    {
        id: "recent_activity",
        condition: (row) => {
            if (!row.modified_at) return false;
            const modifiedTime = new Date(row.modified_at as string).getTime();
            const now = Date.now();
            return now - modifiedTime < 24 * 60 * 60 * 1000; // 24 hours
        },
        className: "bg-blue-50/30",
        priority: 3,
    },
];

export function getRowClassName(
    row: Record<string, unknown>,
    rules: RowFormattingRule[] = defaultFormattingRules
): string {
    // Find matching rule with highest priority
    const matchingRule = rules
        .filter(rule => rule.condition(row))
        .sort((a, b) => a.priority - b.priority)[0];

    return matchingRule?.className || "";
}

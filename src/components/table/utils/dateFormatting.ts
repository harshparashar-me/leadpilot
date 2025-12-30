// Date Formatting Utilities for Zoho-like relative dates
export const formatRelativeDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return "Overdue";
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    // For dates beyond 7 days, show formatted date
    return formatDate(dateString);
};

export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
        }).format(date);
    } catch {
        return "-";
    }
};

export const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    } catch {
        return "-";
    }
};


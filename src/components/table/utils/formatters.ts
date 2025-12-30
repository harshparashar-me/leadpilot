export const formatDate = (v?: string) => {
    if (!v) return "-";
    return new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const getStatusColor = (status?: string) => {
    const s = (status || "").toLowerCase();

    if (s.includes("won") || s.includes("completed") || s.includes("connected"))
        return "bg-green-100 text-green-700";

    if (s.includes("lost") || s.includes("junk") || s.includes("cancelled"))
        return "bg-red-100 text-red-700";

    if (s.includes("progress") || s.includes("negotiation"))
        return "bg-blue-100 text-blue-700";

    if (s.includes("pending")) return "bg-yellow-100 text-yellow-800";

    return "bg-gray-100 text-gray-700";
};

export const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
};

import React from "react";

export const Badge = (text: string, color: string) => (
    <span
        className={`px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${color}`}
    >
        {text || "-"}
    </span>
);

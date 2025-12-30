// Copy to Clipboard Component
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyToClipboardProps {
    value: string | number | null | undefined;
    className?: string;
}

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ value, className = "" }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const textToCopy = String(value ?? "");
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    if (value === null || value === undefined || value === "") return null;

    return (
        <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-opacity opacity-0 group-hover:opacity-100 ${className}`}
            title="Click to copy"
        >
            {copied ? (
                <>
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">Copied!</span>
                </>
            ) : (
                <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
            )}
        </button>
    );
};


// Search Highlight Component
import React from "react";

interface SearchHighlightProps {
    text: string | number | null | undefined;
    searchTerm: string;
    className?: string;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({ text, searchTerm, className = "" }) => {
    if (!text || !searchTerm) {
        return <span className={className}>{String(text ?? "")}</span>;
    }

    const textStr = String(text);
    const searchLower = searchTerm.toLowerCase();
    const textLower = textStr.toLowerCase();
    
    if (!textLower.includes(searchLower)) {
        return <span className={className}>{textStr}</span>;
    }

    const parts: Array<{ text: string; highlight: boolean }> = [];
    let lastIndex = 0;
    let index = textLower.indexOf(searchLower, lastIndex);

    while (index !== -1) {
        // Add text before match
        if (index > lastIndex) {
            parts.push({ text: textStr.substring(lastIndex, index), highlight: false });
        }
        // Add matched text
        parts.push({ text: textStr.substring(index, index + searchTerm.length), highlight: true });
        lastIndex = index + searchTerm.length;
        index = textLower.indexOf(searchLower, lastIndex);
    }

    // Add remaining text
    if (lastIndex < textStr.length) {
        parts.push({ text: textStr.substring(lastIndex), highlight: false });
    }

    return (
        <span className={className}>
            {parts.map((part, idx) => (
                part.highlight ? (
                    <mark key={idx} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
                        {part.text}
                    </mark>
                ) : (
                    <span key={idx}>{part.text}</span>
                )
            ))}
        </span>
    );
};


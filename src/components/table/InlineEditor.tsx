// Inline Cell Editor Component
import React, { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";

interface InlineEditorProps {
    value: string | number;
    type?: "text" | "select" | "date" | "number";
    options?: string[];
    onSave: (newValue: string | number) => Promise<void>;
    onCancel: () => void;
}

export const InlineEditor: React.FC<InlineEditorProps> = ({
    value,
    type = "text",
    options,
    onSave,
    onCancel,
}) => {
    const [editValue, setEditValue] = useState(String(value));
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(type === "number" ? Number(editValue) : editValue);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            onCancel();
        }
    };

    if (type === "select" && options) {
        return (
            <div className="flex items-center gap-1 py-1">
                <select
                    ref={inputRef as React.RefObject<HTMLSelectElement>}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                    className="text-xs px-1 py-0.5 border rounded focus:ring-2 focus:ring-blue-200 outline-none w-full"
                >
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={saving}
                className="text-xs px-1 py-0.5 border rounded focus:ring-2 focus:ring-blue-200 outline-none flex-1 min-w-0"
            />
            <button
                onClick={handleSave}
                disabled={saving}
                className="p-0.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                title="Save (Enter)"
            >
                <Check className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={onCancel}
                disabled={saving}
                className="p-0.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                title="Cancel (Esc)"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

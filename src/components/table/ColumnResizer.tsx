// Column Resizer Component
import React, { useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";

interface ColumnResizerProps {
    onResize: (newWidth: number) => void;
    initialWidth: number;
}

export const ColumnResizer: React.FC<ColumnResizerProps> = ({ onResize, initialWidth }) => {
    const [isResizing, setIsResizing] = useState(false);
    const [width, setWidth] = useState(initialWidth);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(initialWidth);

    useEffect(() => {
        setWidth(initialWidth);
    }, [initialWidth]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - startXRef.current;
            const newWidth = Math.max(50, startWidthRef.current + diff); // Minimum 50px
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            onResize(width);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, width, onResize]);

    return (
        <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:w-2 hover:bg-blue-400 transition-all ${
                isResizing ? "w-2 bg-blue-500" : ""
            }`}
            onMouseDown={handleMouseDown}
        >
            <GripVertical className="w-3 h-3 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-blue-600" />
        </div>
    );
};


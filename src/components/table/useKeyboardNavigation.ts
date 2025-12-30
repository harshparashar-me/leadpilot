// Keyboard Navigation Hook
import { useEffect, useRef, useCallback } from "react";

interface UseKeyboardNavigationProps {
    enabled: boolean;
    rowCount: number;
    columnCount: number;
    onNavigate?: (row: number, col: number) => void;
    onSelect?: (row: number) => void;
    onEnter?: (row: number) => void;
}

export function useKeyboardNavigation({
    enabled,
    rowCount,
    columnCount,
    onNavigate,
    onSelect,
    onEnter,
}: UseKeyboardNavigationProps) {
    const currentRow = useRef<number>(-1);
    const currentCol = useRef<number>(0);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Only handle if not typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                currentRow.current = Math.min(rowCount - 1, currentRow.current + 1);
                onNavigate?.(currentRow.current, currentCol.current);
                break;

            case "ArrowUp":
                e.preventDefault();
                currentRow.current = Math.max(0, currentRow.current - 1);
                onNavigate?.(currentRow.current, currentCol.current);
                break;

            case "ArrowRight":
                e.preventDefault();
                currentCol.current = Math.min(columnCount - 1, currentCol.current + 1);
                onNavigate?.(currentRow.current, currentCol.current);
                break;

            case "ArrowLeft":
                e.preventDefault();
                currentCol.current = Math.max(0, currentCol.current - 1);
                onNavigate?.(currentRow.current, currentCol.current);
                break;

            case "Enter":
                e.preventDefault();
                if (currentRow.current >= 0) {
                    onEnter?.(currentRow.current);
                }
                break;

            case " ":
                e.preventDefault();
                if (currentRow.current >= 0 && e.ctrlKey) {
                    onSelect?.(currentRow.current);
                }
                break;
        }
    }, [enabled, rowCount, columnCount, onNavigate, onSelect, onEnter]);

    useEffect(() => {
        if (enabled) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [enabled, handleKeyDown]);

    return { currentRow: currentRow.current, currentCol: currentCol.current };
}


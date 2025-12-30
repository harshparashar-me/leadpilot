// View Density Control
import React from "react";
import { LayoutGrid, List, AlignJustify } from "lucide-react";

export type DensityMode = "compact" | "comfortable" | "spacious";

interface ViewDensityProps {
    density: DensityMode;
    setDensity: (density: DensityMode) => void;
}

export const ViewDensity: React.FC<ViewDensityProps> = ({ density, setDensity }) => {
    return (
        <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border rounded-md text-gray-700 hover:bg-gray-50">
                <LayoutGrid className="w-3.5 h-3.5" />
                Density
            </button>

            <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-lg shadow-lg hidden group-hover:block z-50 p-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-b mb-1">
                    Row Density
                </div>
                <button
                    onClick={() => setDensity("compact")}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50 ${density === "compact" ? "bg-blue-50 text-blue-700" : "text-gray-700"
                        }`}
                >
                    <List className="w-4 h-4" />
                    Compact
                </button>
                <button
                    onClick={() => setDensity("comfortable")}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50 ${density === "comfortable" ? "bg-blue-50 text-blue-700" : "text-gray-700"
                        }`}
                >
                    <AlignJustify className="w-4 h-4" />
                    Comfortable
                </button>
                <button
                    onClick={() => setDensity("spacious")}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50 ${density === "spacious" ? "bg-blue-50 text-blue-700" : "text-gray-700"
                        }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Spacious
                </button>
            </div>
        </div>
    );
};

export function getDensityClass(density: DensityMode): string {
    switch (density) {
        case "compact":
            return "text-xs py-1 px-2";
        case "comfortable":
            return "text-sm py-2 px-3";
        case "spacious":
            return "text-sm py-3 px-4";
        default:
            return "text-sm py-2 px-3";
    }
}

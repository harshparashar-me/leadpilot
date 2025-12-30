import React, { useState } from "react";
import { Eye, EyeOff, LayoutTemplate } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

// Define the available widgets for the dashboard
export type WidgetId = 'stats_overview' | 'pipeline_chart' | 'goal_tracker' | 'recent_activity' | 'quick_actions' | 'deal_filters' | 'top_agents' | 'kpi_custom';

interface DashboardCustomizerProps {
    visibleWidgets: Record<WidgetId, boolean>;
    onToggleWidget: (id: WidgetId) => void;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({ visibleWidgets, onToggleWidget }) => {
    const [open, setOpen] = useState(false);

    const widgets: { id: WidgetId; label: string; description: string }[] = [
        { id: 'stats_overview', label: 'Stats Overview', description: 'Total Leads, Revenue, Active Deals' },
        { id: 'pipeline_chart', label: 'Pipeline Overview', description: 'Visual funnel of deal stages' },
        { id: 'goal_tracker', label: 'Goal Tracker', description: 'Daily/Weekly targets progress' },
        { id: 'recent_activity', label: 'Recent Activity', description: 'Stream of team actions' },
        { id: 'quick_actions', label: 'Quick Actions', description: 'Buttons to create records' },
        { id: 'deal_filters', label: 'Deal Filters', description: 'Shortcuts to filter deals' },
        { id: 'top_agents', label: 'Top Agents', description: 'Leaderboard of sales performance' },
        { id: 'kpi_custom', label: 'Custom KPI', description: 'Display a user-defined KPI' },
    ];

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
                    <LayoutTemplate className="w-4 h-4" />
                    <span className="hidden sm:inline">Customize</span>
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
                <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[16px] bg-white p-6 shadow-2xl focus:outline-none z-[70] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col h-full">
                        <div className="mb-4">
                            <Dialog.Title className="text-lg font-bold text-gray-900">Customize Dashboard</Dialog.Title>
                            <Dialog.Description className="text-sm text-gray-500 mt-1">
                                Toggle widgets to personalize your view. Changes are saved automatically.
                            </Dialog.Description>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-2">
                            {widgets.map((widget) => (
                                <div
                                    key={widget.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                                        visibleWidgets[widget.id] ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100 opacity-70 hover:opacity-100"
                                    )}
                                    onClick={() => onToggleWidget(widget.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                            visibleWidgets[widget.id] ? "bg-white text-blue-600 shadow-sm" : "bg-gray-200 text-gray-400"
                                        )}>
                                            <LayoutTemplate className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className={cn("text-sm font-semibold", visibleWidgets[widget.id] ? "text-gray-900" : "text-gray-500")}>
                                                {widget.label}
                                            </h4>
                                            <p className="text-xs text-gray-400">{widget.description}</p>
                                        </div>
                                    </div>

                                    <button className={cn(
                                        "p-2 rounded-full transition-colors",
                                        visibleWidgets[widget.id] ? "text-blue-600 bg-blue-100" : "text-gray-400 hover:text-gray-600"
                                    )}>
                                        {visibleWidgets[widget.id] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                                    Done
                                </button>
                            </Dialog.Close>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

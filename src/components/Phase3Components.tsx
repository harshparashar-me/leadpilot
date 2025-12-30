import React, { useState, useEffect } from 'react';
import { getPipelines, getDealsByStage, type Pipeline } from '../lib/phase3Services';
import { MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';

// Simple Kanban component
export const KanbanBoard: React.FC<{ pipelineId: string }> = ({ pipelineId }) => {
    const [pipeline, setPipeline] = useState<Pipeline | null>(null);
    const [dealsByStage, setDealsByStage] = useState<any>({});

    useEffect(() => {
        loadData();
    }, [pipelineId]);

    const loadData = async () => {
        const pipelines = await getPipelines();
        const found = pipelines.find(p => p.id === pipelineId);
        setPipeline(found || null);

        const deals = await getDealsByStage(pipelineId);
        const grouped: any = {};
        deals.forEach((d: any) => {
            if (!grouped[d.stage_id]) grouped[d.stage_id] = [];
            grouped[d.stage_id].push(d);
        });
        setDealsByStage(grouped);
    };

    if (!pipeline) return <div>Loading...</div>;

    return (
        <div className="flex gap-4 overflow-x-auto p-4">
            {pipeline.stages.map((stage: any) => (
                <div key={stage.id} className="min-w-[300px] bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold mb-3">{stage.name}</h3>
                    <div className="space-y-2">
                        {(dealsByStage[stage.id] || []).map((deal: any) => (
                            <div key={deal.id} className="bg-white p-3 rounded border">
                                <p className="font-medium">{deal.deals?.title || 'Deal'}</p>
                                <p className="text-sm text-gray-500">${deal.deals?.amount || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Simple Analytics Dashboard
export const AnalyticsDashboard: React.FC = () => {
    return (
        <div className="grid grid-cols-3 gap-4 p-4">
            <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <h3 className="font-bold">Revenue</h3>
                </div>
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-gray-500">This month</p>
            </div>

            <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <h3 className="font-bold">Deals</h3>
                </div>
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-gray-500">Won this month</p>
            </div>

            <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="h-8 w-8 text-purple-600" />
                    <h3 className="font-bold">Conversion</h3>
                </div>
                <p className="text-3xl font-bold">0%</p>
                <p className="text-sm text-gray-500">Win rate</p>
            </div>
        </div>
    );
};

// Simple Team Chat
export const TeamChat: React.FC<{ channelId: string }> = ({ channelId }) => {
    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg border">
            <div className="p-4 border-b">
                <h3 className="font-bold">#general</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <p className="text-center text-gray-500 text-sm">No messages yet</p>
            </div>
            <div className="p-4 border-t">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full border rounded-lg p-2"
                />
            </div>
        </div>
    );
};

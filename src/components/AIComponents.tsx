import React, { useState, useEffect } from 'react';
import { getAIInsights, calculateLeadScore, getIntegrations, createIntegration, getAllAIInsights, getAIInsightsStats } from '../lib/aiIntegrations';
import { Brain, Zap, Calendar, MessageSquare, TrendingUp, BarChart3, Users } from 'lucide-react';

// AI Lead Score Display
export const AILeadScore: React.FC<{ leadId: string }> = ({ leadId }) => {
    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInsight();
    }, [leadId]);

    const loadInsight = async () => {
        try {
            const data = await getAIInsights('lead', leadId);
            setInsight(data);
        } catch (error) {
            console.error('Error loading AI insight:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-sm text-gray-500">Loading AI score...</div>;
    if (!insight) return <div className="text-sm text-gray-500">No AI score available</div>;

    const score = insight.score || 0;
    const color = score >= 80 ? 'green' : score >= 60 ? 'blue' : score >= 40 ? 'yellow' : 'gray';

    return (
        <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">AI Lead Score</h3>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                    <svg className="transform -rotate-90 w-20 h-20">
                        <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke={`var(--${color}-600)`}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(score / 100) * 226} 226`}
                            className={`text-${color}-600`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{score}</span>
                    </div>
                </div>

                <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                        Confidence: {insight.confidence}%
                    </p>
                    {insight.recommendations && insight.recommendations[0] && (
                        <div className="text-sm">
                            <span className="font-medium">Recommendation:</span>
                            <span className="ml-2 text-gray-700">{insight.recommendations[0].action.replace('_', ' ')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Integrations Manager
export const IntegrationsManager: React.FC = () => {
    const [integrations, setIntegrations] = useState<any[]>([]);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        const data = await getIntegrations();
        setIntegrations(data);
    };

    const availableIntegrations = [
        { name: 'Slack', icon: MessageSquare, type: 'messaging' },
        { name: 'Google Calendar', icon: Calendar, type: 'calendar' },
        { name: 'Zapier', icon: Zap, type: 'automation' },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Integrations</h2>

            <div className="grid grid-cols-3 gap-4">
                {availableIntegrations.map((int) => {
                    const Icon = int.icon;
                    const isConnected = integrations.some(i => i.name === int.name);

                    return (
                        <div key={int.name} className="border rounded-lg p-4 text-center">
                            <Icon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                            <p className="font-medium mb-2">{int.name}</p>
                            <button
                                className={`px-4 py-2 rounded text-sm ${isConnected
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {isConnected ? 'Connected' : 'Connect'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// AI Insights Dashboard
export const AIInsightsDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [recentInsights, setRecentInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, insightsData] = await Promise.all([
                getAIInsightsStats(),
                getAllAIInsights(10)
            ]);
            setStats(statsData);
            setRecentInsights(insightsData);
        } catch (error) {
            console.error('Error loading AI insights:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Brain className="h-6 w-6 text-purple-600" />
                    AI Insights
                </h2>
                <div className="text-center py-8 text-gray-500">Loading insights...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                AI Insights Dashboard
            </h2>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                    <BarChart3 className="h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats?.totalInsights || 0}</h3>
                    <p className="text-sm text-gray-600">Total Insights</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
                    <TrendingUp className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats?.averageScore || 0}</h3>
                    <p className="text-sm text-gray-600">Average Score</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <Users className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats?.highValueLeads || 0}</h3>
                    <p className="text-sm text-gray-600">High Value Leads (80+)</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
                    <Brain className="h-8 w-8 text-orange-600 mb-3" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats?.leadScoresCount || 0}</h3>
                    <p className="text-sm text-gray-600">Lead Scores Calculated</p>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border rounded-lg p-6">
                    <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold mb-1 text-lg">Lead Scoring</h3>
                    <p className="text-sm text-gray-600 mb-4">AI-powered lead prioritization based on engagement, budget, and activity patterns</p>
                    <div className="text-xs text-gray-500">
                        Scores range from 0-100, with higher scores indicating better conversion potential
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border rounded-lg p-6">
                    <Brain className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold mb-1 text-lg">Predictive Analytics</h3>
                    <p className="text-sm text-gray-600 mb-4">Forecast deal outcomes and identify opportunities using machine learning</p>
                    <div className="text-xs text-gray-500">
                        Continuous learning from historical data improves accuracy over time
                    </div>
                </div>
            </div>

            {/* Recent Insights */}
            {recentInsights.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Recent AI Insights</h3>
                    <div className="space-y-3">
                        {recentInsights.slice(0, 5).map((insight) => (
                            <div key={insight.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                        (insight.score || 0) >= 80 ? 'bg-green-500' :
                                        (insight.score || 0) >= 60 ? 'bg-blue-500' :
                                        (insight.score || 0) >= 40 ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}>
                                        {insight.score || 0}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {insight.insight_type?.replace('_', ' ').toUpperCase()} - {insight.entity_type}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {insight.entity_id?.substring(0, 8)}... • {insight.confidence || 0}% confidence
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {new Date(insight.calculated_at || insight.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {recentInsights.length === 0 && (
                <div className="bg-gray-50 border-2 border-dashed rounded-lg p-12 text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium mb-2">No AI Insights Yet</p>
                    <p className="text-sm text-gray-500">
                        AI insights will appear here once leads are scored and analyzed
                    </p>
                </div>
            )}
        </div>
    );
};

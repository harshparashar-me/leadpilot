import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { TrendingUp, DollarSign, Target, Award, Activity } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ForecastData {
    month: string;
    projected: number;
    actual: number;
}

interface LeaderboardEntry {
    name: string;
    calls: number;
    visits: number;
    conversions: number;
    score: number;
}

export const AnalyticsPage: React.FC = () => {
    const [forecast, setForecast] = useState<ForecastData[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        projectedRevenue: 0,
        avgConversion: 0,
        topPerformer: "-"
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Fetch forecast from deals
            const { data: deals } = await supabase
                .from("deals")
                .select("amount, stage, created_at");

            // Calculate projected revenue
            const projected = deals?.reduce((sum, d) => {
                if (d.stage === "Negotiation") return sum + (d.amount || 0);
                return sum;
            }, 0) || 0;

            const actual = deals?.reduce((sum, d) => {
                if (d.stage === "Closed Won") return sum + (d.amount || 0);
                return sum;
            }, 0) || 0;

            setForecast([
                { month: "Jan", projected: projected * 0.7, actual: actual * 0.6 },
                { month: "Feb", projected: projected * 0.8, actual: actual * 0.7 },
                { month: "Mar", projected: projected, actual: actual }
            ]);

            // Fetch leaderboard (mock data - would need activity tracking)
            setLeaderboard([
                { name: "Harsh Parihar", calls: 45, visits: 12, conversions: 8, score: 92 },
                { name: "Agent 2", calls: 38, visits: 10, conversions: 6, score: 78 },
                { name: "Agent 3", calls: 32, visits: 8, conversions: 5, score: 65 }
            ]);

            setStats({
                totalRevenue: actual,
                projectedRevenue: projected,
                avgConversion: deals && deals.length > 0 ? (actual / (deals.length || 1)) * 100 : 0,
                topPerformer: "Harsh Parihar"
            });
        } catch (err) {
            console.error("Analytics fetch error:", err);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-full space-y-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Analytics & Intelligence</h1>
                    <p className="text-sm text-gray-500">Forecasting, Reports & Leaderboards</p>
                </div>

                {/* KEY METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-xs text-gray-500 uppercase">Total Revenue</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            ₹{(stats.totalRevenue / 100000).toFixed(1)}L
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <span className="text-xs text-gray-500 uppercase">Projected (Month)</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            ₹{(stats.projectedRevenue / 100000).toFixed(1)}L
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-orange-600" />
                            <span className="text-xs text-gray-500 uppercase">Avg Conversion</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                            {stats.avgConversion.toFixed(1)}%
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5 text-purple-600" />
                            <span className="text-xs text-gray-500 uppercase">Top Performer</span>
                        </div>
                        <div className="text-xl font-bold text-purple-600 truncate">
                            {stats.topPerformer}
                        </div>
                    </div>
                </div>

                {/* FORECAST CHART */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Revenue Forecast (Q1 2025)
                    </h3>
                    <div className="flex items-end justify-around gap-4 h-48">
                        {forecast.map((m) => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex items-end justify-center gap-1 h-40">
                                    <div className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(m.projected / 1000000) * 100}%` }}></div>
                                    <div className="flex-1 bg-green-500 rounded-t" style={{ height: `${(m.actual / 1000000) * 100}%` }}></div>
                                </div>
                                <span className="text-xs font-medium">{m.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>Projected</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Actual</span>
                        </div>
                    </div>
                </div>

                {/* LEADERBOARD */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Agent Leaderboard
                    </h3>
                    <div className="space-y-2">
                        {leaderboard.map((agent, idx) => (
                            <div key={agent.name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">{agent.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {agent.calls} calls • {agent.visits} visits • {agent.conversions} conversions
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-blue-600">{agent.score}</div>
                                    <div className="text-xs text-gray-500">Score</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AnalyticsPage;

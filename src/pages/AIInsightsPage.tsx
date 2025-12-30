import Layout from '../components/Layout';
import { AIInsightsDashboard } from '../components/AIComponents';

export const AIInsightsPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600 mt-1">Artificial Intelligence powered insights and lead scoring</p>
        </div>
        <AIInsightsDashboard />
      </div>
    </Layout>
  );
};

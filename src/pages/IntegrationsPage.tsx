import Layout from '../components/Layout';
import { IntegrationsDashboard } from '../components/IntegrationComponents';

export const IntegrationsPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect your CRM with external services</p>
        </div>
        <IntegrationsDashboard />
      </div>
    </Layout>
  );
};

import Layout from '../components/Layout';
import { WhatsAppChat } from '../components/IntegrationComponents';

export const WhatsAppPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-600 mt-1">Communicate with customers via WhatsApp Business</p>
        </div>
        <WhatsAppChat />
      </div>
    </Layout>
  );
};

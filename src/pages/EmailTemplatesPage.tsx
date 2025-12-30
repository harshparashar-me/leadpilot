import Layout from '../components/Layout';
import { EmailTemplates } from '../components/EmailTemplates';

export const EmailTemplatesPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage email templates for your campaigns</p>
        </div>
        <EmailTemplates />
      </div>
    </Layout>
  );
};

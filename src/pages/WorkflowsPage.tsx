import Layout from '../components/Layout';
import { WorkflowList } from '../components/WorkflowList';

export const WorkflowsPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">Automate your CRM processes with intelligent workflows</p>
        </div>
        <WorkflowList />
      </div>
    </Layout>
  );
};

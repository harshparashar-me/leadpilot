import Layout from '../components/Layout';
import { TaskTemplateManager } from '../components/TaskTemplateManager';

export const TaskTemplatesPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Task Templates</h1>
          <p className="text-gray-600 mt-1">Create reusable task templates for common workflows</p>
        </div>
        <TaskTemplateManager />
      </div>
    </Layout>
  );
};

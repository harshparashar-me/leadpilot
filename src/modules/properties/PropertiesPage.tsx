import React from "react";
import Layout from "../../components/Layout";
import DataTable from "../../components/table/DataTable";
import { Plus, Home } from "lucide-react";

export const PropertiesPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col h-full space-y-3">

        <div className="bg-white border rounded-lg shadow-sm p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500">CRM / Properties</div>
            <div className="flex items-center gap-1">
              <Home className="w-4 h-4 text-blue-600" />
              <h1 className="text-sm font-semibold">Properties</h1>
            </div>
          </div>

          <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs btn-animate">
            <Plus className="w-3 h-3" /> Add Property
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-sm overflow-hidden">
          <DataTable resource="properties" />
        </div>

      </div>
    </Layout>
  );
};

export default PropertiesPage;

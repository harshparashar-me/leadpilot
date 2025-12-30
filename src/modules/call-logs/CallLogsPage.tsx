import React from "react";
import Layout from "../../components/Layout";
import DataTable from "../../components/table/DataTable";
import { PhoneCall } from "lucide-react";

export const CallLogsPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col h-full space-y-3">

        <div className="bg-white border rounded-lg shadow-sm p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500">CRM / Call Logs</div>
            <div className="flex items-center gap-1">
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <h1 className="text-sm font-semibold">Call Logs</h1>
            </div>
            <p className="text-[11px] text-gray-500">All call activity and follow-ups.</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-sm overflow-hidden">
          <DataTable resource="call_logs" />
        </div>

      </div>
    </Layout>
  );
};

export default CallLogsPage;

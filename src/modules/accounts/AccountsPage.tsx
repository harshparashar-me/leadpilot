import React, { useState } from "react";
import Layout from "../../components/Layout";
import DataTable from "../../components/table/DataTable";
import { Plus, Building } from "lucide-react";
import AddAccountModal from "./AddAccountModal";
import AccountsDrawer from "./AccountsDrawer";

export const AccountsPage: React.FC = () => {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openDrawer, setOpenDrawer] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [drawerAccount, setDrawerAccount] = useState<any | null>(null);

  return (
    <Layout>
      <div className="flex flex-col h-full space-y-3">

        <div className="bg-white border rounded-lg shadow-sm p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500">CRM / Accounts</div>
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4 text-blue-600" />
              <h1 className="text-sm font-semibold">Accounts</h1>
            </div>
          </div>

          <button
            onClick={() => setOpenAddModal(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs btn-animate"
          >
            <Plus className="w-3 h-3" /> New Account
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-sm overflow-hidden">
          <DataTable
            resource="accounts"
            refreshTrigger={refreshTrigger}
            onRowClick={(row) => {
              setDrawerAccount(row);
              setOpenDrawer(true);
            }}
          />
        </div>

        <AddAccountModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSave={() => setRefreshTrigger(prev => prev + 1)}
        />

        <AccountsDrawer
          isOpen={openDrawer}
          account={drawerAccount}
          onClose={() => setOpenDrawer(false)}
          onUpdate={() => setRefreshTrigger(prev => prev + 1)}
        />

      </div>
    </Layout>
  );
};

export default AccountsPage;

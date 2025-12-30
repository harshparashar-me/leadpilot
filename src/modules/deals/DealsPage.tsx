import React, { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import DataTable from "../../components/table/DataTable";
import { Plus, BadgeDollarSign } from "lucide-react";
import AddDealModal from "./AddDealModal";
import DealsDrawer from "./DealsDrawer";
import { useSearchParams } from "react-router-dom";

export const DealsPage: React.FC = () => {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openDrawer, setOpenDrawer] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [drawerDeal, setDrawerDeal] = useState<any | null>(null);
  const [searchParams] = useSearchParams();

  const initialFilters = useMemo(() => {
    const status = searchParams.get("status") || "";
    return status ? { status } : undefined;
  }, [searchParams]);

  return (
    <Layout>
      <div className="flex flex-col h-full space-y-3">

        <div className="bg-white border rounded-lg shadow-sm p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500">CRM / Deals</div>
            <div className="flex items-center gap-1">
              <BadgeDollarSign className="w-4 h-4 text-blue-600" />
              <h1 className="text-sm font-semibold">Deals</h1>
            </div>
          </div>

          <button
            onClick={() => setOpenAddModal(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs btn-animate"
          >
            <Plus className="w-3 h-3" /> New Deal
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-sm overflow-hidden">
          <DataTable
            resource="deals"
            refreshTrigger={refreshTrigger}
            initialFilters={initialFilters}
            onRowClick={(row) => {
              setDrawerDeal(row);
              setOpenDrawer(true);
            }}
          />
        </div>

        <AddDealModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSave={() => setRefreshTrigger(p => p + 1)}
        />

        <DealsDrawer
          isOpen={openDrawer}
          deal={drawerDeal}
          onClose={() => setOpenDrawer(false)}
          onUpdate={() => setRefreshTrigger(p => p + 1)}
        />
      </div>
    </Layout>
  );
};

export default DealsPage;

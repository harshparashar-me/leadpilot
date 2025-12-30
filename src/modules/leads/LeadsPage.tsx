import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import DataTable from "../../components/table/DataTable";
import LeadsDrawer from "./LeadsDrawer";
import AddLeadModal from "./AddLeadModal";
import { Plus, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Lead } from "../../components/table/registry";

export const LeadsPage: React.FC = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [realStats, setRealStats] = useState([
    { label: "Total Leads", value: "0", color: "text-blue-600" },
    { label: "New", value: "0", color: "text-green-600" },
    { label: "Contacted", value: "0", color: "text-orange-600" },
    { label: "Qualified", value: "0", color: "text-red-500" },
    { label: "Proposals", value: "0", color: "text-emerald-600" },
    { label: "Won", value: "0", color: "text-blue-700" },
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const statuses = ["Attempted", "Contacted", "Interested", "Follow Up", "Budget Issue", "Junk", "Not Interested"];

      const [totalRes, ...statusResults] = await Promise.all([
        supabase.from("leads").select("*", { count: 'exact', head: true }),
        ...statuses.map(s => supabase.from("leads").select("*", { count: 'exact', head: true }).eq("status", s))
      ]);

      const totalCount = totalRes.count || 0;
      const counts = statuses.map((s, i) => ({
        status: s,
        count: statusResults[i].count || 0
      }));

      setRealStats([
        { label: "Total Leads", value: totalCount.toLocaleString(), color: "text-blue-600" },
        ...counts.map(c => ({
          label: c.status,
          value: c.count.toLocaleString(),
          color: c.status === "Interested" ? "text-emerald-600" : (c.status === "Junk" ? "text-red-600" : "text-gray-700")
        }))
      ]);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  return (
    <Layout>
      <div className="flex flex-col h-full space-y-3">
        {/* COMPACT HEADER WITH INLINE STATS */}
        <div className="bg-white border rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <h1 className="text-sm font-semibold">Leads</h1>
                <p className="text-[10px] text-gray-500">Manage your potential clients</p>
              </div>
            </div>

            <button
              onClick={() => setOpenAddModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs btn-animate"
            >
              <Plus className="w-3 h-3" /> Add Lead
            </button>
          </div>

          {/* INLINE STATS */}
          <div className="flex items-center gap-3 pt-2 border-t overflow-x-auto">
            {realStats.map((s, idx) => (
              <div key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[10px] text-gray-500">{s.label}:</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                {idx < realStats.length - 1 && <span className="text-gray-300">|</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-sm overflow-hidden">
          <DataTable
            resource="leads"
            refreshTrigger={refreshTrigger}
            onRowClick={(row) => {
              setDrawerLead(row as unknown as Lead);
              setOpenDrawer(true);
            }}
          />
        </div>

        <AddLeadModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSave={() => {
            setRefreshTrigger(prev => prev + 1);
            setOpenAddModal(false);
          }}
        />

        <LeadsDrawer
          isOpen={openDrawer}
          lead={drawerLead}
          onClose={() => setOpenDrawer(false)}
          onUpdate={() => {
            setRefreshTrigger((k) => k + 1);
          }}
        />
      </div>
    </Layout>
  );
};

export default LeadsPage;

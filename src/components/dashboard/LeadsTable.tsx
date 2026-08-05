"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/lib/actions/dashboard";
import type { Lead, LeadStatus } from "@/lib/supabase/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LeadsTable({
  leads,
  isAdmin,
}: {
  leads: Lead[];
  isAdmin: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleUpdateStatus = (id: string, status: LeadStatus) => {
    setActiveMenuId(null);
    startTransition(async () => {
      const result = await updateLeadStatus(id, status);
      if ("error" in result) setError(result.error);
    });
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.message ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col min-h-full relative">
      {/* Page Header */}
      <header className="bg-surface-container-lowest border-b border-border-gray px-lg py-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md sticky top-0 z-40 shadow-sm shrink-0">
        <div>
          <h1 className="font-h1 text-h1 text-text-primary font-bold">Leads</h1>
          <p className="font-body text-body text-text-secondary mt-1">
            Manage and track incoming property inquiries.
          </p>
        </div>
        <div className="flex space-x-md w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-text-secondary">
              search
            </span>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-[36px] pr-md py-sm border border-border-gray rounded-lg font-sm text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container w-full sm:w-64 bg-white text-text-primary placeholder:text-text-secondary/70"
            />
          </div>
        </div>
      </header>

      {/* Data Table */}
      <div className="p-lg flex-grow">
        {error && (
          <div className="mb-lg bg-error/10 border border-error text-error rounded-lg p-md font-sm text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-border-gray shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface-gray border-b border-border-gray">
                <tr>
                  <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Name &amp; Contact
                  </th>
                  <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Message Preview
                  </th>
                  <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Date Received
                  </th>
                  <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray font-sm text-sm">
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-text-secondary">
                      No leads yet.
                    </td>
                  </tr>
                )}
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-surface-gray/50 transition-colors group relative"
                  >
                    <td className="py-3 px-md">
                      <div className="font-semibold text-text-primary text-sm">
                        {lead.name}
                      </div>
                      <div className="text-slate-600 mt-1 text-xs flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#10B981]">
                          phone
                        </span>
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="text-slate-600 mt-1 text-xs flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">
                            mail
                          </span>
                          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                            {lead.email}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-md max-w-[340px]">
                      <p
                        className="text-slate-700 text-xs line-clamp-3 leading-relaxed"
                        title={lead.message ?? ""}
                      >
                        {lead.message || "—"}
                      </p>
                      {lead.source && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {lead.source}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-md text-text-secondary text-xs font-medium">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="py-3 px-md">
                      {lead.status === "new" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-xs text-xs font-medium bg-primary-fixed text-on-primary-fixed-variant">
                          New
                        </span>
                      )}
                      {lead.status === "contacted" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-xs text-xs font-medium bg-surface-variant text-on-surface-variant">
                          Contacted
                        </span>
                      )}
                      {lead.status === "closed" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-xs text-xs font-medium bg-surface-dim text-text-secondary">
                          Closed
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-md text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === lead.id ? null : lead.id)
                          }
                          className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-border-gray/50"
                        >
                          <span className="material-symbols-outlined text-[20px] block">
                            more_vert
                          </span>
                        </button>

                        {activeMenuId === lead.id && (
                          <>
                            <div
                              onClick={() => setActiveMenuId(null)}
                              className="fixed inset-0 z-40"
                            />
                            <div className="absolute right-md mt-2 w-40 rounded-md shadow-lg bg-surface-container-lowest border border-border-gray ring-1 ring-black ring-opacity-5 focus:outline-none z-50 text-left">
                              <div className="py-1">
                                <button
                                  onClick={() => handleUpdateStatus(lead.id, "new")}
                                  className="block w-full text-left px-md py-sm font-sm text-sm text-text-primary hover:bg-surface-gray"
                                >
                                  Mark as New
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(lead.id, "contacted")}
                                  className="block w-full text-left px-md py-sm font-sm text-sm text-text-primary hover:bg-surface-gray"
                                >
                                  Mark as Contacted
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(lead.id, "closed")}
                                  className="block w-full text-left px-md py-sm font-sm text-sm text-text-primary hover:bg-surface-gray"
                                >
                                  Mark as Closed
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-md py-3 border-t border-border-gray bg-white flex items-center justify-between">
            <span className="font-sm text-sm text-text-secondary">
              Showing {filteredLeads.length} of {leads.length} entries
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

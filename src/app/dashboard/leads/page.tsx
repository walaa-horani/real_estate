"use client";

import { useState } from "react";

export default function DashboardLeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [leads, setLeads] = useState([
    {
      id: 1,
      name: "John Doe",
      phone: "+1 (555) 019-2834",
      property: "Modern Penthouse",
      message: "I'd like to schedule a viewing for this weekend if possible.",
      date: "Oct 24, 2023",
      status: "New",
    },
    {
      id: 2,
      name: "Sarah Jenkins",
      phone: "+1 (555) 928-1123",
      property: "Riverside Villa",
      message: "Is the price negotiable? We have cash ready.",
      date: "Oct 23, 2023",
      status: "Contacted",
    },
    {
      id: 3,
      name: "Michael Chang",
      phone: "+1 (555) 773-4091",
      property: "Downtown Loft",
      message: "Need more details about the HOA fees.",
      date: "Oct 23, 2023",
      status: "New",
    },
    {
      id: 4,
      name: "Elena Rodriguez",
      phone: "+1 (555) 231-8845",
      property: "Suburban Family Home",
      message: "Thanks, we decided on another property.",
      date: "Oct 20, 2023",
      status: "Closed",
    },
    {
      id: 5,
      name: "David Kim",
      phone: "+1 (555) 662-1093",
      property: "Modern Penthouse",
      message: "Can we arrange a virtual tour?",
      date: "Oct 19, 2023",
      status: "Contacted",
    },
  ]);

  const handleUpdateStatus = (id: number, status: string) => {
    setLeads(
      leads.map((l) => (l.id === id ? { ...l, status } : l))
    );
    setActiveMenuId(null);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.message.toLowerCase().includes(searchQuery.toLowerCase())
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
          <button className="flex items-center space-x-2 px-md py-sm bg-white border border-border-gray rounded-lg font-sm text-sm font-medium hover:bg-surface-gray transition-colors text-text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filter</span>
          </button>
        </div>
      </header>

      {/* Data Table */}
      <div className="p-lg flex-grow">
        <div className="bg-white rounded-lg border border-border-gray shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface-gray border-b border-border-gray">
                <tr>
                  <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Name &amp; Contact
                  </th>
                  <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Property of Interest
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
                  <th className="py-3 px-md font-xs text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray font-sm text-sm">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-surface-gray/50 transition-colors group relative"
                  >
                    <td className="py-3 px-md">
                      <div className="font-medium text-text-primary">
                        {lead.name}
                      </div>
                      <div className="text-text-secondary mt-0.5 text-[13px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          phone
                        </span>
                        {lead.phone}
                      </div>
                    </td>
                    <td className="py-3 px-md text-text-primary">
                      {lead.property}
                    </td>
                    <td
                      className="py-3 px-md text-text-secondary max-w-[200px] truncate"
                      title={lead.message}
                    >
                      {lead.message}
                    </td>
                    <td className="py-3 px-md text-text-secondary">
                      {lead.date}
                    </td>
                    <td className="py-3 px-md">
                      {lead.status === "New" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-xs text-xs font-medium bg-primary-fixed text-on-primary-fixed-variant">
                          New
                        </span>
                      )}
                      {lead.status === "Contacted" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-xs text-xs font-medium bg-surface-variant text-on-surface-variant">
                          Contacted
                        </span>
                      )}
                      {lead.status === "Closed" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-xs text-xs font-medium bg-surface-dim text-text-secondary">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-md text-right relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === lead.id ? null : lead.id
                          )
                        }
                        className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-border-gray/50"
                      >
                        <span className="material-symbols-outlined text-[20px] block">
                          more_vert
                        </span>
                      </button>

                      {/* Dropdown Menu for Status updates */}
                      {activeMenuId === lead.id && (
                        <>
                          <div
                            onClick={() => setActiveMenuId(null)}
                            className="fixed inset-0 z-40"
                          />
                          <div className="absolute right-md mt-2 w-40 rounded-md shadow-lg bg-surface-container-lowest border border-border-gray ring-1 ring-black ring-opacity-5 focus:outline-none z-50 text-left">
                            <div className="py-1">
                              <button
                                onClick={() => handleUpdateStatus(lead.id, "New")}
                                className="block w-full text-left px-md py-sm font-sm text-sm text-text-primary hover:bg-surface-gray"
                              >
                                Mark as New
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(lead.id, "Contacted")
                                }
                                className="block w-full text-left px-md py-sm font-sm text-sm text-text-primary hover:bg-surface-gray"
                              >
                                Mark as Contacted
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(lead.id, "Closed")
                                }
                                className="block w-full text-left px-md py-sm font-sm text-sm text-text-primary hover:bg-surface-gray"
                              >
                                Mark as Closed
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-md py-3 border-t border-border-gray bg-white flex items-center justify-between">
            <span className="font-sm text-sm text-text-secondary">
              Showing 1 to {filteredLeads.length} of {filteredLeads.length} entries
            </span>
            <div className="flex space-x-1">
              <button
                className="px-2 py-1 border border-border-gray rounded bg-surface-gray text-text-secondary disabled:opacity-50"
                disabled
              >
                <span className="material-symbols-outlined text-[18px] block">
                  chevron_left
                </span>
              </button>
              <button className="px-3 py-1 border border-secondary-container bg-secondary-container text-on-secondary-container rounded font-sm text-sm font-medium">
                1
              </button>
              <button className="px-3 py-1 border border-border-gray hover:bg-surface-gray rounded font-sm text-sm text-text-primary transition-colors">
                2
              </button>
              <button className="px-3 py-1 border border-border-gray hover:bg-surface-gray rounded font-sm text-sm text-text-primary transition-colors">
                3
              </button>
              <button className="px-2 py-1 border border-border-gray rounded hover:bg-surface-gray text-text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] block">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

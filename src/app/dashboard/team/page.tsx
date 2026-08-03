"use client";

import { useState } from "react";

export default function DashboardTeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [team, setTeam] = useState([
    {
      id: 1,
      name: "Sarah Jenkins",
      email: "sarah.j@skyline.com",
      role: "Admin",
      lastActive: "Just now",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcHbJZ9FrkEnRVMRRxuh7sj9zWrJ3dtL9iIGdFtlWnznHvhX5OtcsqqUPXLfMxaLiCV1oXk9s7kzpmuIWEcMsEtuYEiZxXgn6qaIbW6zvXt4pyPac47zO2pSQGdDej0vlB-DJmSYbOXefq8tenZAs3r3n5FcpMQtjgrvM_F-rukXqVyPCMRoxWu5cwXxQlFcscnWORHO0KyHXsqAlRYVPruQA5u8VT-FzA-qoAvsCrm9_ON4VCQ3Xu",
      initials: "SJ",
    },
    {
      id: 2,
      name: "David Chen",
      email: "david.c@skyline.com",
      role: "Agent",
      lastActive: "2 hours ago",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOqSDNq3pGG9jB9efKRnO9DVD7mvyC2PSAX2IBx4i1CelktwmJPl3kdCMH4ATCGRK-wZ70yX3dz7izVCKdaTBegoUETzJcaMzCXrWTo7v_9tDf8QmH1v7UxltaymimvO1ahyyk9cBFdyxJZChU76oA2Qh27E8AJNc_l8fSJPnQ1k0SMHmhGfwL-eJxs-WmnxLNt__BSo7kCMFMPIjQQBIbH2cxJ6rvOVX4MIWOa-Ny1cJaZxSVFwsH",
      initials: "DC",
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      email: "maria.r@skyline.com",
      role: "Agent",
      lastActive: "1 day ago",
      imageUrl: "",
      initials: "MR",
    },
    {
      id: 4,
      name: "James Wilson",
      email: "james.w@skyline.com",
      role: "Admin",
      lastActive: "3 days ago",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvYfyk7iCFajTRUum5Dbe0suQcMa0GXMZiKT4-Z4gNSnn0CZEw6B5fyAbXP7hei8RU1oyHN_s6_mdhYbftKgXH2Wd7LRnKfff4BuRtE4ydzeRl1AuQ9OD2agxcRTpCGb4eca71fZD3_BNLJBReX7QMjpBNJYJMWhyAB0j3z21Vr19n8l8rzHollMDsvOSgExJxzzfmKHQK4UqqWwisBcumaQY5ppvd94_H34p_8Td_MsqLDlKe5tco",
      initials: "JW",
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "Agent",
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const initials = newMember.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setTeam([
      ...team,
      {
        id: Date.now(),
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        lastActive: "Never",
        imageUrl: "",
        initials,
      },
    ]);
    setNewMember({ name: "", email: "", role: "Agent" });
    setModalOpen(false);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from your team?`)) {
      setTeam(team.filter((t) => t.id !== id));
    }
  };

  const filteredTeam = team.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col min-h-full">
      {/* Page Header */}
      <header className="bg-surface-container-lowest border-b border-border-gray px-lg py-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md sticky top-0 z-40 shadow-sm shrink-0">
        <div>
          <h1 className="font-h2 text-h2 font-bold text-text-primary">
            Team Directory
          </h1>
          <p className="font-sm text-sm text-text-secondary mt-1">
            Manage agency staff and their access levels.
          </p>
        </div>
        <div className="flex items-center gap-md w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-[36px] pr-sm py-sm border border-border-gray rounded-lg font-sm text-sm bg-surface-container-lowest focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all w-full sm:w-64"
            />
          </div>
          {/* Invite Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#EA580C] text-white px-md py-sm rounded-lg font-sm text-sm font-bold shadow-sm hover:bg-[#C2410C] transition-colors flex items-center gap-sm shrink-0"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Invite Member
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="p-lg flex-grow">
        {/* Data Table */}
        <div className="bg-surface-container-lowest rounded-lg border border-border-gray shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-surface-gray/50 border-b border-border-gray font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-lg py-md">Member</th>
                  <th className="px-lg py-md">Role</th>
                  <th className="px-lg py-md">Email</th>
                  <th className="px-lg py-md hidden sm:table-cell">Last Active</th>
                  <th className="px-lg py-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray font-sm text-sm text-text-primary">
                {filteredTeam.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-gray/30 transition-colors group"
                  >
                    <td className="px-lg py-sm">
                      <div className="flex items-center gap-md">
                        {member.imageUrl ? (
                          <img
                            src={member.imageUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-border-gray shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-text-secondary border border-border-gray shrink-0">
                            {member.initials}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="font-xs text-xs text-text-secondary sm:hidden">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-sm">
                      {member.role === "Admin" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full font-xs text-xs font-medium bg-primary-container text-on-primary-container">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full font-xs text-xs font-medium bg-secondary-container/20 text-secondary">
                          Agent
                        </span>
                      )}
                    </td>
                    <td className="px-lg py-sm text-text-secondary">
                      {member.email}
                    </td>
                    <td className="px-lg py-sm text-text-secondary hidden sm:table-cell">
                      {member.lastActive}
                    </td>
                    <td className="px-lg py-sm text-right">
                      <div className="flex justify-end space-x-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => alert(`Settings for ${member.name}`)}
                          className="p-sm text-text-secondary hover:text-primary-navy bg-surface-container-lowest border border-border-gray rounded shadow-sm hover:shadow transition-all"
                          title="Configure"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            settings
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="p-sm text-text-secondary hover:text-error bg-surface-container-lowest border border-border-gray rounded shadow-sm hover:shadow transition-all"
                          title="Remove Member"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Member Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md">
          <div className="bg-surface-container-lowest rounded-xl border border-border-gray shadow-md w-full max-w-[448px] overflow-hidden">
            <header className="bg-surface-gray px-lg py-md border-b border-border-gray flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-primary-navy font-bold">
                Invite Member
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-secondary hover:text-primary-navy"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleInvite} className="p-lg space-y-md">
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Rodriguez"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm"
                />
              </div>
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maria@skyline.com"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm"
                />
              </div>
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Role
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember({ ...newMember, role: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm bg-white"
                >
                  <option value="Agent">Agent</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <footer className="pt-md flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-primary hover:bg-surface-gray"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#EA580C] text-white font-bold py-sm px-md rounded-lg hover:bg-[#C2410C] transition-colors"
                >
                  Invite Member
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

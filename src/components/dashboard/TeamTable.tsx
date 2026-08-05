"use client";

import { useState, useTransition } from "react";
import { removeMember } from "@/lib/actions/dashboard";
import { inviteMember, resendInvite } from "@/lib/actions/invite";
import type { MemberWithProfile } from "@/lib/supabase/dashboardQueries";

function initialsFor(name: string | null, email: string | null) {
  const source = name || email || "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export default function TeamTable({
  organizationId,
  members,
  currentUserId,
  isAdmin,
}: {
  organizationId: string;
  members: MemberWithProfile[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  // No invite email is ever sent — the admin delivers this link themselves.
  const [inviteLink, setInviteLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeInviteModal = () => {
    setModalOpen(false);
    setInviteLink(null);
    setCopied(false);
    setInviteEmail("");
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setError(null);
    startTransition(async () => {
      const result = await inviteMember(organizationId, inviteEmail);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      if (result) {
        setInviteLink({ email: inviteEmail, url: result.inviteUrl });
      }
    });
  };

  const handleDelete = (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from your team?`)) return;
    startTransition(async () => {
      const result = await removeMember(memberId);
      if ("error" in result) setError(result.error);
    });
  };

  const handleResend = (memberId: string, email: string) => {
    setError(null);
    startTransition(async () => {
      const result = await resendInvite(memberId);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      if (result) {
        // Reuse the invite dialog purely as the place the new link is shown.
        setInviteLink({ email, url: result.inviteUrl });
        setCopied(false);
        setModalOpen(true);
      }
    });
  };

  const filteredTeam = members.filter((m) => {
    const name = m.profile?.full_name ?? "";
    const email = m.profile?.email ?? m.invited_email ?? "";
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

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
          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#EA580C] text-white px-md py-sm rounded-lg font-sm text-sm font-bold shadow-sm hover:bg-[#C2410C] transition-colors flex items-center gap-sm shrink-0"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Invite Member
            </button>
          )}
        </div>
      </header>

      {/* Content Area */}
      <div className="p-lg flex-grow">
        {error && (
          <div className="mb-lg bg-error/10 border border-error text-error rounded-lg p-md font-sm text-sm">
            {error}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-lg border border-border-gray shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-surface-gray/50 border-b border-border-gray font-xs text-xs font-bold text-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-lg py-md">Member</th>
                  <th className="px-lg py-md">Role</th>
                  <th className="px-lg py-md">Email</th>
                  <th className="px-lg py-md hidden sm:table-cell">Status</th>
                  {isAdmin && <th className="px-lg py-md text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray font-sm text-sm text-text-primary">
                {filteredTeam.map((member) => {
                  const name = member.profile?.full_name || member.invited_email || "Invited user";
                  const email = member.profile?.email || member.invited_email || "—";
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-surface-gray/30 transition-colors group"
                    >
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-md">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-text-secondary border border-border-gray shrink-0">
                            {initialsFor(member.profile?.full_name ?? null, email)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {name}
                              {member.user_id === currentUserId && (
                                <span className="text-text-secondary font-xs text-xs"> (you)</span>
                              )}
                            </div>
                            <div className="font-xs text-xs text-text-secondary sm:hidden">
                              {email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-sm">
                        {member.role === "admin" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full font-xs text-xs font-medium bg-primary-container text-on-primary-container">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full font-xs text-xs font-medium bg-secondary-container/20 text-secondary">
                            Member
                          </span>
                        )}
                      </td>
                      <td className="px-lg py-sm text-text-secondary">{email}</td>
                      <td className="px-lg py-sm text-text-secondary hidden sm:table-cell capitalize">
                        {member.status}
                      </td>
                      {isAdmin && (
                        <td className="px-lg py-sm text-right">
                          <div className="flex justify-end space-x-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {member.status === "invited" && (
                              <button
                                onClick={() => handleResend(member.id, email)}
                                disabled={pending}
                                className="p-sm text-text-secondary hover:text-secondary bg-surface-container-lowest border border-border-gray rounded shadow-sm hover:shadow transition-all disabled:opacity-30"
                                title="Generate a fresh invite link"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  link
                                </span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(member.id, name)}
                              disabled={pending || member.user_id === currentUserId}
                              className="p-sm text-text-secondary hover:text-error bg-surface-container-lowest border border-border-gray rounded shadow-sm hover:shadow transition-all disabled:opacity-30"
                              title={
                                member.user_id === currentUserId
                                  ? "You can't remove yourself"
                                  : "Remove Member"
                              }
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
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
                {inviteLink ? "Invite Link Ready" : "Invite Member"}
              </h3>
              <button
                onClick={closeInviteModal}
                className="text-text-secondary hover:text-primary-navy"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {inviteLink ? (
              <div className="p-lg space-y-md">
                <p className="font-sm text-sm text-text-secondary">
                  <strong className="text-text-primary">{inviteLink.email}</strong> has
                  been added as a read-only <strong>Member</strong>. Send them this link
                  — it&apos;s single-use and lets them set a password. Nothing was
                  emailed.
                </p>
                <div className="flex items-stretch gap-sm">
                  <input
                    readOnly
                    value={inviteLink.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-grow min-w-0 rounded border border-border-gray bg-surface-gray px-md py-sm font-xs text-xs text-text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="shrink-0 flex items-center gap-base px-md py-sm rounded border border-border-gray bg-surface-container-lowest font-sm text-sm font-semibold text-text-primary hover:bg-surface-gray transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <footer className="pt-md flex justify-end">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="bg-[#EA580C] text-white font-bold py-sm px-md rounded-lg hover:bg-[#C2410C] transition-colors"
                  >
                    Done
                  </button>
                </footer>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="p-lg space-y-md">
                <p className="font-sm text-sm text-text-secondary">
                  They&apos;ll join as a read-only <strong>Member</strong>. You&apos;ll get
                  an invite link to send them yourself — no email is sent.
                </p>
                <div>
                  <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. maria@skyline.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm"
                  />
                </div>
                <footer className="pt-md flex justify-end gap-md">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="px-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-primary hover:bg-surface-gray"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="bg-[#EA580C] text-white font-bold py-sm px-md rounded-lg hover:bg-[#C2410C] transition-colors disabled:opacity-60"
                  >
                    {pending ? "Creating…" : "Create Invite Link"}
                  </button>
                </footer>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

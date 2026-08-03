"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { name: "Overview", href: "#", icon: "dashboard" },
    { name: "Properties", href: "/dashboard/properties", icon: "real_estate_agent" },
    { name: "Leads", href: "/dashboard/leads", icon: "group_add" },
    { name: "Team", href: "/dashboard/team", icon: "group" },
    { name: "Settings", href: "#", icon: "settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-surface-gray font-body antialiased">
      {/* Sidebar - Desktop (Fixed 280px) & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col py-lg w-sidebar-width space-y-sm bg-primary-container text-on-primary-container transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header/Brand info */}
        <div className="px-lg pb-md mb-md border-b border-on-primary-container/10 flex justify-between items-center">
          <div className="flex items-center gap-sm overflow-hidden">
            <img
              alt="Agency Logo"
              className="w-10 h-10 rounded-lg object-cover border border-border-gray shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOjajDAKaeqRGiJJeDQgL144cEkGQaUQ9hXj2v33sWJvsRR9ZAm7VqY8ddDVDHcrVmxLdc37YRtTxt16CG0eASFnTzFsR8CPYf7ugs5ybY5YiYWD3REgpqHxzjxshPfxDUjA3U8DMXxwNrKaMqeJZUii-OGUhSHiCJErE1e9PNk5hG-x1xpNGaKFTCrWvL0YMQczRL8bCncZJ0gKgHsI3uNStZLAjPo9vZHjxAsxl6VDYLCkIL143J"
            />
            <div className="overflow-hidden">
              <h2 className="font-h3 text-h3 font-bold text-on-primary-container truncate">
                Skyline Properties
              </h2>
              <p className="font-xs text-xs text-on-primary-container/70">
                Enterprise Plan
              </p>
            </div>
          </div>
          {/* Close button for Mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-on-primary-container/80 hover:text-on-primary-container"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Main Nav Links */}
        <nav className="flex-1 px-sm space-y-base overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-md px-md py-sm transition-all rounded-lg mx-md group scale-95 active:scale-100 ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-primary-container/70 hover:text-on-primary-container hover:bg-on-primary-fixed-variant/10"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-lg ${
                    isActive ? "text-on-secondary-container" : "group-hover:text-on-primary-container"
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {link.icon}
                </span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CTA & Footer */}
        <div className="px-lg pt-md border-t border-on-primary-container/10 mt-auto">
          <button
            onClick={() => alert("Add listing modal triggered.")}
            className="w-full mb-md py-sm bg-[#f97316] text-white font-sm text-sm font-bold rounded-lg hover:bg-[#ea580c] transition-colors shadow-sm"
          >
            Add Listing
          </button>
          <div className="space-y-base">
            <a
              href="#"
              className="flex items-center gap-md px-md py-sm text-on-primary-container/70 hover:text-on-primary-container hover:bg-on-primary-fixed-variant/10 transition-all scale-95 active:scale-100 rounded-lg group"
            >
              <span className="material-symbols-outlined text-lg group-hover:text-on-primary-container">
                help
              </span>
              <span>Help Center</span>
            </a>
            <Link
              href="/"
              className="flex items-center gap-md px-md py-sm text-on-primary-container/70 hover:text-on-primary-container hover:bg-on-primary-fixed-variant/10 transition-all scale-95 active:scale-100 rounded-lg group"
            >
              <span className="material-symbols-outlined text-lg group-hover:text-on-primary-container">
                logout
              </span>
              <span>Log Out</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-sidebar-width w-full relative z-10 overflow-hidden">
        {/* Mobile top-bar for dashboard */}
        <header className="flex md:hidden items-center justify-between bg-surface-container-lowest px-lg h-16 border-b border-border-gray shadow-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-primary-navy p-1 rounded-md hover:bg-surface-gray"
          >
            <span className="material-symbols-outlined block">menu</span>
          </button>
          <div className="font-h3 text-h3 font-bold text-primary-navy">
            Dashboard
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
        </header>

        {/* Child Routes */}
        <main className="flex-1 overflow-y-auto bg-surface-gray">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/45 z-40 md:hidden"
        />
      )}
    </div>
  );
}

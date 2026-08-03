"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-gray">
      {/* Dynamic Header based on route */}
      <header
        className={`w-full top-0 z-50 transition-all duration-200 ease-in-out ${
          isHome
            ? "bg-primary-container text-on-primary-container shadow-sm"
            : "bg-surface-container-lowest border-b border-border-gray shadow-sm text-text-primary"
        }`}
      >
        <div className="max-w-max-width-public mx-auto px-lg flex justify-between items-center h-16">
          <div className="flex items-center gap-xl">
            <Link
              href="/"
              className={`font-h2 text-h2 font-bold ${
                isHome ? "text-on-primary-container" : "text-primary-navy"
              }`}
            >
              EstateSync Pro
            </Link>
            <nav className="hidden md:flex gap-lg items-center">
              <Link
                href="/"
                className={`font-body text-body pb-1 transition-all ${
                  isHome
                    ? pathname === "/"
                      ? "text-on-primary-container font-bold border-b-2 border-on-primary-container"
                      : "text-on-primary-container/80 hover:text-on-primary-container"
                    : pathname === "/"
                    ? "text-primary-navy font-bold border-b-2 border-primary-navy"
                    : "text-text-secondary hover:text-primary-navy"
                }`}
              >
                Browse
              </Link>
              <Link
                href="/signup/plan"
                className={`font-body text-body transition-all ${
                  isHome
                    ? "text-on-primary-container/80 hover:text-on-primary-container"
                    : "text-text-secondary hover:text-primary-navy"
                }`}
              >
                Pricing
              </Link>
              <a
                href="#"
                className={`font-body text-body transition-all ${
                  isHome
                    ? "text-on-primary-container/80 hover:text-on-primary-container"
                    : "text-text-secondary hover:text-primary-navy"
                }`}
              >
                Resources
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-md">
            {/* Search Input for non-home pages */}
            {!isHome && (
              <div className="relative hidden lg:block">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-text-secondary font-xs">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="pl-xl pr-md py-sm rounded-lg border border-border-gray bg-surface-container-lowest focus:ring-2 focus:ring-secondary focus:border-secondary outline-none font-sm text-sm transition-colors duration-200 ease-in-out hover:bg-surface-gray w-64 text-on-surface"
                />
              </div>
            )}

            <Link
              href="/signup"
              className={`font-sm text-sm font-semibold px-md py-sm rounded transition-colors ${
                isHome
                  ? "text-on-primary-container hover:bg-on-primary-container/10"
                  : "text-primary-navy hover:bg-surface-gray"
              }`}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="font-sm text-sm font-bold bg-[#EA580C] text-white px-md py-sm rounded-lg hover:bg-[#C2410C] transition-colors shadow-sm"
            >
              Get Started
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-sm rounded focus:outline-none"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden px-lg py-md space-y-md border-t ${
              isHome
                ? "bg-primary-container border-on-primary-container/10 text-on-primary-container"
                : "bg-surface-container-lowest border-border-gray text-text-primary"
            }`}
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-body text-body"
            >
              Browse
            </Link>
            <Link
              href="/signup/plan"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-body text-body"
            >
              Pricing
            </Link>
            <a href="#" className="block font-body text-body">
              Resources
            </a>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-grow w-full">{children}</div>

      {/* Public Footer */}
      <footer className="bg-surface-container border-t border-border-gray w-full mt-auto">
        <div className="max-w-max-width-public mx-auto px-lg py-xl flex flex-col md:flex-row justify-between items-center gap-lg">
          <div className="font-h3 text-h3 font-bold text-primary-navy">
            EstateSync Pro
          </div>
          <div className="flex flex-wrap justify-center gap-md">
            <a
              className="font-xs text-xs text-text-secondary hover:text-primary-navy underline transition-opacity"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="font-xs text-xs text-text-secondary hover:text-primary-navy underline transition-opacity"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="font-xs text-xs text-text-secondary hover:text-primary-navy underline transition-opacity"
              href="#"
            >
              Contact Support
            </a>
            <a
              className="font-xs text-xs text-text-secondary hover:text-primary-navy underline transition-opacity"
              href="#"
            >
              API Docs
            </a>
          </div>
          <div className="font-xs text-xs text-text-secondary text-center md:text-right">
            © 2026 EstateSync Pro B2B Solutions. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

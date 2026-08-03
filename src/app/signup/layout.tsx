"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isStep1 = pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col bg-surface-gray text-text-primary antialiased">
      {/* Minimal Header for Transactional Flow */}
      <header className="w-full bg-surface-container-lowest border-b border-border-gray py-md px-lg flex justify-between items-center z-50">
        <div className={`max-w-max-width-public mx-auto w-full flex items-center ${isStep1 ? "justify-between" : "justify-center"}`}>
          <Link href="/" className="font-h2 text-h2 font-bold text-primary-navy">
            EstateSync Pro
          </Link>
          {isStep1 && (
            <div className="text-text-secondary font-sm text-sm hidden sm:block">
              Need help?{" "}
              <a href="#" className="text-secondary font-semibold hover:underline">
                Contact Support
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
}

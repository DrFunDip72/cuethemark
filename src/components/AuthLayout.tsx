import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}
    >
      <main className="relative z-10 flex items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}

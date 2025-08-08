import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, hsl(var(--gradient-hero-start)), hsl(var(--gradient-hero-mid)) 40%, hsl(var(--gradient-hero-end)))",
        }}
      />

      <main className="relative z-10 flex items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}

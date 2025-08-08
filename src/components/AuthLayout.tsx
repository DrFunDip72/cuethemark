import React from "react";
import { Link } from "react-router-dom";

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

      <header className="relative z-10 mt-4">
        <nav className="mx-auto max-w-2xl rounded-lg border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-2">
            <Link to="/" className="font-semibold">
              MTD
            </Link>
            <Link to="/" className="text-sm hover:underline">
              Back to Home
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}

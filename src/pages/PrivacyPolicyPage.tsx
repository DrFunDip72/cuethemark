import React, { useEffect } from "react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy Policy – MarkTapDance";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Read the MarkTapDance privacy policy.");
  }, []);

  return (
    <div className="min-h-screen relative text-[hsl(var(--hero-foreground))] bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <a href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80">Back to Home</a>
        </header>
        <section className="prose prose-invert max-w-none">
          <p>
            <strong>Last updated:</strong> August 9, 2025
          </p>
          <p>
            MarkTapDance (“we,” “our,” or “us”) respects your privacy and is committed
            to protecting the personal information you share with us. This Privacy
            Policy explains how we collect, use, and protect your information when
            you use our website and application.
          </p>
          <h2>1. Information We Collect</h2>
          <ul>
            <li><strong>Account information</strong> — your name, email address, and password.</li>
            <li><strong>Usage data</strong> — tracks you upload, labels you create, and pages you visit.</li>
            <li><strong>Device data</strong> — browser type, operating system, and IP address.</li>
          </ul>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Provide and improve our services</li>
            <li>Communicate with you (e.g., updates, support)</li>
            <li>Troubleshoot issues</li>
            <li>Ensure account security</li>
          </ul>
          <h2>3. How We Share Your Information</h2>
          <p>
            We <strong>do not sell</strong> your personal information. We may share it only with:
          </p>
          <ul>
            <li>Service providers who help us run the app</li>
            <li>Authorities, if required by law</li>
          </ul>
          <h2>4. Data Storage and Security</h2>
          <p>
            We store your data securely and take reasonable measures to protect it.
            However, no method of transmission or storage is 100% secure.
          </p>
          <h2>5. Your Rights</h2>
          <ul>
            <li>Request a copy of your data</li>
            <li>Ask us to update or delete your data (subject to legal requirements)</li>
            <li>Opt out of non-essential emails</li>
          </ul>
          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this policy, contact us at: <a href="mailto:justinsmaxwell722@gmail.com">justinsmaxwell722@gmail.com</a>
          </p>
          <div className="mt-8">
            <a href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80">Back to Home</a>
          </div>
        </section>
      </main>
    </div>
  );
}
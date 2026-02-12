import React, { useEffect } from "react";

export default function TermsPage() {
  useEffect(() => {
    document.title = "Terms of Service – CueTheMark";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Read the CueTheMark terms of service.");
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold mb-6 text-center" style={{ color: "hsl(var(--landing-accent))" }}>
          Terms of Service
        </h1>
        <section className="prose prose-invert max-w-none [&>*]:text-[hsl(var(--landing-text))] [&_a]:text-[hsl(var(--landing-accent))] [&_a:hover]:opacity-90 [&_strong]:text-[hsl(var(--landing-text))] [&_h2]:text-[hsl(var(--landing-text))] [&_li]:text-[hsl(var(--landing-text-muted))] [&_p]:text-[hsl(var(--landing-text-muted))]">
          <p>
            <strong>Last updated:</strong> August 9, 2025
          </p>
          <p>
            Welcome to CueTheMark (“we,” “our,” or “us”). By using our website
            or application, you agree to these Terms of Service. If you do not
            agree, please do not use our services.
          </p>

          <h2>1. Using CueTheMark</h2>
          <ul>
            <li>You must be at least 5 years old to use our services.</li>
            <li>You are responsible for your account and any activity under it.</li>
            <li>You agree not to misuse our services or attempt to disrupt them.</li>
          </ul>

          <h2>2. Accounts and Payments</h2>
          <ul>
            <li>Some features require an active subscription or one-time payment.</li>
            <li>All payments are processed securely by our payment provider.</li>
            <li>Subscriptions automatically renew unless canceled before the renewal date.</li>
          </ul>

          <h2>3. Content You Upload</h2>
          <ul>
            <li>You retain ownership of the content you upload.</li>
            <li>You grant us a limited license to store and display your content for app functionality.</li>
            <li>You agree not to upload illegal, harmful, or infringing content.</li>
          </ul>

          <h2>4. Service Availability</h2>
          <p>
            We aim to keep the service available at all times but cannot guarantee
            uninterrupted access. We may suspend or discontinue features at our
            discretion.
          </p>

          <h2>5. Liability</h2>
          <p>
            To the fullest extent permitted by law, CueTheMark is not liable for
            indirect, incidental, or consequential damages arising from your use
            of the service.
          </p>

          <h2>6. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of our
            services after changes means you accept the updated Terms.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about these Terms, contact us at:{" "}
            <a href="mailto:justinsmaxwell722@gmail.com">justinsmaxwell722@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}

import React, { useEffect } from "react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy Policy – MarkTapDance";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Read the MarkTapDance privacy policy.");
  }, []);

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <section className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            This is placeholder content for the Privacy Policy. Replace with your actual policy text.
          </p>
          <p>
            We respect your privacy and are committed to protecting your personal information. This policy explains what data we collect, how we use it, and your rights.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Curabitur ac sem nec nunc posuere volutpat. Integer sagittis mauris at tortor lacinia, in vestibulum purus cursus.
          </p>
          <p>
            If you have any questions about this policy, please contact us.
          </p>
        </section>
      </main>
    </div>
  );
}

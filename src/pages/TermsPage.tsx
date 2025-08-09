import React, { useEffect } from "react";

export default function TermsPage() {
  useEffect(() => {
    document.title = "Terms of Service – MarkTapDance";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Read the MarkTapDance terms of service.");
  }, []);

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <section className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            This is placeholder content for the Terms of Service. Replace with your actual terms.
          </p>
          <p>
            By using MarkTapDance, you agree to the following terms and conditions. These terms govern your access to and use of the service.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed venenatis, lectus sed commodo sodales, sem mauris finibus ipsum, et volutpat nulla sem non orci.
          </p>
          <p>
            If you have any questions about these terms, please contact us.
          </p>
        </section>
      </main>
    </div>
  );
}

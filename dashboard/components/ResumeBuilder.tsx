export default function ResumeBuilder() {
  return (
    <section className="py-16 px-4 bg-white" data-animate="reveal">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">AI Resume & Cover Letter Builder</h2>
            <p className="text-gray-700 mb-6">
              Generate tailored resumes and cover letters for each job in seconds. Paste a job description and get a role‑specific application package ready to send.
            </p>
            <div data-animate="reveal">
              <a href="/auth/signup" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-md">
                Try Resume Builder
              </a>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
            <div className="text-sm text-gray-500 mb-2">Preview</div>
            <div className="h-40 bg-gradient-to-b from-white to-gray-50 rounded p-4 overflow-auto text-sm text-gray-700">
              <strong>Professional Summary</strong>
              <p className="mt-2">Product-focused software engineer with 5+ years delivering automation and tooling...</p>
              <hr className="my-3" />
              <strong>Experience bullet</strong>
              <p className="mt-2">Saved 20+ hours/week by automating repetitive application tasks.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
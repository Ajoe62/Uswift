export default function ResumeBuilder() {
  return (
    <section className="py-10 sm:py-16 px-4 bg-white" data-animate="reveal"> {/* Changed: reduced vertical padding for mobile, added sm: for scaling */}
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center"> {/* Changed: grid-cols-1 for mobile, md:grid-cols-2 for desktop; gap-6 for mobile, sm:gap-8 for larger screens */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4"> {/* Changed: text-xl for mobile, sm:text-2xl for tablets, md:text-3xl for desktop */}
              AI Resume & Cover Letter Builder
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-6"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
              Generate tailored resumes and cover letters for each job in seconds. Paste a job description and get a role‑specific application package ready to send.
            </p>
            <div data-animate="reveal">
              <a href="/auth/signup" className="inline-block w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-md text-center"> {/* Changed: w-full for mobile, sm:w-auto for larger screens; text-center for mobile */}
                Try Resume Builder
              </a>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-100"> {/* Changed: p-4 for mobile, sm:p-6 for larger screens */}
            <div className="text-xs sm:text-sm text-gray-500 mb-2"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
              Preview
            </div>
            <div className="h-40 bg-gradient-to-b from-white to-gray-50 rounded p-2 sm:p-4 overflow-auto text-xs sm:text-sm text-gray-700"> {/* Changed: p-2 for mobile, sm:p-4 for larger screens; text-xs for mobile, sm:text-sm for larger screens */}
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
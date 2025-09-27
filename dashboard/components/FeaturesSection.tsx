export default function FeaturesSection() {
  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"> {/* Changed: reduced vertical padding for mobile, added sm: for scaling; grid-cols-1 for mobile, sm:grid-cols-2 for tablets, md:grid-cols-3 for desktop; gap-6 for mobile, sm:gap-8 for larger screens */}
      <div className="bg-white text-black rounded-lg shadow p-4 sm:p-6 card-magic card-magic--glow"> {/* Changed: p-4 for mobile, sm:p-6 for larger screens */}
        <h3 className="font-bold text-base sm:text-lg mb-2"> {/* Changed: text-base for mobile, sm:text-lg for larger screens */}
          Auto Apply
        </h3>
        <p className="text-sm sm:text-base"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
          Automatically apply to jobs with one click.
        </p>
      </div>
      <div className="bg-white text-black rounded-lg shadow p-4 sm:p-6 card-magic card-magic--glow">
        <h3 className="font-bold text-base sm:text-lg mb-2">
          Profile Vault
        </h3>
        <p className="text-sm sm:text-base">
          Store and manage resumes, cover letters, and more.
        </p>
      </div>
      <div className="bg-white text-black rounded-lg shadow p-4 sm:p-6 card-magic card-magic--glow">
        <h3 className="font-bold text-base sm:text-lg mb-2">
          Job Tracking
        </h3>
        <p className="text-sm sm:text-base">
          Track your applications and interview progress in real time.
        </p>
      </div>
    </section>
  );
}
export default function PricingTable() {
  return (
    <section className="py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"> {/* Changed: reduced vertical padding for mobile, added sm: for scaling; grid-cols-1 for mobile, sm:grid-cols-2 for tablets, md:grid-cols-3 for desktop; gap-6 for mobile, sm:gap-8 for larger screens */}
      <div className="bg-white text-black rounded-lg shadow p-4 sm:p-6"> {/* Changed: p-4 for mobile, sm:p-6 for larger screens */}
        <h3 className="font-bold text-base sm:text-lg mb-2"> {/* Changed: text-base for mobile, sm:text-lg for larger screens */}
          Free
        </h3>
        <p className="text-sm sm:text-base"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
          Basic job tracking and profile vault.
        </p>
        <span className="font-bold text-xl sm:text-2xl">$0</span> {/* Changed: text-xl for mobile, sm:text-2xl for larger screens */}
      </div>
      <div className="bg-white text-black rounded-lg shadow p-4 sm:p-6 border-2 border-uswift-accent card-magic card-magic--glow">
        <h3 className="font-bold text-base sm:text-lg mb-2">
          Pro
        </h3>
        <p className="text-sm sm:text-base">
          Auto apply, advanced analytics, priority support.
        </p>
        <span className="font-bold text-xl sm:text-2xl">$9/mo</span>
      </div>
      <div className="bg-white text-black rounded-lg shadow p-4 sm:p-6">
        <h3 className="font-bold text-base sm:text-lg mb-2">
          Premium
        </h3>
        <p className="text-sm sm:text-base">
          All features, unlimited applications, custom integrations.
        </p>
        <span className="font-bold text-xl sm:text-2xl">$19/mo</span>
      </div>
    </section>
  );
}
export default function PricingTable() {
  return (
    <section className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white text-black rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-2">Free</h3>
        <p>Basic job tracking and profile vault.</p>
        <span className="font-bold text-2xl">$0</span>
      </div>
  <div className="bg-white text-black rounded-lg shadow p-6 border-2 border-uswift-accent card-magic card-magic--glow">
        <h3 className="font-bold text-lg mb-2">Pro</h3>
        <p>Auto apply, advanced analytics, priority support.</p>
        <span className="font-bold text-2xl">$9/mo</span>
      </div>
      <div className="bg-white text-black rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-2">Premium</h3>
        <p>All features, unlimited applications, custom integrations.</p>
        <span className="font-bold text-2xl">$19/mo</span>
      </div>
    </section>
  );
}

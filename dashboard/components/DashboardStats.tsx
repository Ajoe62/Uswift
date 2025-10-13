export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  <div className="bg-uswift-blue text-white rounded-lg shadow p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-lg mb-2">Jobs Applied</h4>
        <span className="text-3xl font-bold">24</span>
      </div>
  <div className="bg-uswift-accent text-white rounded-lg shadow p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-lg mb-2">Interviews</h4>
        <span className="text-3xl font-bold">5</span>
      </div>
  <div className="bg-uswift-navy text-white rounded-lg shadow p-6 card-magic card-magic--glow">
        <h4 className="font-bold text-lg mb-2">Offers</h4>
        <span className="text-3xl font-bold">2</span>
      </div>
    </div>
  );
}

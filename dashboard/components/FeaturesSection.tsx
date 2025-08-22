export default function FeaturesSection() {
  return (
    <section className="py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white text-black rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-2">Auto Apply</h3>
        <p>Automatically apply to jobs with one click.</p>
      </div>
      <div className="bg-white text-black rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-2">Profile Vault</h3>
        <p>Store and manage resumes, cover letters, and more.</p>
      </div>
      <div className="bg-white text-black rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-2">Job Tracking</h3>
        <p>Track your applications and interview progress in real time.</p>
      </div>
    </section>
  );
}

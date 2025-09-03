export default function TrustStats() {
  return (
    <section className="py-12 px-4 bg-gray-900 text-white" data-animate="reveal">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-semibold">Trusted, Secure, Fast</h3>
            <p className="text-gray-300 max-w-xl mt-2">We never store your data for training. All processing is ephemeral and encrypted.</p>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">1.2k+</div>
              <div className="text-sm text-gray-300">Active users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">24k+</div>
              <div className="text-sm text-gray-300">Jobs auto-applied</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
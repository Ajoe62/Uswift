export default function HowItWorks() {
  // Replace this with your real YouTube video id (e.g. 'dQw4w9WgXcQ')
  const YOUTUBE_ID = '44a4a6EOIiE';

  return (
    <section className="py-16 px-4 bg-white text-black" data-animate="reveal" aria-labelledby="howitworks-heading">
      <div className="max-w-4xl mx-auto">
        <h2 id="howitworks-heading" className="text-3xl font-bold mb-4 text-uswift-navy" data-animate="reveal">
          How it works
        </h2>
        <p className="mb-6 text-gray-700" data-animate="reveal">
          Watch a short demo showing how the Uswift browser extension can save time by auto-applying and managing your applications.
        </p>

        {/* Video card: reveal + subtle parallax */}
        <div
          className="aspect-[16/9] bg-gray-800 rounded shadow-lg overflow-hidden"
          data-animate="reveal"
          data-parallax
          role="region"
          aria-label="Demo video"
        >
          <div className="relative w-full h-full">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
              title="Uswift demo"
              frameBorder="0"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
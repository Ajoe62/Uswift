export default function HowItWorks() {
  // Replace this with your real YouTube video id (e.g. 'dQw4w9WgXcQ')
  const YOUTUBE_ID = '44a4a6EOIiE';

  return (
    <section className="py-10 sm:py-16 px-4 bg-white text-black" data-animate="reveal" aria-labelledby="howitworks-heading"> {/* Changed: py-10 for mobile, sm:py-16 for larger screens */}
      <div className="max-w-2xl sm:max-w-4xl mx-auto"> {/* Changed: max-w-2xl for mobile, sm:max-w-4xl for larger screens */}
        <h2 id="howitworks-heading" className="text-2xl sm:text-3xl font-bold mb-4 text-uswift-navy" data-animate="reveal"> {/* Changed: text-2xl for mobile, sm:text-3xl for larger screens */}
          How it works
        </h2>
        <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-700" data-animate="reveal"> {/* Changed: text-sm for mobile, sm:text-base for larger screens; mb-4 for mobile, sm:mb-6 for larger screens */}
          Watch a short demo showing how the Uswift browser extension can save time by auto-applying and managing your applications.
        </p>

        {/* Video card: reveal + subtle parallax */}
        <div
          className="aspect-video bg-gray-800 rounded shadow-lg overflow-hidden" // Changed: aspect-video for better mobile scaling
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
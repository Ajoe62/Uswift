import LandingHero from "../components/LandingHero";
import FeaturesSection from "../components/FeaturesSection";
// using a plain anchor tag instead of next/link to avoid missing module/type errors

export default function HomePage() {
  return (
    <main>
      <div className="flex flex-col items-center mt-8">
        <img
          src="/icon128.png"
          alt="Uswift Logo"
          width={96}
          height={96}
          className="mb-4 rounded-full shadow-lg"
        />
      </div>
      <LandingHero />
      <FeaturesSection />
      <section className="text-center mt-8">
        <a
          href="/pricing"
          className="bg-uswift-purple text-white px-6 py-3 rounded-lg font-bold shadow"
        >
          See Pricing
        </a>
      </section>
    </main>
  );
}

import CTAButton from './ui/CTAButton'

export default function LandingHero() {
  return (
    <section className="py-20 text-center bg-uswift-gradient text-white">
      <h1 className="text-5xl font-bold mb-4">Auto-apply & Track Jobs Effortlessly</h1>
      <p className="text-xl mb-8">Uswift helps you land your dream job faster with smart automation and a beautiful dashboard.</p>
  <CTAButton href="/auth/signup" className="px-8 py-4">Get Started</CTAButton>
    </section>
  );
}

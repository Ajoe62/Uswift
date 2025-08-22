import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="w-full py-4 px-8 flex justify-between items-center bg-uswift-gradient text-white">
      {/* Logo with icon */}
      <div className="flex items-center gap-3">
        <Image
          src="/icon48.png"
          alt="Uswift Logo"
          width={32}
          height={32}
          className="rounded"
        />
        <span className="font-bold text-xl">Uswift</span>
      </div>

      {/* Navigation links */}
      <div className="space-x-6">
        <a href="/" className="hover:text-uswift-purple">
          Home
        </a>
        <a href="/features" className="hover:text-uswift-purple">
          Features
        </a>
        <a href="/pricing" className="hover:text-uswift-purple">
          Pricing
        </a>
        <a href="/auth/signin" className="hover:text-uswift-purple">
          Sign In
        </a>
      </div>
    </nav>
  );
}

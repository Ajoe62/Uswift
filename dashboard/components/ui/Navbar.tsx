export default function Navbar() {
  return (
    <nav className="w-full py-4 px-8 flex justify-between items-center bg-uswift-gradient text-white">
      <span className="font-bold text-xl">Uswift</span>
      <div className="space-x-6">
        <a href="/" className="hover:text-uswift-purple">Home</a>
        <a href="/features" className="hover:text-uswift-purple">Features</a>
        <a href="/pricing" className="hover:text-uswift-purple">Pricing</a>
        <a href="/auth/signin" className="hover:text-uswift-purple">Sign In</a>
      </div>
    </nav>
  );
}

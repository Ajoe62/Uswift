import "../styles/globals.css";
import Navbar from "../components/ui/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-uswift-gradient min-h-screen">
        <Navbar />
        {children}
        <footer className="mt-12 p-4 text-center text-white opacity-80">
          Uswift © 2025
        </footer>
      </body>
    </html>
  );
}

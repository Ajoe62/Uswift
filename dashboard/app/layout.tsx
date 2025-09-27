import "../styles/globals.css";
import "../styles/uswift-accent-fallback.css";
import Navbar from "@/components/ui/Navbar";
import { AuthProvider } from "@/src/contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon16.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Uswift Dashboard</title>
      </head>
      <body className="bg-uswift-gradient min-h-screen"> {/* Responsive background and min height for all devices */}
        <AuthProvider>
          <Navbar />
          <main className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4"> {/* Added: Responsive main container with px-2 for mobile, sm:px-4 for tablets and up, max width for large screens */}
            {children}
          </main>
          <footer className="mt-12 p-2 sm:p-4 text-center text-white opacity-80"> {/* Changed: p-2 for mobile, sm:p-4 for tablets and up */}
            Uswift © 2025
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
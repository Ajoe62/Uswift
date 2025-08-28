import "../styles/globals.css";
import "../styles/uswift-accent-fallback.css";
import Navbar from "../components/ui/Navbar";
import { AuthProvider } from "../src/contexts/AuthContext";

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
      <body className="bg-uswift-gradient min-h-screen">
        <AuthProvider>
          <Navbar />
          {children}
          <footer className="mt-12 p-4 text-center text-white opacity-80">
            Uswift © 2025
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

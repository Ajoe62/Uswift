import "../styles/globals.css";
import "../styles/uswift-accent-fallback.css";
import { AuthProvider } from "../lib/contexts/AuthContext";
import Navbar from "../components/ui/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon16.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4">
            {children}
          </main>
          <footer className="mt-12 p-6 sm:p-8 text-center bg-gray-50 text-gray-600 border-t border-gray-200">
            <p className="text-sm">© {new Date().getFullYear()} Uswift. All rights reserved.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

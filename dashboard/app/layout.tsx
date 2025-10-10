import "../styles/globals.css";
import "../styles/uswift-accent-fallback.css";
import Navbar from "@/components/ui/Navbar";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uswift Dashboard",
  description: "Auto-apply to jobs with AI-powered automation",
  icons: {
    icon: "/icon16.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
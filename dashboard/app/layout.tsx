import "../styles/globals.css";
import "../styles/uswift-accent-fallback.css";
import Navbar from "@/components/ui/Navbar";
import { ZustandInitializer } from "@/components/ZustandInitializer";

export const metadata = {
  title: "Uswift Dashboard",
  description: "AI-Powered Career Excellence",
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white min-h-screen">
        <ZustandInitializer />
        <Navbar />
        <main className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4">
          {children}
        </main>
        <footer className="mt-12 p-6 sm:p-8 text-center bg-gray-50 text-gray-600 border-t border-gray-200">
          <p className="text-sm">
            © {new Date().getFullYear()} Uswift. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}

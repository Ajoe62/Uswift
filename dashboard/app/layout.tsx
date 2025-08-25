import "../styles/globals.css";
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
      <body className="bg-uswift-gradient min-h-screen" suppressHydrationWarning>
        <div suppressHydrationWarning>
          <Navbar />
        </div>
        {children}
        <footer className="mt-12 p-4 text-center text-white opacity-80">
          Uswift © 2025
        </footer>
      </body>
    </html>
  );
}
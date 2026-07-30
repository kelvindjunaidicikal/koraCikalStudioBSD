import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "KORA | Kelvin Orchestrated Reservation Application",
  description: "Book state-of-the-art school music practice rooms instantly. Kelvin Orchestrated Reservation Application.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 120px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

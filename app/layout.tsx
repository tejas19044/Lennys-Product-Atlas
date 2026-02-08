import "./globals.css";

export const metadata = {
  title: "Podcast Atlas",
  description: "Decision-routing dashboard for PM podcasts",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

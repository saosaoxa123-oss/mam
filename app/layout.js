import "./globals.css";

export const metadata = {
  title: "Mâm",
  description: "Chụp món, biết calo và đạm.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mâm" },
};

export const viewport = {
  themeColor: "#DCE3DA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "Mâm — chụp món, biết calo & đạm",
  description: "Chụp bữa ăn, AI ước tính calo và đạm, lưu lại theo ngày.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mâm" },
  icons: { apple: "/icon-192.png" },
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

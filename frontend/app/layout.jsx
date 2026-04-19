import './globals.css';

export const metadata = {
  title: 'Báo Giá MKTT',
  description: 'Soạn báo giá bê tông Mekong',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#dc2626',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}

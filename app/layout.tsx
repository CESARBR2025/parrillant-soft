import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Parrilla Norteña Soft',
  description: 'Sistema de captura de órdenes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-bg-base text-body`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#252b45',
              border: '1px solid #2e3555',
              color: '#e8eaf0',
            },
          }}
        />
      </body>
    </html>
  );
}
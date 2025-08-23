import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PrepVista - AI-Powered Exam Preparation',
  description: 'Prepare for UPSC, MPSC, College Placements, IBPS and more with AI-powered aptitude questions and personalized feedback.',
  keywords: 'UPSC, MPSC, College Placements, IBPS, SSC, CAT, exam preparation, AI questions, aptitude test',
  authors: [{ name: 'PrepVista Team' }],
  creator: 'PrepVista',
  publisher: 'PrepVista',
  robots: 'index, follow',
  openGraph: {
    title: 'PrepVista - AI-Powered Exam Preparation',
    description: 'Prepare for UPSC, MPSC, College Placements, IBPS and more with AI-powered aptitude questions and personalized feedback.',
    url: 'https://prepvista.com',
    siteName: 'PrepVista',
    images: [
      {
        url: '/assets/images/PrepVista_favicon.png',
        width: 1200,
        height: 630,
        alt: 'PrepVista - AI-Powered Exam Preparation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrepVista - AI-Powered Exam Preparation',
    description: 'Prepare for UPSC, MPSC, College Placements, IBPS and more with AI-powered aptitude questions and personalized feedback.',
    images: ['/assets/images/PrepVista_favicon.png'],
  },
  icons: {
    icon: '/assets/images/PrepVista_favicon.png',
    shortcut: '/assets/images/PrepVista_favicon.png',
    apple: '/assets/images/PrepVista_favicon.png',
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
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/PrepVista_favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/PrepVista_favicon.png" />
        <link rel="shortcut icon" href="/assets/images/PrepVista_favicon.png" />
        <link rel="apple-touch-icon" href="/assets/images/PrepVista_favicon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

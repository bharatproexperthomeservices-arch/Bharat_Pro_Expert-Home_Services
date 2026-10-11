import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Bharat Pro Expert | Admin', description: 'Bharat Pro Expert Home Services administration portal' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

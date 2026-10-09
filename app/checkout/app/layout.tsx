import React from "react";

export const metadata = {
  title: "Bharat Pro Expert Home Services",
  description: "Home Services Booking Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import React from "react";

export const metadata = {
  title: "Bharat Pro Expert | Home Cleaning Services",
  description: "Book trusted home cleaning services with Bharat Pro Expert."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

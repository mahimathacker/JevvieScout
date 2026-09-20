import "./globals.css";

export const metadata = {
  title: "Who Should I DM? — Jev",
  description: "Find the people worth reaching out to, without reading every post.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

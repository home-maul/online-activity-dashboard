import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";

export const metadata = {
  title: "Marketing Dashboard",
  description: "Google Analytics & Google Ads dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}

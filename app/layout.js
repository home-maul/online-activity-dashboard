import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ThemeToggle from "@/components/layout/theme-toggle";

export const metadata = {
  title: "Marketing Dashboard",
  description: "Google Analytics & Google Ads dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('dashboard-theme')==='prism')document.documentElement.dataset.theme='prism';}catch(e){}`,
          }}
        />
      </head>
      <body>
        <AuthSessionProvider>
          <ThemeProvider>
            {children}
            <ThemeToggle />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

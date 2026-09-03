import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthWrapper } from "@/components/auth-wrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AiAssistant from "@/components/AiAssistant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP Boostup",
  description: "Enterprise SaaS ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthWrapper>
              {children}
              <AiAssistant />
            </AuthWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

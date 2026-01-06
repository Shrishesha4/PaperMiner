import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';
import { CustomThemeProvider } from '@/hooks/use-theme';
import { SidebarProvider } from '@/components/ui/sidebar';
import { HistorySidebar } from '@/components/history-sidebar';
import { AppHeader } from '@/components/header';

export const metadata: Metadata = {
  title: 'PaperMiner',
  description: 'Categorize and analyze research titles from IEEE Xplore.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeProvider>
            <Providers>
              <SidebarProvider>
                  <AppHeader />
                  <div className="flex flex-1 h-full pt-16">
                    <HistorySidebar />
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 min-w-0">
                      {children}
                    </main>
                  </div>
                <Toaster />
              </SidebarProvider>
            </Providers>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/theme-context';
import { SidebarProvider } from '@/context/sidebar-context';

export const metadata: Metadata = {
  title: 'Task Management System',
  description: 'Full-stack task management assessment',
};

// Inline script prevents a flash of the wrong theme before React hydrates.
const noFlashScript = `
(function() {
  try {
    var theme = localStorage.getItem('tms-theme') || 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

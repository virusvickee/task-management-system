import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/theme-context';

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

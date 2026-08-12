import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/theme-context';
import { ThemeApplier } from '@/context/theme-applier';
import { SidebarProvider } from '@/context/sidebar-context';

export const metadata: Metadata = {
  title: 'Task Management System',
  description: 'Full-stack task management assessment',
};

// Prevent flash of wrong theme/accent before React hydrates.
const noFlashScript = `
(function() {
  try {
    var path = window.location.pathname;
    var isLogin = path === '/' || path === '/login';
    var root = document.documentElement;

    if (isLogin) {
      root.dataset.theme = 'light';
      root.style.colorScheme = 'light';
      root.classList.remove('dark');
      root.style.removeProperty('--accent-color');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--btn-primary-bg');
      root.style.removeProperty('--btn-primary-fg');
      return;
    }

    var theme = localStorage.getItem('tms-theme') || 'light';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    var accent = localStorage.getItem('tms-accent') || 'Black';
    var colors = {
      Amber: '#f59e0b', Blue: '#3b82f6', Pink: '#ec4899',
      Rose: '#f43f5e', Emerald: '#10b981', Black: '#171717'
    };
    var hex = colors[accent] || colors.Black;
    root.style.setProperty('--accent-color', hex);
    root.style.setProperty('--accent', hex);
    if (accent === 'Black') {
      var accentDefault = theme === 'dark' ? '#ededed' : '#171717';
      root.style.setProperty('--accent-color', accentDefault);
      root.style.setProperty('--accent', accentDefault);
    } else {
      root.style.setProperty('--btn-primary-bg', hex);
      root.style.setProperty('--btn-primary-fg', '#ffffff');
    }
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
          <ThemeApplier />
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:text-cyan-300"
    >
      {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}

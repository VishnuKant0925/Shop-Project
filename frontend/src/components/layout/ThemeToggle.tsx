'use client';

import styles from './ThemeToggle.module.css';

// Both icons are rendered; CSS keyed on <html data-theme> shows the right one,
// so server and client markup always match and there is no flash.
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage may be unavailable (private mode); the toggle still works for this visit.
    }
  };

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className}`}
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Toggle theme"
    >
      <span className="material-symbols-outlined theme-show-light" aria-hidden="true">dark_mode</span>
      <span className="material-symbols-outlined theme-show-dark" aria-hidden="true">light_mode</span>
    </button>
  );
}

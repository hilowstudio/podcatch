// Sets the colour theme before the first paint, so pages never flash light
// before turning dark. The reader's choice (System, Light or Dark) is kept in
// this browser only; System follows the device and updates when it changes.
export const THEME_KEY = 'podcatch-theme';
export type ThemeChoice = 'system' | 'light' | 'dark';

const script = `(() => {
  const key = '${THEME_KEY}';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const read = () => { try { return localStorage.getItem(key) || 'system'; } catch { return 'system'; } };
  const apply = () => {
    const choice = read();
    const dark = choice === 'dark' || (choice === 'system' && media.matches);
    document.documentElement.classList.toggle('dark', dark);
  };
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('podcatch-theme', apply);
})();`;

export function ThemeScript() {
    return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

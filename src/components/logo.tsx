export function LogoMark({ size = "h-9 w-9" }: { size?: string }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-600/30`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="currentColor">
        <path d="M2.4 11.1 20.8 3.2c.8-.34 1.6.44 1.3 1.26l-6 16.9c-.3.86-1.5.9-1.9.06l-2.6-5.8a1.4 1.4 0 0 0-.6-.64l-5.9-3.2c-.8-.44-.7-1.62.2-1.7Zm7.9 5.4 1.8 3.9 2.6-7.2-4.4 3.3Zm5-4.5 2.4-6.8-10.5 4.6 4.5 2.4c.3.17.55.4.74.7l.36.5 2.5-1.4Z" />
      </svg>
    </div>
  );
}

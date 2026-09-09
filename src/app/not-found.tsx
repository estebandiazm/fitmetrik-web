import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="surface-coach min-h-screen bg-surface-dim flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Wordmark */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <span className="text-xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary-dim">
            FitMetrik
          </span>
        </div>

        {/* Big 404 with a plate where the 0 should be */}
        <div className="flex items-center justify-center gap-4 select-none">
          <span className="text-8xl font-black text-on-surface">4</span>
          <span className="material-symbols-outlined text-primary animate-pulse-slow text-[7rem] leading-none">
            nutrition
          </span>
          <span className="text-8xl font-black text-on-surface">4</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-on-surface">
          Este plato no está en el menú
        </h1>
        <p className="mt-2 text-on-surface-muted">
          La página que buscás se saltó la dieta y desapareció. Volvamos a algo
          que sí podés medir.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/clients"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-control)] bg-primary text-on-primary text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Ir a mis clientes
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-control)] border border-[var(--surface-border)] text-on-surface-muted text-sm font-medium transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

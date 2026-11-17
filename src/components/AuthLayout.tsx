interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(43,217,123,0.08),_transparent_60%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div aria-hidden className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--green)] text-xl font-black text-[#06281a]">
            H
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hakem Ücret Takibi</h1>
        </div>

        <div className="panel p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-[var(--muted)]">{footer}</div>}
      </div>
    </div>
  );
}

import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Escritório Virtual
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Entre com seu email e senha.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
            Email ou senha inválidos.
          </p>
        )}

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-ink"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-accent px-4 py-2 font-body font-medium text-surface"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

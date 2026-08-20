const CATEGORIA_LABELS: Record<string, string> = {
  peticoes: "Petições",
  modelos_contrato: "Modelos de Contrato",
  decisoes_judiciais: "Decisões Judiciais",
  oficios: "Ofícios",
  documentos_clientes: "Documentos de Clientes",
  geoespacial_grandes: "Geoespacial / Grandes",
};

export type DocumentoRow = {
  id: string;
  titulo: string;
  categoria: string;
  cliente: string | null;
  processo: string | null;
  tags: string[];
  created_at: string;
  signedUrl: string | null;
};

export function DocumentList({ documentos }: { documentos: DocumentoRow[] }) {
  if (documentos.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-5 font-body text-sm text-ink-muted">
        Nenhum documento encontrado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[640px] font-body text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">Título</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">Categoria</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">Cliente</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">Tags</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted"></th>
          </tr>
        </thead>
        <tbody>
          {documentos.map((documento) => (
            <tr key={documento.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 text-ink">{documento.titulo}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent-soft px-2 py-1 font-mono text-xs text-accent">
                  {CATEGORIA_LABELS[documento.categoria] ?? documento.categoria}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-muted">{documento.cliente ?? "—"}</td>
              <td className="px-4 py-3 text-ink-muted">
                {documento.tags.length > 0 ? documento.tags.join(", ") : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                {documento.signedUrl ? (
                  <a
                    href={documento.signedUrl}
                    className="font-body text-sm font-medium text-accent underline"
                  >
                    Baixar
                  </a>
                ) : (
                  <span className="text-ink-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

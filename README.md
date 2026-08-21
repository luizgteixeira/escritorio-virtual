# Sigiloteca

> Sistema de gestão documental para advocacia — começa como ferramenta pessoal (uso individual), com o objetivo de virar produto vendável para outros advogados depois de validado. Nome de trabalho anterior: "Escritório Virtual".

Desenvolvido por Luiz Gustavo — [luizgustavodev.com](https://luizgustavodev.com/)

## O que é

Um "escritório virtual": um lugar único e organizado para petições, modelos de contrato, decisões judiciais, ofícios, documentos de clientes e arquivos grandes/geoespaciais — resolvendo a dificuldade do usuário de manter tudo organizado hoje.

Ideia original: "é como se eu entrasse no meu notebook em uma sala secreta" — acesso rápido, tudo no lugar certo, sem fricção.

## Documentação de referência (fora deste repositório)

Toda a decisão de arquitetura e o histórico de negociação vivem no cofre do Obsidian, **não** neste repo:

- **Cofre**: `C:\Users\Luiz Gustavo\OneDrive\documentos\Escritório Virtual\Escritório Virtual\`
  - `Index.md` — visão geral do projeto
  - `ADRs\ADR-001 - Escritorio Virtual.md` — **decisão de arquitetura completa** (contexto, opções consideradas, modelo de dados, stack, consequências, checklist de ação)
  - `Proposta Comercial.md` — orçamento fechado com a cliente (R$ 4.641–7.182, tarifa amiga + 15% desconto)

Leia o ADR-001 antes de tomar qualquer decisão técnica nova — ele já resolveu vários trade-offs (por quê Next.js + Supabase, por quê dois provedores de storage, etc.) e não faz sentido reabrir essas discussões sem motivo novo.

## Status: onde parei

Checklist do ADR-001:

- [x] Validar as categorias iniciais com a cliente
- [x] Logo aprovado pela cliente (conceito "Pilha Organizada")
- [x] Design system (cores + tipografia) definido
- [x] Next.js criado (`create-next-app`, ainda no estado padrão/boilerplate)
- [x] Schema do modelo de dados prototipado em SQL (`supabase/migrations/`) — workspace, documento (com categoria + tags), documento_versao, RLS por workspace_id
- [x] Projeto Supabase criado (`escritorio-virtual`, região São Paulo), migration rodada, `.env.local` preenchido e API confirmada respondendo com RLS ativa
- [x] Upload + categorização + busca básica implementados, migrations aplicadas e testados no navegador (login, upload de documento real, aparece na lista com link de download funcionando)
- [ ] **← PRÓXIMO PASSO: Criar o modelo padrão de Ofício e a ação "Novo a partir deste modelo"**
- [ ] Adicionar botão "Exportar tudo" (.zip) para backup local sob demanda
- [ ] Usar por 2–3 semanas e ajustar a organização antes de pensar em multiusuário
- [ ] Se validar: revisar LGPD e sigilo profissional antes de abrir para outros advogados

**Importante:** o app está funcional de ponta a ponta — login, upload, categorização e busca testados no navegador com o usuário real, incluindo dois bugs achados e corrigidos no processo (busca full-text precisou virar trigger em vez de coluna gerada; nomes de arquivo com acento quebravam a chave no Storage, agora sanitizados). Nada de `documento_versao`/modelo padrão de Ofício foi construído ainda — é o próximo passo do checklist. Tudo já commitado (`a7dfe48`).

## O que já existe neste repositório

```text
sigiloteca/
├── README.md            ← este arquivo
├── brand/                Identidade visual aprovada ("Pilha Organizada")
│   ├── icon-color.svg
│   ├── icon-mono.svg
│   ├── favicon.svg
│   ├── lockup-horizontal.svg
│   └── lockup-stacked.svg
├── design/
│   └── tokens.css         Variáveis CSS de cor + escala tipográfica (claro/escuro)
├── supabase/
│   └── migrations/
│       ├── 20260820000001_init_schema.sql        Schema: workspace, documento, documento_versao + RLS
│       ├── 20260820000002_storage_documentos.sql  Bucket "documentos" + RLS de Storage
│       └── 20260820000003_documento_busca.sql     Busca full-text via trigger (tsvector + GIN)
├── src/
│   ├── proxy.ts           Sessão + proteção de rotas (convenção Next 16, era middleware.ts)
│   ├── app/
│   │   ├── page.tsx        Dashboard: upload, filtro/busca, lista de documentos
│   │   ├── layout.tsx      Fontes da marca (Fraunces/Source Sans 3/IBM Plex Mono)
│   │   ├── login/          Tela de login (email+senha) + server action
│   │   ├── actions.ts       Server action de logout
│   │   └── actions/documentos.ts   Server action de criar documento
│   ├── components/         UploadForm e DocumentList
│   └── lib/
│       ├── supabase/       client.ts, server.ts, middleware.ts (sessão)
│       └── workspace.ts    getOrCreateWorkspace (bootstrap do workspace único)
├── .env.local.example     Modelo do .env.local (o real é gitignorado, uma cópia por máquina)
└── package.json           Next.js 16, React 19, Tailwind 4, @supabase/supabase-js, @supabase/ssr
```

## Stack decidida (ADR-001)

| Papel | Escolha | Motivo |
| --- | --- | --- |
| Frontend | Next.js | Web hoje, caminho aberto pra PWA depois |
| Backend + Auth | Supabase (Postgres) | RLS nativo já isola dados por workspace desde o dia 1 |
| Arquivos — documentos | Supabase Storage | PDFs, DOCX, RG/certidões escaneadas |
| Arquivos — geoespaciais/grandes | Cloudflare R2 | Sem custo de egress, mais barato pra `.dwg`/`.shp`/mapas grandes |
| Busca | Postgres full-text search | Suficiente pro volume do MVP |
| Backup local | Botão "Exportar tudo" (.zip) | Nuvem é a fonte oficial; local é só cópia sob demanda |

Hospedagem e domínio: por conta do desenvolvedor (Luiz), sem custo adicional pra cliente nesta fase.

## Modelo de dados (o que prototipar agora)

```text
Workspace (o escritório da cliente)
  → Categoria (uma das 6 abaixo)
    → Documento (arquivo + cliente, processo, área, tags)
      → Versão (histórico — usado pelos modelos que evoluem, ex: Ofício)
```

### As 6 categorias validadas

| Categoria | Conteúdo | Observação |
| --- | --- | --- |
| Petições | Peças processuais | — |
| Modelos de Contrato | Templates reutilizáveis | Suporta "novo a partir do modelo" |
| Decisões Judiciais | Sentenças, despachos | — |
| Ofícios | Peças de ofício | **Sempre nasce de um modelo padrão** — ação "Novo a partir deste modelo" |
| Documentos de Clientes | RG, matrículas, certidões | Dado sensível — mesmo nível de sigilo dos autos |
| Geoespacial / Grandes | Mapas, `.dwg`, `.shp`, `.kml`/`.kmz`, `.jpg`, `.png` | Binários grandes, **sem preview no MVP** — só download pro programa certo (AutoCAD, QGIS, Google Earth) |

### Regras importantes pro schema

- Tudo isolado por `workspace_id` via Row Level Security do Supabase, mesmo com um único usuário hoje — é isso que permite abrir pra outros escritórios depois sem reescrever nada.
- Documentos de arquivos grandes/geoespaciais devem guardar qual provedor de storage foi usado (Supabase Storage vs R2), já que são dois buckets diferentes.
- Categoria "Ofícios" precisa de um campo/flag pra marcar qual documento é o "modelo padrão" da categoria.

## Design system

Já importado em `src/app/globals.css` e aplicado nas telas reais (login, dashboard). Resumo:

- **Cores**: `--ink` (#1e2230), `--bg`/`--surface`/`--surface-2` (tons de papel), `--accent` (#7a2333, oxblood da marca), `--success`/`--warning`/`--danger` + variantes `-soft`, todos com equivalente de modo escuro no mesmo nome de token.
- **Tipografia**: Fraunces (títulos/H1/H2), Source Sans 3 (texto de interface/rodapé), IBM Plex Mono (categorias, dados, rótulos).
- Referência visual completa: artifact "Design System Escritório Virtual" (publicado na conversa anterior) e PDF salvo em `luiz-gustavo-dev\escritorio-virtual\Design System - Escritorio Virtual.pdf`.

## Fora de escopo nesta fase

(Já orçado à parte, só depois de validar o uso pessoal)

- Multiusuário / venda pra outros escritórios (login separado, planos, cobrança)
- Aplicativo mobile nativo
- Classificação automática de documentos por IA/OCR
- Assinatura eletrônica de documentos

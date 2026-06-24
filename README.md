# Painel de Demandas

Sistema web para a equipe **enviar demandas** e o gestor de TI **acompanhar e atualizar o progresso**, com login, atualização em tempo real, dashboard e notificações por e-mail.

- **Gestor (você):** vê todas as demandas, muda o status, define responsável e prazo, comenta o progresso.
- **Solicitante (demais gestores):** abre demandas e acompanha o andamento das suas.

## 🧱 Tecnologias
- **Next.js 14** (React + TypeScript) — interface e servidor
- **Supabase** — banco de dados, login e tempo real
- **Tailwind CSS** — estilo
- **Recharts** — gráficos do dashboard
- **Resend** — e-mails automáticos (opcional)

---

## 🚀 Passo a passo de instalação

### Pré-requisitos
- [Node.js 18+](https://nodejs.org) instalado.
- Uma conta gratuita no [Supabase](https://supabase.com).
- (Opcional) Conta no [Resend](https://resend.com) para e-mails.

### 1) Instalar as dependências
Abra o terminal nesta pasta e rode:
```bash
npm install
```

### 2) Criar o projeto no Supabase
1. Acesse https://supabase.com → **New project**. Anote a senha do banco.
2. No menu lateral, abra **SQL Editor → New query**.
3. Copie todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql), cole e clique em **Run**. Isso cria as tabelas, regras de segurança e o tempo real.

### 3) Configurar as variáveis de ambiente
1. Copie o arquivo de exemplo:
   ```bash
   cp .env.local.example .env.local
   ```
   (No Windows/PowerShell: `Copy-Item .env.local.example .env.local`)
2. No Supabase, vá em **Project Settings → API** e copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo)
3. (Opcional) Preencha `RESEND_API_KEY` e `EMAIL_FROM` para ativar e-mails.
   Deixe `EMAIL_ADMIN` com o seu e-mail (recebe aviso de toda nova demanda).

### 4) Rodar localmente
```bash
npm run dev
```
Acesse **http://localhost:3000**.

### 5) Criar sua conta e virar administrador
1. Na tela de login, clique em **Cadastre-se** e crie sua conta.
2. No Supabase → **SQL Editor**, rode (troque pelo seu e-mail):
   ```sql
   update public.profiles set role = 'admin' where email = 'adv.anadutra@gmail.com';
   ```
3. Saia e entre novamente. Agora você é o administrador e vê todas as demandas.

> Os demais gestores só precisam clicar em **Cadastre-se** — entram automaticamente como "gestor".

---

## ☁️ Publicar online (Vercel) — acesso de qualquer lugar

1. Suba este projeto para um repositório no GitHub.
2. Acesse https://vercel.com → **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, adicione as mesmas variáveis do `.env.local`
   (incluindo `NEXT_PUBLIC_APP_URL` com a URL final, ex.: `https://seu-app.vercel.app`).
4. Clique em **Deploy**. Em ~1 minuto seu painel estará no ar com link próprio.

> Depois do deploy, no Supabase → **Authentication → URL Configuration**, adicione a URL da Vercel em **Site URL** e **Redirect URLs**.

---

## ⚙️ Configurações úteis do Supabase
- **Confirmação de e-mail:** por padrão o Supabase pode exigir confirmação por e-mail no cadastro. Para um ambiente interno simples, desative em **Authentication → Providers → Email → "Confirm email"** (ou mantenha ativo para mais segurança).

---

## 📁 Estrutura do projeto
```
src/
  app/
    login/            -> tela de login/cadastro + ações de auth
    (app)/            -> área autenticada (com cabeçalho/menu)
      dashboard/      -> indicadores e gráficos
      demandas/       -> quadro Kanban, lista, filtros, detalhes
        nova/         -> formulário de nova demanda
        actions.ts    -> criar/atualizar/comentar/excluir (servidor)
    middleware.ts     -> protege rotas e mantém a sessão
  lib/
    supabase/         -> conexões (navegador, servidor, admin)
    auth.ts, email.ts, types.ts
supabase/schema.sql   -> banco de dados (rodar uma vez)
```

---

## ✅ O que já está pronto
- Login com e-mail e senha + papéis (admin / gestor)
- Envio de demandas com prioridade e prazo
- Kanban + lista com busca e filtros
- Mudança de status, responsável e prazo (admin)
- Comentários/atualizações de progresso em tempo real
- Dashboard com indicadores e gráficos
- E-mail automático: nova demanda (para você) e mudança de status (para o solicitante)

## 🔜 Próximos passos sugeridos
- Notificação por WhatsApp (ex.: API oficial ou Z-API)
- Anexos de arquivos nas demandas (Supabase Storage)
- Filtro por período e exportação para Excel/PDF
- Página de gestão de usuários (promover/remover admin pela interface)

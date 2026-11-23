# Deploy

Passo a passo para pôr a Consertiva no ar e para os deploys seguintes. O que falta fazer está no "Checklist do primeiro deploy" do [roadmap](roadmap.md).

| Peça | Onde | Endereço |
|---|---|---|
| Front | Cloudflare Workers, só os arquivos do build (repositório `fastos-web`) | `consertiva.com.br` e `*.consertiva.com.br` |
| API | Fly.io, em São Paulo (`gru`), com o `Dockerfile` e o `fly.toml` deste repositório | `api.consertiva.com.br` |
| Banco | Neon, branch `production` | — |

## Antes do primeiro deploy (uma vez só)

### Contas e programas

O dono do projeto cria as contas e faz os logins. Os programas guardam o acesso nesta máquina.

1. **Fly.io:** conta com cartão. No Windows, instale o CLI no PowerShell com `iwr https://fly.io/install.ps1 -useb | iex` e entre com `fly auth login`.
2. **Cloudflare:** a conta e o domínio `consertiva.com.br` existem desde 2026-10-31, com os servidores de DNS do Cloudflare. No `fastos-web`, entre com `npx wrangler login`.
3. **Neon:** o CLI com login, o mesmo dos testes de ponta a ponta do front.

### API no Fly.io

Na pasta da API:

1. **Criar o app:** `fly apps create consertiva-api`. Se o nome estiver ocupado, troque o `app` no `fly.toml` e o CNAME do DNS abaixo.
2. **Segredos:** `npm run fly:secrets`. O script gera um par de chaves JWT só para produção e lê as URLs do branch `production` com o CLI do Neon. Os valores vão direto para o Fly, sem aparecer na tela. Confira os nomes com `fly secrets list`.
3. **Ensaio das migrations,** se houver migration nova desde o último ensaio. Crie um branch temporário do Neon a partir do `production`, aplique as migrations nele (`npx prisma migrate deploy`, com as URLs só em variáveis de ambiente) e apague o branch. O ensaio de 2026-10-31 aplicou as migrations que faltavam (aviso ao cliente e índice dos itens) numa cópia do `production` sem erro.
4. **Deploy:** `fly deploy`. O Fly monta a imagem do `Dockerfile` e roda `prisma migrate deploy` (o `release_command`). Só se as migrations passarem é que ele sobe a versão nova.
5. **Certificado:** `fly certs add api.consertiva.com.br`. O Fly confirma quando o DNS abaixo estiver certo.

### DNS no Cloudflare

| Nome | Tipo | Valor | Proxy |
|---|---|---|---|
| `api` | CNAME | `consertiva-api.fly.dev` | **Desligado** (nuvem cinza) |
| `*` | A | `192.0.2.0` | **Ligado** (nuvem laranja) |

- **`api`:** sem o proxy, o Fly emite o certificado, a rota das lojas não pega a API, e o `TRUST_PROXY_HOPS=1` do `fly.toml` continua certo. Com o proxy ligado, ele passaria a ser 2.
- **`*`:** o IP não existe de propósito. Quem responde é o front, pela rota `*.consertiva.com.br/*` do `wrangler.jsonc`, mas o Cloudflare só aplica uma rota a um nome com registro e proxy.
- **O domínio principal** é criado sozinho pelo `wrangler deploy`, como domínio do próprio front.
- **Em SSL/TLS,** ligue "Always Use HTTPS". O modo de criptografia pode ficar no automático.

### Front no Cloudflare

Na pasta do front: `npm run deploy`. Ele gera o build com o `.env.production` (a API em `https://api.consertiva.com.br`) e publica com o `wrangler deploy`.

## Conferir depois do primeiro deploy

1. `https://consertiva.com.br` abre o cadastro. Cadastre uma loja de teste; ela nasce aguardando aprovação.
2. Libere a loja: `fly ssh console -C "node /app/dist/infra/cli/tenants activate <endereço>"`. Se a máquina estiver parada, rode `fly machine start` antes.
3. Entre em `https://<endereço>.consertiva.com.br`, abra uma OS e recarregue a página (a sessão deve continuar).
4. **A CSP do front só avisa por enquanto** (`Content-Security-Policy-Report-Only` no `public/_headers`). Procure violações no console do navegador. Sem nenhuma, troque para `Content-Security-Policy` e publique o front de novo.
5. Marque os itens do checklist no roadmap e crie a branch `dev` no git.

## Deploys seguintes

- **API:** `fly deploy`. As migrations novas rodam sozinhas antes da versão nova; ensaie antes as que mexem em dados.
- **Front:** `npm run deploy`.
- **Voltar uma versão:**
  - API: `fly releases --image` mostra as imagens, e `fly deploy --image <imagem>` volta para uma delas. Uma migration já aplicada não volta junto.
  - Front: `npx wrangler rollback`.

## Lojas novas

As lojas nascem aguardando aprovação.

- **Ver as pendentes:** `fly ssh console -C "node /app/dist/infra/cli/tenants inactive"`.
- **Liberar uma:** o mesmo comando com `activate <endereço>`.

## Senha esquecida

`fly ssh console -C "node /app/dist/infra/cli/users reset-password <endereço> <e-mail>"` gera uma senha temporária e mostra na tela. Passe a senha à pessoa por um canal seguro (de preferência, ligando para ela) e peça para trocar em "Trocar senha", no menu da conta.

## Custos (outubro de 2026)

- **Fly.io:** uma máquina `shared-cpu-1x` com 512 MB, que custa poucos dólares por mês e para sozinha quando ninguém usa (`auto_stop_machines`). Quando as lojas usarem todo dia, mude `min_machines_running` para 1 no `fly.toml`, para ninguém esperar a máquina ligar.
- **Cloudflare:** grátis. Os arquivos estáticos não contam no limite do plano.
- **Neon:** grátis por enquanto, com 100 horas de processamento por mês e 1 GB por projeto. O banco desliga sozinho depois de 5 minutos sem uso.

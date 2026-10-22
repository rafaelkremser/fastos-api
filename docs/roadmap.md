# Roadmap da FastOS API

Plano para levar a API até a produção. É a referência única do que já foi feito, do que vem a seguir e por quê.

**Última atualização:** 2026-10-22

## Como usar este documento

- **Fases por gravidade:**
  - **P0:** impede o deploy.
  - **P1:** sobe, mas quebra ou vaza dados em produção.
  - **P2:** necessário para operar o sistema no dia a dia.
  - **P3:** escala e LGPD, depois dos primeiros clientes.
- **Cada item vira uma branch curta saindo da `main`, com PR.** O PR que conclui um item também atualiza este documento: status, data e, se houver, a decisão tomada.
- As decisões ficam registradas com o motivo, para não serem rediscutidas sem necessidade.

## Resumo

| Fase | Feitos | Total |
|---|:-:|:-:|
| P0: bloqueadores de deploy | 8 | 8 |
| P1: quebra ou vaza em produção | 0 | 4 |
| P2: operação | 0 | 7 |
| P3: escala e LGPD | 0 | 5 |

## P0: bloqueadores de deploy

| # | Item | Status | Onde |
|---|---|---|---|
| P0-1 | `.env.example` alinhado e script das chaves JWT | Feito | `ab7df98` |
| P0-2 | Login isolado por loja (subdomínio) | Feito | [PR #1](https://github.com/rafaelkremser/fastos-api/pull/1) |
| P0-3 | Controle de acesso por papel | Feito | [PR #3](https://github.com/rafaelkremser/fastos-api/pull/3) |
| P0-4 | Limite de tentativas no login e no cadastro | Feito | [PR #4](https://github.com/rafaelkremser/fastos-api/pull/4) |
| P0-5 | `helmet`, CORS configurável e Swagger fora de produção | Feito | [PR #6](https://github.com/rafaelkremser/fastos-api/pull/6) |
| P0-6 | bcrypt com custo 12 e login com tempo constante | Feito | [PR #7](https://github.com/rafaelkremser/fastos-api/pull/7) |
| P0-7 | `start:prod` aplicando as migrations | Feito | [PR #8](https://github.com/rafaelkremser/fastos-api/pull/8) |
| P0-8 | Dependências vulneráveis | Feito | `ded7842` |

**P0-5: `helmet`, CORS configurável e Swagger fora de produção.** Feito.
- **CORS:** as origens vêm de `CORS_ORIGINS`. Como cada loja tem o seu subdomínio, a variável aceita `https://*.fastos.com`, que libera exatamente um nível de subdomínio. Vazia, nenhum site consegue chamar a API pelo navegador.
- **Cabeçalhos de segurança:** o `helmet` acrescenta os cabeçalhos HTTP de segurança e esconde que a API usa Express.
- **Swagger:** só sobe com `SWAGGER_ENABLED=true`. Sem a variável, fica desligado, que é o caso de produção.
- **Testes:** a configuração HTTP fica em `src/infra/http/configure-http.ts`, testada sem subir a API inteira. Isso também cobre o `TRUST_PROXY_HOPS` do P0-4.

**P0-6: bcrypt com custo 12 e login com tempo constante.** Feito.
- **Custo 12:** cada verificação de senha leva cerca de 230 ms, contra 15 ms no custo 8. Adivinhar uma senha a partir de um hash vazado fica cerca de 16 vezes mais caro.
- **Login com tempo constante:** antes, um e-mail sem conta era recusado na hora, sem verificar senha, e um e-mail com conta levava o tempo do bcrypt. Com o custo maior, a diferença ficaria grande o bastante para descobrir quais e-mails têm conta numa loja. Agora o login sempre verifica uma senha: sem usuário, compara com um hash fictício e recusa. Medido na API: 293 ms com o e-mail existente e 292 ms com um e-mail sem conta.

**P0-7: `start:prod` aplicando as migrations.** Feito.
- **`start:prod`** agora é `prisma migrate deploy && node dist/main`: aplica as migrations pendentes e só sobe a API se elas derem certo. Com o banco inacessível ou sem `DATABASE_URL_UNPOOLED`, a API não sobe e o erro aparece no log.
- **`npm run prisma:deploy`** aplica só as migrations, para serviços de hospedagem que têm uma etapa própria de release antes de iniciar a aplicação.
- **O CLI do Prisma passou para as dependências de produção.** Antes, ele só vinha numa instalação sem as dependências de desenvolvimento por um detalhe do lockfile (marcado como `devOptional`), e sumiria com `--omit=optional` ou outro gerenciador de pacotes. Sem ele, o `postinstall` (`prisma generate`) também falharia.
- **Testado** num branch temporário do Neon copiado do `production`, já apagado: a primeira subida aplicou a migration do slug, a segunda não tinha nada pendente, e com a URL errada ou ausente a API não subiu. O `production` em si continua sem a migration do slug até o primeiro deploy.

**P0-8: dependências vulneráveis.** As vulnerabilidades em produção caíram de 27 (1 crítica) para 6, e nenhuma das restantes é alcançável por requisição (ver "Débitos conhecidos").

### Feito fora das fases

- Swagger em `/api/docs` e o endpoint `GET /devices/:id` (`fdb7c76`).
- Banco no Neon, com os branches `production` e `dev` (`b5f3958`, `32b8850`).
- TypeScript 6.0, Prisma Client gerado no `postinstall` e editor usando o TypeScript do projeto ([PR #2](https://github.com/rafaelkremser/fastos-api/pull/2)).
- Primeiros testes do projeto: unitários com jest e repositórios em memória em `test/`.

## P1: quebra ou vaza em produção

| # | Item | Status |
|---|---|---|
| P1-1 | Refresh token (acesso de 15 min, renovação de 7 dias) | **Próximo** |
| P1-2 | Transações nos fluxos que gravam mais de um registro | Pendente |
| P1-3 | Itens da OS carregados junto com a OS | Pendente |
| P1-4 | Numeração da OS sem duplicar | Pendente |

**P1-1: refresh token.**
- O token de acesso dura 7 dias (`src/infra/auth/auth.module.ts`). Um token vazado vale por uma semana, e uma mudança de papel só vale no próximo login.
- Proposta: acesso de 15 minutos e renovação de 7 dias, sem guardar no banco (ver "Decisões").

**P1-2: transações.** Nenhum fluxo usa `$transaction`, então uma falha no meio de uma operação deixa dados pela metade:
- o cadastro pode criar a loja sem o dono;
- a mudança de status e a atribuição de técnico podem ficar sem o registro no histórico.

**P1-3: itens da OS.**
- O mapper cria a lista de itens sempre vazia (`prisma-service-order-mapper.ts`), e o repositório não carrega os itens do banco.
- Resultado: toda OS lida do banco aparece sem itens, e os totais calculados saem errados.
- Junto: adicionar e remover itens passando pela própria OS, e não direto pelo repositório de itens.

**P1-4: numeração da OS.** O próximo número é calculado como "maior número + 1", fora de uma transação. Duas OS criadas ao mesmo tempo na mesma loja recebem o mesmo número, e a segunda falha na restrição de unicidade do banco.

## P2: operação

| # | Item | Status |
|---|---|---|
| P2-1 | Definir a hospedagem da API | Pendente |
| P2-2 | Logs estruturados (Pino), com um ID por requisição | Pendente |
| P2-3 | `GET /health` para o host monitorar a API | Pendente |
| P2-4 | Monitoramento de erros (Sentry) | Pendente |
| P2-5 | Testes de ponta a ponta contra banco: cadastro e login, isolamento entre lojas, OS completa, papéis | Pendente |
| P2-6 | Dockerfile e docker-compose de produção | Pendente |
| P2-7 | CI no GitHub Actions: build, testes, `prisma validate`, `npm audit --omit=dev` | Pendente |

## P3: escala e LGPD

| # | Item | Status |
|---|---|---|
| P3-1 | Refresh token com rotação, que detecta reuso | Pendente |
| P3-2 | Registro de quem acessou dados pessoais (LGPD) | Pendente |
| P3-3 | Exclusão lógica com política de retenção | Pendente |
| P3-4 | Notificações por WhatsApp e e-mail quando a OS muda de status | Pendente |
| P3-5 | Redis: cache e contadores do limite de tentativas compartilhados entre instâncias | Pendente |

## Limpeza contínua

- O `README.md` e o `NEXT_STEPS.md` descrevem rotas e recursos que não existem, como Dashboard e `/auth/login`.
- O ESLint não tem arquivo de configuração, então `npm run lint` não funciona.
- O `.prettierrc` pede ponto e vírgula e linhas de 100, mas o código não usa ponto e vírgula e quebra em 80. Rodar o Prettier no projeto inteiro reformata arquivos sem motivo.
- `class-transformer` e `class-validator` estão instalados sem uso; a validação é feita com Zod.
- Os eventos de domínio da OS são disparados, mas nenhum handler é registrado. Usar (P3-4) ou parar de emitir.
- O Swagger não mostra o corpo das requisições, porque não lê os esquemas do Zod.

## Débitos conhecidos

Limitações aceitas de propósito, para resolver quando fizer sentido:

- **O técnico vê todas as OS da loja,** não só as atribuídas a ele. Isso é um filtro por dono do registro, não por papel.
- **Não há regra por status:** qualquer papel pode levar a OS para qualquer status.
- **Atribuir técnico aceita qualquer usuário da loja,** inclusive um atendente.
- **O papel vem do token** nas rotas: uma mudança de papel só vale no próximo login (até o P1-1). A exceção é a criação de usuários, que lê o papel do banco.
- **Limite de tentativas:**
  - os contadores ficam na memória de cada instância (até o P3-5);
  - não há limite por conta, de propósito: travar por conta permitiria bloquear a conta de outra pessoa;
  - tentativas certas também contam.
- **Custo do bcrypt no servidor:** cada login e cada cadastro ocupa cerca de 230 ms de processamento. O Node faz até 4 verificações ao mesmo tempo, então uma instância atende perto de 17 logins por segundo (medido numa máquina de desenvolvimento); acima disso, os pedidos esperam na fila.
- **Loja inexistente responde cerca de 30 ms mais rápido no login,** porque nem consulta usuários. Isso só revela se o endereço da loja existe, e ele já é público.
- **Vulnerabilidades restantes,** nenhuma alcançável por requisição:
  - `mysql2` e `deepmerge-ts` vêm do CLI do Prisma e só somem no Prisma 8, que ainda é versão de teste;
  - `js-yaml` vem do `@nestjs/swagger`.

## Checklist do primeiro deploy

- [ ] Hospedagem escolhida (P2-1), na mesma região do banco (São Paulo).
- [ ] Par de chaves JWT novo, só para produção, guardado nos segredos do host (nunca o de desenvolvimento).
- [ ] `DATABASE_URL` e `DATABASE_URL_UNPOOLED` do branch `production` do Neon.
- [ ] Sequência do deploy: `npm ci` e `npm run build` (o build precisa das dependências de desenvolvimento); na execução, basta `npm ci --omit=dev` e `npm run start:prod`, que aplica as migrations antes de subir. Se o host tiver etapa de release, rodar `npm run prisma:deploy` nela e `node dist/main` como comando de início.
- [ ] `TRUST_PROXY_HOPS` igual ao número exato de proxies na frente da API. Com 0 atrás de um proxy, todos os clientes dividem um único limite de tentativas; com um número maior, o cliente consegue falsificar o IP.
- [ ] `CORS_ORIGINS` com as origens do frontend, por exemplo `https://*.fastos.com`. Se ficar vazia, o frontend não consegue chamar a API.
- [ ] `SWAGGER_ENABLED` não definida (ou `false`), para o `/api/docs` ficar desligado.
- [ ] DNS curinga `*.fastos.com` apontando para o frontend.
- [ ] Branch `dev` no git, pareada com o branch `dev` do Neon.

## Decisões

| Data | Decisão | Motivo | Alternativas descartadas |
|---|---|---|---|
| 2026-09-15 | Fases P0 a P3, executadas na ordem | Atacar primeiro o que impede o deploy | |
| 2026-09-15 | Cada loja tem um subdomínio próprio (`loja.fastos.com`) | Separar lojas que têm usuários com o mesmo e-mail | E-mail único no sistema; escolher a loja numa lista no login |
| 2026-10-14 | O frontend envia o `tenantSlug` no corpo do login | A API não depende do endereço em que roda e fica fácil de testar | API descobrir a loja pelo endereço acessado |
| 2026-10-14 | O mesmo e-mail pode existir em várias lojas | Um técnico pode trabalhar em duas lojas | E-mail único no sistema |
| 2026-10-14 | Slug escolhido no cadastro; se vazio, gerado do nome. Não muda depois | Dono escolhe o endereço, com uma sugestão pronta | Sempre gerado do nome |
| 2026-09-15 | Isolamento entre lojas só na aplicação, compensado por papéis e testes de isolamento | Rapidez para o MVP | Row-Level Security no Postgres (reavaliar com clientes pagantes) |
| 2026-09-15 | Refresh token sem guardar no banco | Simplicidade | Persistido no banco; com rotação (P3-1) |
| 2026-10-14 | Banco: Neon Postgres em São Paulo, branches `production` e `dev` | Gerenciado, com backup e cópias instantâneas para testar migrations | Banco local do Prisma (poucas conexões); Postgres instalado; Supabase |
| 2026-10-14 | Fluxo de git: `main` mais uma branch curta por tarefa; branch `dev` só no primeiro deploy | Histórico limpo sem merge extra enquanto não há produção | Branches por tipo de código; `dev` desde já |
| 2026-10-15 | TypeScript 6.0, não 7 | O ts-jest e o typescript-eslint ainda não suportam o 7 | TypeScript 7 |
| 2026-10-16 | Rotas bloqueadas por padrão; um teste falha se alguma rota ficar sem marcação de papéis | Endpoint novo esquecido fica fechado, não aberto | Liberado por padrão |
| 2026-10-16 | Papéis por rota conforme a matriz abaixo | Regra do negócio, definida pelo dono do projeto | |
| 2026-10-16 | Login: 10 tentativas por minuto; cadastro: 10 por hora; por IP | Barrar força bruta e cadastro em massa | Limite por conta |
| 2026-10-20 | Swagger desligado por padrão; liga com `SWAGGER_ENABLED=true` | Produção não expõe o mapa da API sem precisar lembrar de nada | Swagger em produção protegido por senha |
| 2026-10-22 | Migrations aplicadas pelo `start:prod`, antes de subir a API | Nenhum deploy sobe com o banco desatualizado; se a migration falhar, a API não sobe. Com várias instâncias, o Prisma usa um bloqueio no banco e só uma aplica | Rodar as migrations à mão a cada deploy |
| 2026-10-22 | CLI do Prisma nas dependências de produção | O `start:prod` e o `postinstall` precisam dele no servidor | Manter em `devDependencies` e depender do lockfile |
| 2026-10-20 | O login sempre verifica uma senha, mesmo sem usuário | Com o bcrypt mais lento, o tempo de resposta revelaria quais e-mails têm conta | Responder na hora quando o e-mail não existe |
| 2026-10-20 | CORS por lista de origens, com curinga de um nível de subdomínio; lista vazia bloqueia tudo | Cada loja chama a API do próprio subdomínio; esquecer a variável deixa a API fechada, não aberta | Liberar qualquer origem |

### Matriz de papéis

| Ação | Dono | Admin | Técnico | Atendente |
|---|:-:|:-:|:-:|:-:|
| Ver o próprio usuário e a loja | ✓ | ✓ | ✓ | ✓ |
| Clientes e aparelhos: cadastrar, listar, ver, editar | ✓ | ✓ | ✓ | ✓ |
| Clientes e aparelhos: excluir | ✓ | ✓ | | |
| OS: abrir, listar, ver histórico, mudar status | ✓ | ✓ | ✓ | ✓ |
| OS: editar (inclusive valores e desconto), adicionar e remover itens | ✓ | ✓ | ✓ | |
| OS: atribuir técnico | ✓ | ✓ | | |
| Criar usuários | ✓ | ✓ (só técnico e atendente) | | |

Ninguém cria um segundo dono.

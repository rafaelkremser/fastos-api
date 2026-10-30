# Roadmap da FastOS API

Plano para levar a API até a produção. É a referência única do que já foi feito, do que vem a seguir e por quê.

**Última atualização:** 2026-10-27

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
| P1: quebra ou vaza em produção | 4 | 4 |
| P2: operação | 0 | 7 |
| P3: escala e LGPD | 0 | 5 |
| Assinatura | 0 | 6 |

**Próximo:** o frontend usa o A4 no dashboard (F5). Seguem anotados no roadmap do frontend o A8 (editar a OS não aceitar `technicianId`), o A10 (e-mail sem diferença de maiúsculas), o A11 (trocar a própria senha) e o A12 (desativar usuário e mudar o papel). Os pedidos do frontend à API (A1 a A5) ficam no roadmap do `fastos-web`, e cada um vira um PR aqui.

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
- Cadastro com aprovação ([PR #13](https://github.com/rafaelkremser/fastos-api/pull/13)), detalhado abaixo.
- A1, pedido do frontend: as listas de clientes, aparelhos do cliente e OS devolvem `meta: { page, perPage, totalCount }`, contado com os mesmos filtros da página ([PR #14](https://github.com/rafaelkremser/fastos-api/pull/14)). Testado contra o banco real: 23 clientes deram 20 na primeira página e `totalCount` 23; a busca e o filtro de status contaram só o que encontram.
- A6, pedido do frontend: excluir cliente ou aparelho que tem OS responde 409, e excluir um cliente sem OS apaga os aparelhos dele na mesma transação ([PR #15](https://github.com/rafaelkremser/fastos-api/pull/15)). Antes, os três casos davam 500, porque o banco recusa apagar registro referenciado e os casos de uso não verificavam. Testado contra o banco real antes e depois da correção.
- A2, pedido do frontend: a lista de OS devolve um resumo de cada uma, com nome e telefone do cliente, tipo, marca e modelo do aparelho e o nome do técnico, lidos na mesma consulta; ganhou o filtro `number`; e o filtro `status` passou a ser validado, respondendo 400 em vez de 500 ([PR #16](https://github.com/rafaelkremser/fastos-api/pull/16)). Testado contra o banco real.
- A3, pedido do frontend: `GET /users` lista a equipe da loja em ordem alfabética, com filtro `role` (por exemplo, só técnicos), sem paginação ([PR #18](https://github.com/rafaelkremser/fastos-api/pull/18)). Testado contra o banco real, inclusive com atendente vendo a lista e recebendo 403 ao tentar criar alguém.
- Loja de demonstração para testes manuais: `npm run seed:dev`, com a API rodando, cria a loja `oficina-demo` com dono, técnico e atendente, 24 clientes, 14 aparelhos e 12 OS em todos os status, passando pela própria API. Numa API com aprovação, a loja fica pendente até `npm run tenants:activate -- oficina-demo`; rodar de novo numa loja com dados não muda nada. Os logins ficam no começo de `scripts/seed-dev.mjs`.
- A9, aviso ao cliente ([PR #19](https://github.com/rafaelkremser/fastos-api/pull/19)), detalhado abaixo.
- A4, métricas para o dashboard ([PR #20](https://github.com/rafaelkremser/fastos-api/pull/20)), e A13, por técnico e por etapa ([PR #21](https://github.com/rafaelkremser/fastos-api/pull/21)), detalhados abaixo.

**A4 e A13: métricas.** Feito.
- **`GET /metrics/operations`,** para todos os papéis: OS por status (todos os status, os vazios com zero), em andamento (de "Aberta" a "Aguardando peças", `ACTIVE_STATUSES`), atrasadas (em andamento com a previsão antes de hoje), prontas para retirada e esperando aviso.
- **`GET /metrics/revenue`,** só para dono e administrador:
  - entregas e faturamento do mês, do dia 1 até agora;
  - o mesmo trecho do mês anterior, para comparar: no dia 10, o mês passado conta até o dia 10, e um mês mais curto conta inteiro;
  - os últimos 30 dias, um a um, os sem entrega com zero.
- **Faturamento** é o total das OS entregues, contadas no dia da entrega, pela regra do total da OS: valor final, senão orçamento, senão a soma dos itens, menos o desconto. A conta roda no banco (`$queryRaw`, o primeiro SQL escrito à mão do projeto), e as datas são passadas em texto ISO e convertidas para UTC lá, sem depender do fuso da sessão.
- **Dias e meses no fuso de Brasília** (`STORE_TIME_ZONE` em `src/core/time/time-zone.ts`), porque a loja não tem fuso próprio ainda.
- **Índice dos itens por OS:** a tabela de itens não tinha índice em `service_order_id`, e o Postgres não cria um para chave estrangeira sozinho. Abrir uma OS lia a tabela inteira de itens; agora usa o índice, e as métricas também.
- **`GET /metrics/technicians`** (A13), só para dono e administrador: por técnico, em andamento e atrasadas agora; concluídas (ficaram prontas), entregues e faturamento no mês. Lista quem pode pegar OS (ativo e não atendente), mesmo sem nenhuma, e quem tem OS atribuída; as sem técnico vêm à parte. O técnico não vê nem os próprios números.
- **`GET /metrics/stage-times`** (A13), só para dono e administrador: a mediana do tempo que as OS ficam em cada status, de "Aberta" a "Pronta", nos últimos 90 dias, para a loja toda e nunca por pessoa. Sai do histórico de mudanças de status; a primeira etapa conta da entrada da OS, porque abrir a OS não grava histórico. Uma etapa entra quando termina, com o tempo desde que começou, mesmo antes dos 90 dias.
- **Testado contra o banco real,** num branch temporário com entregas espalhadas em agosto, setembro e outubro, inclusive uma no dia 30/09 às 23h de Brasília (já 1º/10 em UTC). Os números bateram com a conta feita à mão: 4 entregas e R$ 929,90 no mês, 1 e R$ 250,00 no mesmo trecho de setembro, 2 atrasadas (a que vence hoje não conta), 3 esperando aviso. O técnico vê as operações e recebe 403 no faturamento. Num segundo branch, com técnicos atribuídos e um histórico de status montado à mão: os números por técnico e os tempos por etapa bateram com a conta e com o teste unitário (2 h em "Aberta", 13 h em "Em análise", 3 dias em "Aguardando peças"), e o técnico recebe 403 nas duas rotas.

**A9: aviso ao cliente.** Feito.
- **O aviso é separado do status.** A OS guarda quando a loja avisou o cliente (`customer_notified_at`), e qualquer mudança de status apaga essa data, porque o aviso valia para o status anterior.
- **Precisa avisar** quando a OS está "Pronta" (`COMPLETED`) ou "Aguardando aprovação" (`WAITING_APPROVAL`) e ainda não teve aviso. A regra fica na entidade (`needsCustomerNotice`), e a lista e a OS completa devolvem o resultado.
- **`POST /service-orders/:id/notices`** registra o aviso com o canal (WhatsApp, telefone, SMS, e-mail, pessoalmente) e uma observação opcional, para todos os papéis, e grava `CUSTOMER_NOTIFIED` no histórico na mesma transação.
- **`GET /service-orders?needsCustomerNotice=true`** traz só as OS que precisam de aviso, e combina com os outros filtros.
- **Testado contra o banco real,** num branch temporário: a migration aplicada sem diferença para o schema, a atendente registrando o aviso, o filtro caindo de 3 para 2 e a OS voltando a pedir aviso depois de sair de "Pronta" e voltar.

**Cadastro com aprovação.** Feito.
- **A loja nova nasce inativa.** O cadastro continua público, mas ninguém entra até a loja ser liberada. Com `TENANT_AUTO_APPROVAL=true`, volta a nascer liberada, para quando houver cobrança (ver "Assinatura").
- **Login de loja pendente:** com a senha certa, a API responde 403 ("Tenant is not active."), e o frontend explica que a loja aguarda aprovação. Com a senha errada, a resposta continua 401, então só quem já provou ser usuário da loja descobre que ela está pendente.
- **Comandos para o dono do FastOS** (depois do `npm run build`, contra o banco do `DATABASE_URL`):
  - `npm run tenants:inactive` lista as lojas aguardando aprovação, da mais antiga para a mais nova;
  - `npm run tenants:activate -- <endereço>` libera a loja.
- **Testado** num branch temporário do Neon, junto com o frontend: cadastro pendente, 401 com a senha errada, 403 com a certa, listagem, liberação e login depois de liberada.

## P1: quebra ou vaza em produção

| # | Item | Status | Onde |
|---|---|---|---|
| P1-1 | Refresh token (acesso de 15 min, renovação de 7 dias) | Feito | [PR #9](https://github.com/rafaelkremser/fastos-api/pull/9) |
| P1-2 | Transações nos fluxos que gravam mais de um registro | Feito | [PR #10](https://github.com/rafaelkremser/fastos-api/pull/10) |
| P1-3 | Itens da OS carregados junto com a OS | Feito | [PR #11](https://github.com/rafaelkremser/fastos-api/pull/11) |
| P1-4 | Numeração da OS sem duplicar | Feito | [PR #12](https://github.com/rafaelkremser/fastos-api/pull/12) |

**P1-1: refresh token.** Feito.
- **Login:** devolve dois tokens no corpo da resposta: o de acesso (`access_token`, 15 minutos) e o de renovação (`refresh_token`, 7 dias). Antes havia um só, de 7 dias.
- **`POST /refresh`:** recebe o token de renovação e devolve um token de acesso novo. O de renovação não é trocado, então a sessão acaba 7 dias depois do login.
- **A renovação consulta o banco:** o usuário e a loja precisam continuar ativos, e o papel vem do cadastro atual. Desativar alguém corta o acesso em até 15 minutos, e uma mudança de papel passa a valer em até 15 minutos.
- **Os dois tokens usam a mesma chave e se distinguem pelo campo `type`:** o de renovação não abre rotas, e o de acesso não serve para renovar.
- **Token com conteúdo inesperado responde 401.** Antes, um token bem assinado com conteúdo fora do formato viraria erro 500.
- **Limite:** 30 renovações por minuto por IP.

**P1-2: transações.** Feito.
- **O problema:** uma falha no meio de uma operação deixava dados pela metade. O cadastro podia criar a loja sem o dono, e a mudança de status e a atribuição de técnico podiam ficar sem o registro no histórico.
- **`TransactionManager`** (`src/core/transactions`): o domínio pede "rode isto de forma atômica" sem saber que existe Prisma. Se algo falhar lá dentro, tudo o que foi gravado é desfeito.
- **Os repositórios entram na transação sozinhos:** eles acessam o banco por `this.prisma.client`, que devolve a transação aberta quando existe uma. Repositório novo precisa seguir esse padrão, e nunca usar `this.prisma.<modelo>` direto.
- **Aplicado** no cadastro (loja e dono), na mudança de status e na atribuição de técnico (OS e histórico). No cadastro, o hash da senha (cerca de 230 ms) roda antes de abrir a transação, para ela segurar a conexão só durante as gravações.
- **Testado contra o banco real:** sem transação, um erro do banco deixava a loja sem dono; com transação, a loja é desfeita. Uma transação dentro de outra se junta a ela, e duas transações ao mesmo tempo não se misturam.

**P1-3: itens da OS.** Feito.
- **O problema:** o mapper criava a lista de itens sempre vazia, e o repositório não lia os itens do banco. Toda OS lida do banco aparecia sem itens, e o total calculado a partir deles saía zero.
- **Leitura:** a OS vem do banco com os itens, na ordem em que foram incluídos, na busca por ID, na busca por número e na listagem. O mapper exige os itens no tipo que recebe, então uma consulta nova que esqueça de carregá-los não compila.
- **Gravação pela OS:** adicionar e remover item passam pela própria OS (`addItem` e `removeItem`). O repositório da OS grava, na mesma transação, a OS e as mudanças da lista de itens. O repositório de itens perdeu os métodos de acesso direto e só é usado pelo repositório da OS.
- **Item de outra OS:** remover, pelo endereço de uma OS, um item que pertence a outra responde 404 (antes, 403).
- **Resposta:** `GET /service-orders/:id` e a listagem passam a trazer `items` e `totalItemsCost`.
- **Testado contra o banco real:** no código anterior, uma OS com 2 itens gravados voltava com 0 itens e total 0; agora volta com os 2 e o total certo. Se a gravação de um item falha, a alteração da OS também é desfeita.

**P1-4: numeração da OS.** Feito.
- **O problema:** o próximo número era calculado como "maior número + 1", fora de uma transação. Duas OS criadas ao mesmo tempo na mesma loja recebiam o mesmo número, e a segunda falhava na restrição de unicidade do banco (erro 500).
- **Contador por loja:** a tabela `service_order_counters` guarda o último número dado em cada loja. Criar uma OS incrementa o contador e grava a OS na mesma transação. O banco trava o contador da loja até o fim da transação, então duas OS simultâneas esperam uma pela outra em vez de ler o mesmo número. Lojas diferentes não esperam umas pelas outras.
- **Sem buracos:** se a criação falha depois de pegar o número, a transação desfaz o incremento e o número volta para a próxima OS.
- **Migration:** cria o contador de cada loja a partir do maior número que ela já tem. Lojas sem OS ganham o contador na primeira OS.
- **Testado contra o banco real** (num branch temporário copiado do `dev`): no código anterior, de 10 OS criadas ao mesmo tempo, só 2 deram certo; agora saem as 10, numeradas de 1 a 10. Medido daqui, as 10 levaram 0,7 s no total, porque são gravadas uma de cada vez.

## P2: operação

| # | Item | Status |
|---|---|---|
| P2-1 | Definir a hospedagem da API | Adiado para o primeiro deploy (ver "Decisões") |
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

## Assinatura (depois dos primeiros clientes)

Hoje os primeiros clientes entram por contrato, com a loja liberada à mão. Esta fase troca a liberação manual pela cobrança.

| # | Item | Status |
|---|---|---|
| S-1 | Termos de uso e política de privacidade, aceitos no cadastro. O FastOS trata os dados dos clientes de cada loja por conta dela (LGPD) | Pendente |
| S-2 | Confirmação de e-mail no cadastro | Pendente |
| S-3 | Planos e limites aplicados na API: usuários, OS por mês, recursos | Pendente |
| S-4 | Cobrança recorrente: o pagamento libera a loja, e a falta dele a suspende | Pendente |
| S-5 | Tela de planos e período de teste (ou plano grátis) | Pendente |
| S-6 | Cadastro sem aprovação (`TENANT_AUTO_APPROVAL=true`), depois de S-1, S-2 e S-4 | Pendente |

## Limpeza contínua

- O `README.md` descreve rotas e recursos que não existem, como Dashboard e `/auth/login`.
- O ESLint não tem arquivo de configuração, então `npm run lint` não funciona.
- O `.prettierrc` pede ponto e vírgula e linhas de 100, mas o código não usa ponto e vírgula e quebra em 80. Rodar o Prettier no projeto inteiro reformata arquivos sem motivo.
- `class-transformer` e `class-validator` estão instalados sem uso; a validação é feita com Zod.
- Os eventos de domínio da OS são disparados, mas nenhum handler é registrado. Usar (P3-4) ou parar de emitir.
- O Swagger não mostra o corpo das requisições, porque não lê os esquemas do Zod.
- As URLs do Neon trazem `sslmode=require`, e o `pg` avisa a cada conexão que hoje trata esse modo como `verify-full` e que isso muda na próxima versão. Trocar por `sslmode=verify-full` no `.env` e nos segredos de produção.

## Débitos conhecidos

Limitações aceitas de propósito, para resolver quando fizer sentido:

- **O técnico vê todas as OS da loja,** não só as atribuídas a ele. Isso é um filtro por dono do registro, não por papel.
- **Não há regra por status:** qualquer papel pode levar a OS para qualquer status.
- **Atribuir técnico aceita qualquer usuário da loja,** inclusive um atendente.
- **O papel vem do token de acesso:** uma mudança de papel leva até 15 minutos para valer, o tempo de o token vencer e ser renovado. A exceção é a criação de usuários, que lê o papel do banco na hora.
- **Não há revogação de tokens:**
  - um token de renovação vazado vale até completar 7 dias do login;
  - "sair do sistema" é o frontend apagar os tokens, e quem tiver uma cópia continua podendo usá-la até vencer;
  - desativar o usuário ou a loja corta o acesso em até 15 minutos;
  - persistir os tokens no banco e trocar a cada uso (P3-1) resolve.
- **Eventos de domínio disparam antes do commit:** o repositório de OS dispara os eventos logo após gravar, ainda dentro da transação. Hoje nenhum evento tem handler, então não há efeito. Quando houver notificações (P3-4), um envio poderia sair para uma mudança que depois foi desfeita; os eventos terão de disparar só depois do commit.
- **Cadastros simultâneos com o mesmo endereço ou e-mail:** se dois pedidos passarem pela verificação ao mesmo tempo, o segundo esbarra na restrição de unicidade do banco e recebe erro 500 em vez de 409. Graças à transação, nada fica gravado pela metade.
- **Gravações simultâneas na mesma OS:** cada gravação regrava a OS inteira com o que foi lido no começo do pedido. Se duas pessoas mexerem na mesma OS no mesmo instante (por exemplo, uma edita o diagnóstico enquanto a outra adiciona um item), a segunda gravação desfaz a mudança da primeira nos campos da OS. Os itens não se perdem, porque são gravados um a um. A solução é controlar a versão: a gravação só vale se a OS não mudou desde a leitura, e senão responde 409.
- **Loja inativa hoje quer dizer "aguardando aprovação".** Quando houver suspensão por falta de pagamento (S-4), o login e o frontend vão precisar distinguir os dois casos, com um status no lugar do `isActive`.
- **Cliente com OS não pode ser excluído,** nem por pedido do próprio cliente (LGPD). A saída é anonimizar os dados pessoais e manter a OS, junto com a exclusão lógica do P3-3.
- **Fuso único:** dias e meses das métricas seguem o horário de Brasília. Uma loja em outro fuso (Acre, Amazonas, Fernando de Noronha) vê o virar do dia uma ou duas horas fora; resolver pede um fuso por loja.
- **Faturamento não é recebimento:** a API não registra pagamentos, então o faturamento é o total das OS entregues. Uma OS paga antes da entrega, ou entregue sem pagar, aparece no dia da entrega.
- **Editar um cliente não confere telefone repetido:** só o cadastro verifica, e o banco não tem restrição de unicidade (só um índice), então a edição aceita o telefone de outro cliente da loja.
- **Ninguém é avisado de um cadastro novo:** a fila só aparece com `npm run tenants:inactive`. As notificações (P3-4) resolvem.
- **Os tokens ficam no frontend,** porque vêm no corpo da resposta: um script malicioso injetado no site (XSS) conseguiria lê-los. Guardar o de renovação num cookie que o JavaScript não lê é a alternativa, quando houver frontend.
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

- [ ] Hospedagem escolhida (P2-1), na mesma região do banco (São Paulo). Recomendação: Fly.io em São Paulo para a API e Cloudflare para o frontend e o DNS.
- [ ] Par de chaves JWT novo, só para produção, guardado nos segredos do host (nunca o de desenvolvimento).
- [ ] `DATABASE_URL` e `DATABASE_URL_UNPOOLED` do branch `production` do Neon.
- [ ] Sequência do deploy: `npm ci` e `npm run build` (o build precisa das dependências de desenvolvimento); na execução, basta `npm ci --omit=dev` e `npm run start:prod`, que aplica as migrations antes de subir. Se o host tiver etapa de release, rodar `npm run prisma:deploy` nela e `node dist/main` como comando de início.
- [ ] `TRUST_PROXY_HOPS` igual ao número exato de proxies na frente da API. Com 0 atrás de um proxy, todos os clientes dividem um único limite de tentativas; com um número maior, o cliente consegue falsificar o IP.
- [ ] `CORS_ORIGINS` com as origens do frontend, por exemplo `https://*.fastos.com`. Se ficar vazia, o frontend não consegue chamar a API.
- [ ] `SWAGGER_ENABLED` não definida (ou `false`), para o `/api/docs` ficar desligado.
- [ ] `TENANT_AUTO_APPROVAL` não definida (ou `false`), para as lojas novas aguardarem aprovação.
- [ ] Um jeito de rodar `npm run tenants:inactive` e `tenants:activate` contra o banco de produção: no servidor, ou localmente com as URLs do `production` só em variáveis de ambiente.
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
| 2026-10-22 | Tokens no corpo da resposta, guardados pelo frontend | Funciona igual para site e app, inclusive com o subdomínio de cada loja em desenvolvimento | Refresh em cookie httpOnly (reavaliar com o frontend) |
| 2026-10-22 | Sessão de 7 dias a partir do login; a renovação não troca o token de renovação | Sem revogação, um token de renovação vazado deixa de valer em no máximo 7 dias | Renovar a sessão a cada uso |
| 2026-10-22 | Um par de chaves para os dois tokens, separados pelo campo `type` | Nenhuma variável de ambiente nova; um tipo não serve no lugar do outro | Um par de chaves só para os tokens de renovação |
| 2026-10-22 | A renovação confere no banco usuário, loja e papel | Desativar alguém tem efeito em até 15 minutos, mesmo sem revogação | Validar só a assinatura do token |
| 2026-10-22 | Transações por um `TransactionManager` no domínio, com a transação aberta guardada no contexto da requisição (`AsyncLocalStorage`) | O domínio não conhece o Prisma, e os repositórios participam sem receber a transação como parâmetro | Passar a transação explicitamente a cada repositório; usar uma biblioteca de terceiros |
| 2026-10-23 | Itens lidos e gravados só pela OS: o repositório da OS grava a OS e as mudanças da lista de itens na mesma transação | A OS calcula os totais a partir dos itens, e nenhum item é gravado por fora dela | Casos de uso gravando direto no repositório de itens, como antes |
| 2026-10-27 | Número da OS vem de um contador por loja, incrementado na mesma transação que grava a OS | Atômico e sem buracos; só as OS da mesma loja esperam umas pelas outras | Tentar de novo quando o número repetir; `MAX + 1` com bloqueio da loja inteira; uma sequência do Postgres por loja |
| 2026-10-27 | Hospedagem decidida só no primeiro deploy, depois do frontend completo e testado localmente. Recomendação: Fly.io em São Paulo para a API e Cloudflare para o frontend e o DNS | Ver tudo funcionando antes de pagar; o domínio ainda não foi escolhido (`fastos.com.br`, `fastos.com` e `fastos.app` já têm dono) | Contratar agora; API fora de São Paulo (Railway, Render), longe do banco |
| 2026-10-27 | Cadastro aberto, mas a loja nasce aguardando aprovação; o dono do FastOS a libera por comando depois de fechar o contrato | Sem cobrança, confirmação de e-mail e termos, o cadastro já liberado deixaria qualquer um usar de graça e sem contrato. O cliente escolhe a própria senha | Cadastro já liberado; loja criada pelo dono do FastOS, que teria de saber a senha do cliente ou mandar um link por e-mail |
| 2026-10-27 | Loja inativa responde 403 no login só quando a senha está certa | Quem já provou ser usuário da loja pode saber que ela aguarda aprovação; para os outros, a resposta continua igual à da senha errada | Sempre 401, sem explicar; avisar mesmo com a senha errada |
| 2026-10-27 | Planos e cobrança só depois dos primeiros clientes | Preço definido com dados reais; uma tela de planos sem cobrança prometeria o que o sistema não faz | Tela de planos já no cadastro |
| 2026-10-28 | Cliente ou aparelho com OS não pode ser excluído (409); excluir um cliente sem OS leva os aparelhos dele junto | A OS é o histórico da loja e precisa do cliente e do aparelho. Exigir apagar aparelho por aparelho antes do cliente só atrapalharia | Apagar as OS junto; bloquear a exclusão de cliente que tem aparelho |
| 2026-10-28 | A lista de OS devolve um resumo (`ServiceOrderSummary`) com os nomes do cliente, do aparelho e do técnico, e não a OS inteira | A tabela mostra nomes, não IDs, e uma consulta só traz tudo; os detalhes completos ficam em `GET /service-orders/:id` | O frontend buscar cliente e aparelho de cada linha; a lista devolver a OS inteira com os itens |
| 2026-10-28 | Todos os papéis veem a equipe da loja; a lista vem inteira, sem paginação | A lista de OS filtra por técnico para qualquer papel, e a equipe de uma loja cabe numa resposta | Só dono e administrador; lista paginada |
| 2026-10-28 | Aviso ao cliente registrado à parte, e não como status novo | O status diz em que etapa o conserto está; o aviso diz se a loja falou com o cliente. Como status, cada etapa que pede aviso dobraria (avisar e avisado) | Status "pronta, avisar cliente" e "pronta, cliente avisado" |
| 2026-10-28 | Mudar o status apaga o aviso | O aviso era sobre o status anterior; o novo precisa do seu | Manter a data do último aviso de qualquer status |
| 2026-10-30 | Faturamento é o total das OS entregues, no dia da entrega | A API não registra pagamentos; a entrega é quando o cliente costuma pagar | Contar quando a OS fica pronta; registrar pagamentos antes do dashboard |
| 2026-10-30 | O mês corrente é comparado com o mesmo trecho do mês anterior | Comparar o começo do mês com um mês inteiro sempre parece queda | Mês anterior inteiro, como no `pizza-shop` |
| 2026-10-30 | Duas rotas de métricas, separadas por papel | O faturamento é só de dono e administrador; a operação é de todos. Cada rota tem um `@Roles` só | Uma rota que esconde campos conforme o papel |
| 2026-10-30 | Números por técnico só para dono e administrador | Decisão do dono do projeto: o técnico não vê nem os próprios números, para não virar comparação dentro da equipe | O técnico ver a própria linha |
| 2026-10-30 | Tempo por etapa para a loja toda, e não por técnico | O tempo de uma OS depende de peça, de aprovação do cliente e da dificuldade; por pessoa, seria injusto e viraria ranking. Por etapa, mostra onde o trabalho trava | Tempo médio de conserto por técnico |
| 2026-10-30 | Mediana dos últimos 90 dias, calculada no caso de uso | A mediana não se mexe com uma OS fora do comum; 90 dias dão algumas OS por etapa numa loja pequena. O repositório só busca as mudanças, e a conta fica testada num lugar só | Média; SQL com funções de janela |
| 2026-10-30 | Fuso fixo de Brasília para dias e meses | Toda loja é do Brasil por enquanto, e o país não tem horário de verão desde 2019 | Fuso por loja, que exige campo novo e tela |
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
| Ver a equipe da loja (lista de usuários) | ✓ | ✓ | ✓ | ✓ |
| Criar usuários | ✓ | ✓ (só técnico e atendente) | | |
| Ver os números da operação (OS por status, atrasadas, avisos) | ✓ | ✓ | ✓ | ✓ |
| Ver o faturamento | ✓ | ✓ | | |
| Ver os números por técnico e o tempo em cada etapa | ✓ | ✓ | | |

Ninguém cria um segundo dono.

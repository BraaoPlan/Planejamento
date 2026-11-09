# QualiMed • Plataforma Integrada de Gestão da Qualidade (SIGQ)

Sistema interno de acompanhamento e governança da equipe da Qualidade da MedSênior. O sistema centraliza o agendamento de consultorias nos setores, controle de metas de carga horária dos analistas, planos de ação 5W2H, diagnósticos operacionais e ranking de produtividade gerencial.

---

## 1. Stack Tecnológica e Arquitetura

* **Backend:** Node.js (v20+ LTS) com Express.
* **Engine de Banco de Dados:** SQLite nativo via `node:sqlite` (`DatabaseSync`), com modo WAL (*Write-Ahead Logging*) ativo para alto desempenho concorrente sem dependência de módulos compilados externos.
* **Frontend:** Interface SPA (*Single Page Application*) desenvolvida em HTML5 semântico, Tailwind CSS e Vanilla JavaScript, gerada através do script de build (`build.js`) para `views/index.html`.
* **Comunicação em Tempo Real:** Server-Sent Events (SSE) via `/api/sync/stream` para atualização de alterações entre navegadores na rede interna.
* **Criptografia e Segurança:**
  * Hashing de senhas e PINs com algoritmo `scrypt` e Salt aleatório de 16 bytes (`node:crypto`).
  * Autenticação via tokens JWT com assinatura HMAC-SHA256.
  * Rate limiting em memória para contenção de ataques de força bruta no login (bloqueio temporário de 15 minutos após 5 falhas consecutivas, conforme POL.SEG.INS.002, Item 10.1.6).
  * Proteção contra SQL Injection via consultas preparadas (*Prepared Statements*) parametrizadas em 100% das operações.
  * Cabeçalhos HTTP de segurança (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`).
  * Trilha de auditoria operacional em banco de dados (`logs_auditoria`).

---

## 2. Instruções de Instalação e Execução

### Pré-requisitos
* **Node.js:** Versão 20.0.0 ou superior (recomendado Node.js 22 LTS ou 24).
* **NPM:** Incluído na instalação do Node.js.

### Passo 1: Instalar dependências
No diretório raiz da aplicação:
```bash
npm install
```

### Passo 2: Configurar variáveis de ambiente
Copie o arquivo de exemplo `.env.example` para `.env`:
```bash
cp .env.example .env
```
*(No Windows PowerShell: `Copy-Item .env.example .env`)*

Ajuste as variáveis necessárias:
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_jwt_corporativa_aqui
DATABASE_PATH=qualimed.sqlite
ADMIN_DEFAULT_PASSWORD=DefinaUmaSenhaSegura2026!
```

### Passo 3: Compilar o Frontend
O frontend unificado é compilado de `plataforma_qualidade.html` para `views/index.html`:
```bash
npm run build
```

### Passo 4: Iniciar o Servidor
```bash
npm start
```
O servidor estará acessível em:
* Local: `http://localhost:3000`
* Rede interna: `http://<IP_DO_SERVIDOR>:3000`

---

## 3. Estrutura de Diretórios

```
QualiMed/
├── .env.example              # Template de configuração de ambiente para TI/DevOps
├── .env                      # Arquivo de configuração local (ignorado pelo git)
├── .gitignore                # Regras de exclusão para versionamento seguro
├── package.json              # Metadados e dependências do projeto
├── server.js                 # Servidor Express, rotas da API REST e middlewares
├── database.js               # Conexão SQLite (WAL), DDL de tabelas, hash e seed
├── build.js                  # Script de build que gera views/index.html
├── plataforma_qualidade.html # Código-fonte do frontend da plataforma
├── qualimed.sqlite           # Banco de dados SQLite operacional
├── data/
│   └── seed_sigq.json        # Massa inicial de setores oficiais e atividades base
├── public/                   # Arquivos estáticos (ícones, imagens)
└── views/
    └── index.html            # Frontend compilado pronto para servir
```

---

## 4. Modelagem de Dados (`qualimed.sqlite`)

| Tabela | Descrição |
| :--- | :--- |
| `usuarios` | Analistas e gestores, com hash `scrypt` com salt, perfil (`ANALISTA` / `GESTOR`) e status ativo. |
| `setores` | Cadastro dos 115 setores oficiais da MedSênior, diretoria correspondente e analista titular da carteira. |
| `atividades` | Consultorias agendadas, realizadas, reprogramadas ou canceladas, com carga horária, processo, status e aprovação. |
| `diagnosticos` | Indicadores de criticidade operacional por setor (recalculados dinamicamente com base nas atividades). |
| `planos_5w2h` | Planos de ação de melhoria corretiva e preventiva (What, Why, Where, Who, When, How, Status). |
| `logs_auditoria` | Rastreabilidade de ações (login, criação, edição, exclusão e aprovação), IP e timestamp. |

---

## 5. Endpoints da API REST

### Autenticação & Sessão
* `POST /api/auth/login`: Autenticação de Analistas (PIN) ou Gestores (Senha Mestra). Possui proteção por Rate Limiting.
* `GET /api/auth/analysts`: Lista os nomes dos analistas ativos para o seletor de acesso.

### Setores & Carteiras
* `GET /api/setores`: Retorna todos os 115 setores com analista titular e diretoria.
* `GET /api/setores/map`: Mapeamento otimizado de setores por analista.
* `PUT /api/setores/:id`: Atualiza a titularidade do analista responsável pelo setor (requer perfil Gestor).

### Atividades de Consultoria
* `GET /api/atividades`: Lista todas as consultorias com filtros opcionais por mês, processo ou consultor.
* `POST /api/atividades`: Cadastra uma nova atividade. Se o setor for de outro analista, é marcada como `aprovado = 0`.
* `PUT /api/atividades/:id`: Atualiza dados ou status de uma consultoria (Concluído, Reprogramado, Cancelado, Em Andamento).
* `PUT /api/atividades/:id/approve`: Aprova uma atividade agendada fora da carteira do analista (requer perfil Gestor).
* `DELETE /api/atividades/:id`: Remove uma atividade do cronograma (com registro em auditoria).
* `POST /api/atividades/batch-reprogram`: Reprogramação em lote de consultorias.
* `POST /api/atividades/batch-cancel`: Cancelamento em lote com registro do motivo.

### Diagnósticos & 5W2H
* `GET /api/diagnosticos`: Retorna o panorama de pendências e criticidade dos setores.
* `POST /api/diagnosticos/recalculate`: Recalcula o status de criticidade com base nas atividades ativas.
* `GET /api/planos5w2h`: Retorna a lista de planos de ação 5W2H.
* `POST /api/planos5w2h`: Cria um novo plano 5W2H.
* `PUT /api/planos5w2h/:id`: Atualiza dados ou status de um plano 5W2H.
* `DELETE /api/planos5w2h/:id`: Exclui um plano de ação.

### Auditoria e Sincronização
* `GET /api/audit-logs`: Histórico das últimas 100 operações auditadas (restrito a Gestores autenticados).
* `GET /api/database/backup`: Exporta snapshot completo do banco em formato JSON para backup manual.
* `GET /api/sync/stream`: Conexão Server-Sent Events (SSE) para atualização em tempo real.
* `GET /api/sync/status`: Timestamp da última modificação no banco de dados.

---

## 6. Regras de Negócio Chave

1. **Ranking dos Analistas (Produtividade Equilibrada):**
   * O ranking é calibrado na proporção **50% Horas Executadas + 50% Quantidade e Conclusão de Ações**.
   * O Score resultante é normalizado de 0 a 100 pontos.
   * **Privacidade e Governança:** A visualização do Ranking é restrita exclusivamente ao **Modo Gestor**, acessível mediante autenticação com senha mestra. No perfil comum da equipe, a aba de ranking permanece oculta.

2. **Fluxo de Aprovação de Carteira de Setores:**
   * Qualquer analista pode planejar uma consultoria em qualquer setor. No entanto, se o setor pertencer à carteira de outra colega, a atividade entra com status pendente de aprovação, exigindo liberação do Gestor da Qualidade.

3. **Sanitização de Dados:**
   * A base de dados opera estritamente com dados de processos internos e consultorias da Qualidade, não contendo dados de prontuários, saúde, pacientes ou beneficiários, atendendo integralmente às diretrizes da LGPD (Lei 13.709/2018).

---

## 7. Conformidade com as Políticas Internas MedSênior

* **POL.SEG.INS.002 (Política de Segurança da Informação):**
  * Cumprimento do **Item 10.1.6** (bloqueio por força bruta após 5 erros).
  * Trilha de auditoria ativa com IP e data/hora.
* **POL.SEG.INS.019 (Política de Desenvolvimento Seguro):**
  * Imunidade a injeção de código e SQL Injection através de prepared statements.
  * Separação de credenciais através de variáveis de ambiente (`.env`).
  * Não versionamento de segredos via `.gitignore`.
* **POL.SEG.INS.010 (Uso de Inteligência Artificial):**
  * Projeto documentado para submissão à validação formal do time de Vibe Coding / Governança de TI.

# DOSSIÊ TÉCNICO E DE GOVERNANÇA • PLATAFORMA QUALIMED (SIGQ)
**Sistema Integrado de Gestão da Qualidade — MedSênior**
*Documento de Submissão para Homologação e Publicação Interna de Sistemas (TI / Vibe Coding)*

---

## 1. Identificação e Finalidade do Sistema
* **Nome da Aplicação:** QualiMed (SIGQ - Sistema Integrado de Gestão da Qualidade)
* **Público-alvo:** Equipe da Qualidade, Analistas de Processos e Gestão Corporativa MedSênior.
* **Propósito:** Centralizar, padronizar e monitorar em tempo real todas as consultorias de qualidade nos **115 setores oficiais** da MedSênior, integrando o agendamento de visitas técnicas, acompanhamento de notas de campo, registro de desfecho operacional, planos de melhoria estruturados (5W2H) e métricas de criticidade setorial.

### Principais Módulos Operacionais:
1. **Planejamento & Agenda Integrada:** Cronograma de consultorias por analista, processo, carga horária e diretoria, com controle de competência mensal e recorrências.
2. **Minha Pauta:** Visão personalizada de produtividade para o analista executar no dia a dia, com atalhos ágeis de registro de notas e conclusão.
3. **Fluxo Estruturado de Desfecho:** Registro formal do encerramento da consultoria em 3 fluxos:
   * *Concluída:* Registro das melhorias conquistadas e data efetiva realizada.
   * *Reprogramada:* Registro do motivo técnico/operacional e remarcação da nova data.
   * *Cancelada:* Registro da justificativa formal do cancelamento.
4. **Governança de Carteiras e Aprovação de Consultorias:** Regra de negócio que protege a titularidade dos setores. Caso um analista agende uma consultoria em setor sob responsabilidade de outro colega, o agendamento entra automaticamente como "Pendente de Aprovação", exigindo homologação do Gestor da Qualidade.
5. **Planos de Ação 5W2H:** Módulo integrado para elaboração e monitoramento de planos de ação de melhoria corretiva e preventiva.
6. **Diagnósticos Setoriais:** Matriz de criticidade operacional dos setores calculada dinamicamente com base nas consultorias ativas.
7. **Dashboard Executivo e Produtividade:** Métricas em tempo real de horas executadas, conformidade mensal e ranking de produtividade equilibrado (restrito ao perfil Gestor).

---

## 2. Arquitetura e Engenharia de Software

### 2.1 Stack Tecnológica
* **Ambiente de Execução:** Node.js (versões 20+ LTS ou 22 LTS).
* **Framework Web:** Express 5.x — arquitetura RESTful enxuta, modular e de baixo consumo de recursos de CPU/Memória.
* **Mecanismo de Persistência:** SQLite 3 nativo via módulo `node:sqlite` (`DatabaseSync`), integrado à standard library do Node.js.
  * **Zero Dependências Nativas Externas:** Não requer toolchains C++ (`node-gyp`, Python ou compiladores de build) no servidor, garantindo portabilidade imediata tanto em Windows Server (IIS / PowerShell) quanto em ambientes Linux (Docker / Kubernetes / VMs).
  * **Modo WAL (Write-Ahead Logging):** Configurado via `PRAGMA journal_mode = WAL;` e `PRAGMA synchronous = NORMAL;`, permitindo leituras concorrentes em alta velocidade enquanto gravações ocorrem sem bloqueios.
* **Frontend:** Single Page Application (SPA) construída em HTML5 semântico, Tailwind CSS corporativo e Vanilla JavaScript otimizado. Possui script de compilação automatizado (`build.js`) que compila o template mestre para `views/index.html`.
* **Sincronização em Tempo Real:** Mecanismo Server-Sent Events (SSE) via endpoint `/api/sync/stream`, garantindo atualização instantânea de alterações em múltiplos computadores na rede interna sem a complexidade de conexões bidirecionais de WebSockets.

---

## 3. Segurança da Informação e Conformidade Técnica

O desenvolvimento do QualiMed seguiu estritamente as melhores práticas de desenvolvimento seguro (OWASP Top 10) e as diretrizes corporativas da MedSênior:

### 3.1 Proteção contra SQL Injection (SQLi)
* **100% de Consultas Parametrizadas:** Todas as operações com o banco de dados (`database.js`) utilizam *Prepared Statements* nativos (`db.prepare(...).all(...)` e `db.prepare(...).run(...)`).
* Zero concatenação dinâmica de strings na construção de queries, eliminando qualquer vetor de ataque de injeção de SQL.

### 3.2 Proteção contra Cross-Site Scripting (XSS)
* Sanitização centralizada de todas as saídas dinâmicas no frontend através da função utilitária `escapeHtml()`, neutralizando tags maliciosas e scripts injetados.
* Headers HTTP de proteção injetados no Express:
  * `X-Content-Type-Options: nosniff` (prevenção de sniffing de MIME type).
  * `X-Frame-Options: SAMEORIGIN` (prevenção contra ataques de Clickjacking).
  * `X-XSS-Protection: 1; mode=block` (filtro ativo de XSS em navegadores).

### 3.3 Gestão de Credenciais e Hashing de Senhas
* **Algoritmo scrypt:** As senhas dos gestores e PINs de acesso dos analistas são armazenados utilizando o algoritmo `scrypt` nativo de derivação de chaves (`node:crypto`), padrão recomendado para resistência a ataques de força bruta e aceleradores GPU/ASIC.
* **Salt Criptográfico:** Cada credencial possui salt aleatório de 16 bytes gerado criptograficamente e chave derivada de 64 bytes. Nenhuma senha trafega ou é persistida em texto claro.

### 3.4 Controle de Acesso Baseado em Papéis (RBAC)
* Segregação estrita entre perfis:
  * **ANALISTA:** Operação em sua carteira, visualização da pauta, agendamento e apontamento de notas/desfechos.
  * **GESTOR:** Acesso liberado mediante autenticação com senha mestra para aprovação de agendas de terceiros, alteração de titulares de setores, acesso à trilha de auditoria e visualização de dashboards gerenciais restritos.
* Autenticação desacoplada através de tokens JWT (JSON Web Tokens) assinados com HMAC-SHA256, com tempo de expiração programado e segredo isolado em variável de ambiente (`JWT_SECRET`).

### 3.5 Mitigação de Força Bruta (Rate Limiting)
* Middleware de contenção de tentativas de login inválidas em memória:
  * O sistema registra e limita tentativas sucessivas de autenticação por identificador/IP.
  * Bloqueio temporário automático de 15 minutos ao atingir 5 tentativas incorretas consecutivas, em conformidade com o **Item 10.1.6 da POL.SEG.INS.002** da MedSênior.

### 3.6 Trilha de Auditoria (Audit Trail)
* Tabela dedicada `logs_auditoria` que registra persistentemente:
  * Usuário e perfil que executou a operação.
  * Ação realizada (`LOGIN_GESTOR`, `CREATE_ATIVIDADE`, `UPDATE_ATIVIDADE`, `DELETE_ATIVIDADE`, `APROVACAO_GESTOR`, etc.).
  * Entidade e identificador do registro manipulado.
  * Endereço IP do cliente e carimbo de data/hora (timestamp UTC/local).
* Endpoint administrativo `/api/audit-logs` com acesso restrito a gestores autenticados.

### 3.7 Conformidade com a LGPD (Lei 13.709/2018)
* O sistema opera **exclusivamente com metadados internos de governança de processos corporativos** (nome do setor, diretoria, analista, horário de consultoria, metas de melhoria e checklists).
* **Ausência de Dados Sensíveis:** O banco de dados **não** armazena, trafega ou processa prontuários, nomes de pacientes, números de carteirinha, dados de saúde ou informações financeiras de beneficiários.

---

## 4. Guia Rápido de Instalação e Publicação (Time de Sistemas/TI)

O pacote de distribuição compactado para publicação encontra-se no arquivo anexo:
**`QualiMed-SIGQ-Release.zip`** *(aproximadamente 403 KB, pré-higienizado sem pastas temporárias)*.

### Passo 1: Descompactação e Dependências
Descompacte o conteúdo do arquivo no diretório de destino do servidor e execute:
```bash
npm install
```
*(Nota: O projeto utiliza apenas `express` e `cors` como dependências externas, instalando em menos de 10 segundos sem compilação nativa).*

### Passo 2: Configuração de Variáveis de Ambiente
Copie o modelo de ambiente:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / Bash
cp .env.example .env
```
Edite o arquivo `.env` para adequar aos parâmetros do ambiente de produção:
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=definir_chave_secreta_forte_e_aleatoria_aqui
DATABASE_PATH=qualimed.sqlite
ADMIN_DEFAULT_PASSWORD=DefinirSenhaMestraCorporativa2026!
```

### Passo 3: Compilação dos Assets (Build)
```bash
npm run build
```
*(Gera a versão minificada e consolidada da interface em `views/index.html`)*.

### Passo 4: Inicialização da Aplicação
```bash
# Inicialização direta
npm start

# Ou via gerenciador de processos corporativo (PM2)
pm2 start server.js --name "qualimed-sigq"

# Ou configuração como Windows Service via NSSM / IIS Reverse Proxy
```

A aplicação passará a responder na porta configurada (ex: `http://localhost:3000` ou sob o hostname/proxy reverso da MedSênior com terminação HTTPS/TLS).

---

## 5. Solicitação de Publicação e Mensagem de Parceria

> **Prezada Equipe de Sistemas Internos e Vibe Coding,**
> 
> O QualiMed (SIGQ) foi estruturado e refinado para atender com exatidão à rotina operacional e às metas corporativas da Qualidade MedSênior, unindo uma interface moderna e intuitiva a uma engenharia backend robusta, segura e aderente às políticas de segurança da informação da nossa organização.
> 
> A nossa intenção é que vocês possam aproveitar a base de código que desenvolvemos e realizar a homologação e publicação do sistema em nossa infraestrutura interna oficial, para que toda a equipe da Qualidade possa operar diretamente no ambiente publicado corporativo.
> 
> Estou à inteira disposição para qualquer alinhamento técnico, esclarecimento sobre as regras de negócio, homologação conjunta ou ajustes que vocês julgarem pertinentes. Contem comigo no que for necessário!
> 
> **Atenciosamente,**  
> *Abraão Luiz — Equipe da Qualidade MedSênior*

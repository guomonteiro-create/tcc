# Colheita+ — Sistema de Gestão de Produção Agrícola

Site em JavaScript (Node.js + Express) com banco de dados **PostgreSQL**.

## Telas
1. **Página inicial** (`index.html`) — botões **É novo?** → cadastro e **Comece já!** → login.
2. **Cadastro** (`cadastro.html`) — Área de cadastro.
3. **Login** (`login.html`) — Área de Login.
4. **Início** (`home.html`) — pós-login, botão **Iniciar o Sistema**.
5. **Sistema** (`sistema.html`) — **Cadastrar Propriedade** e **Gerenciar Propriedade**.

O botão de perfil (canto superior direito) abre um menu com o nome/e-mail do
usuário logado, atalhos e a opção **Sair**. A fonte usada é a **Exo 2**.

## Pré-requisitos
- [Node.js](https://nodejs.org) 18 ou superior
- [PostgreSQL](https://www.postgresql.org/download/) instalado e rodando

## Passo a passo

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o banco abrindo o arquivo `config.js` e ajustando usuário/senha do
   PostgreSQL (e, se quiser, a porta do site e o segredo da sessão).

3. Crie o banco e as tabelas automaticamente:
   ```bash
   npm run init-db
   ```
   > Isso cria o banco `colheita` (se não existir) e aplica o `db/schema.sql`.
   > Alternativa manual: `psql -U postgres -d colheita -f db/schema.sql`

4. Inicie o servidor:
   ```bash
   npm start
   ```

5. Acesse no navegador: <http://localhost:3000>

## Estrutura
```
server.js            → servidor Express + API (auth e propriedades)
config.js            → configurações (banco, porta, segredo da sessão)
db/
  pool.js            → conexão com o PostgreSQL
  init.js            → cria o banco e aplica o schema (npm run init-db)
  schema.sql         → tabelas (usuarios, propriedades, session)
public/
  index.html         → página inicial
  cadastro.html      → cadastro
  login.html         → login
  home.html          → início (protegida)
  sistema.html       → propriedades (protegida)
  css/style.css      → estilos (fonte Exo 2, cores da marca)
  js/                → scripts das páginas
  assets/            → imagens, logos e fontes Exo 2
```

## Segurança
- Senhas são armazenadas com **hash bcrypt** (nunca em texto puro).
- Sessão de login via cookie assinado (`express-session` + `connect-pg-simple`),
  guardada no próprio PostgreSQL.
- As páginas `home.html` e `sistema.html` exigem login; sem sessão, o usuário é
  redirecionado para a tela de login.
"# tcc" 
"# tcc" 
"# tcc-colheita-mais-old" 

'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const PgSession = require('connect-pg-simple')(session);
const pool = require('./db/pool');
const config = require('./config');

const app = express();
const PORT = config.port || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: config.sessionSecret || 'colheita-mais-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      sameSite: 'lax',
    },
  })
);

// ---------- Helpers ----------
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ erro: 'Não autenticado.' });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ================= AUTENTICAÇÃO =================

// Cadastro
app.post('/api/register', async (req, res) => {
  try {
    let { nome, email, senha, confirmarSenha } = req.body;
    nome = (nome || '').trim();
    email = (email || '').trim().toLowerCase();

    if (!nome || !email || !senha || !confirmarSenha) {
      return res.status(400).json({ erro: 'Preencha todos os campos.' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter ao menos 6 caracteres.' });
    }
    if (senha !== confirmarSenha) {
      return res.status(400).json({ erro: 'As senhas não coincidem.' });
    }

    const existe = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (existe.rowCount > 0) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senhaHash]
    );

    const user = rows[0];
    req.session.userId = user.id;
    req.session.userNome = user.nome;
    return res.status(201).json({ id: user.id, nome: user.nome, email: user.email });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ erro: 'Erro interno ao cadastrar.' });
  }
});

// Login (aceita nome OU e-mail)
app.post('/api/login', async (req, res) => {
  try {
    let { login, senha } = req.body;
    login = (login || '').trim();
    if (!login || !senha) {
      return res.status(400).json({ erro: 'Informe nome/e-mail e senha.' });
    }

    const { rows } = await pool.query(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = $1 OR nome = $2 LIMIT 1',
      [login.toLowerCase(), login]
    );
    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
    }

    req.session.userId = user.id;
    req.session.userNome = user.nome;
    return res.json({ id: user.id, nome: user.nome, email: user.email });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ erro: 'Erro interno ao entrar.' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// Usuário atual
app.get('/api/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ erro: 'Não autenticado.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1',
      [req.session.userId]
    );
    if (rows.length === 0) return res.status(401).json({ erro: 'Não autenticado.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erro no /api/me:', err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ================= PROPRIEDADES =================

// Listar
app.get('/api/propriedades', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM propriedades WHERE usuario_id = $1 ORDER BY criado_em DESC',
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar propriedades:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// Criar
app.post('/api/propriedades', requireAuth, async (req, res) => {
  try {
    let { nome, localizacao, area_ha, cultura, observacoes } = req.body;
    nome = (nome || '').trim();
    if (!nome) return res.status(400).json({ erro: 'O nome da propriedade é obrigatório.' });

    const area = area_ha === '' || area_ha == null ? null : Number(area_ha);
    if (area != null && (Number.isNaN(area) || area < 0)) {
      return res.status(400).json({ erro: 'Área inválida.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO propriedades (usuario_id, nome, localizacao, area_ha, cultura, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.session.userId, nome, localizacao || null, area, cultura || null, observacoes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar propriedade:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// Atualizar
app.put('/api/propriedades/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    let { nome, localizacao, area_ha, cultura, observacoes } = req.body;
    nome = (nome || '').trim();
    if (!nome) return res.status(400).json({ erro: 'O nome da propriedade é obrigatório.' });
    const area = area_ha === '' || area_ha == null ? null : Number(area_ha);

    const { rows } = await pool.query(
      `UPDATE propriedades
         SET nome = $1, localizacao = $2, area_ha = $3, cultura = $4, observacoes = $5
       WHERE id = $6 AND usuario_id = $7 RETURNING *`,
      [nome, localizacao || null, area, cultura || null, observacoes || null, id, req.session.userId]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Propriedade não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar propriedade:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// Excluir
app.delete('/api/propriedades/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query(
      'DELETE FROM propriedades WHERE id = $1 AND usuario_id = $2',
      [id, req.session.userId]
    );
    if (rowCount === 0) return res.status(404).json({ erro: 'Propriedade não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir propriedade:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ================= PÁGINAS =================

// Protege as páginas internas: sem sessão volta para o login.
// Precisa vir ANTES do express.static para interceptar o arquivo.
function pageGuard(req, res, next) {
  if (req.session && req.session.userId) {
    return res.sendFile(path.join(__dirname, 'public', path.basename(req.path)));
  }
  return res.redirect('/login.html');
}
app.get(['/home.html', '/sistema.html'], pageGuard);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Colheita+ rodando em http://localhost:${PORT}`);
});

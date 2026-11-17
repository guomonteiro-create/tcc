'use strict';

// Utilidades compartilhadas por todas as páginas.

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    const msg = (data && data.erro) || 'Ocorreu um erro. Tente novamente.';
    throw new Error(msg);
  }
  return data;
}

async function getUsuarioAtual() {
  try {
    return await api('/api/me');
  } catch (_) {
    return null;
  }
}

// Toast simples
function toast(msg, isError = false) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('err', !!isError);
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

// Controla o menu do botão de perfil (presente no cabeçalho).
async function initProfileMenu() {
  const btn = document.getElementById('profileBtn');
  const menu = document.getElementById('profileMenu');
  if (!btn || !menu) return;

  const user = await getUsuarioAtual();

  if (user) {
    menu.innerHTML = `
      <div class="pm-name">${escapeHtml(user.nome)}</div>
      <div class="pm-email">${escapeHtml(user.email)}</div>
      <a href="/home.html">Página inicial</a>
      <a href="/sistema.html">Gerenciar propriedades</a>
      <button type="button" class="pm-logout" id="logoutBtn">Sair</button>
    `;
  } else {
    menu.innerHTML = `
      <a href="/login.html">Fazer login</a>
      <a href="/cadastro.html">Criar conta</a>
    `;
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
  menu.addEventListener('click', (e) => e.stopPropagation());

  const logout = document.getElementById('logoutBtn');
  if (logout) {
    logout.addEventListener('click', async () => {
      try {
        await api('/api/logout', { method: 'POST' });
        window.location.href = '/index.html';
      } catch (err) {
        toast(err.message, true);
      }
    });
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

document.addEventListener('DOMContentLoaded', initProfileMenu);

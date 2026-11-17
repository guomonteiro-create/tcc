'use strict';

const form = document.getElementById('formLogin');
const msg = document.getElementById('msg');

function showMsg(text, ok = false) {
  msg.textContent = text;
  msg.className = 'form-msg show ' + (ok ? 'ok' : 'error');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'form-msg';

  const login = document.getElementById('login').value.trim();
  const senha = document.getElementById('senha').value;
  const confirmar = document.getElementById('confirmarSenha').value;

  if (!login || !senha) {
    return showMsg('Informe seu nome/e-mail e a senha.');
  }
  // O campo "Confirme sua senha" existe no layout; se preenchido, precisa bater.
  if (confirmar && confirmar !== senha) {
    return showMsg('As senhas não coincidem.');
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ login, senha }),
    });
    window.location.href = '/home.html';
  } catch (err) {
    showMsg(err.message);
    btn.disabled = false;
  }
});

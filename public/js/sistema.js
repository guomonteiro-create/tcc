'use strict';

const modalForm = document.getElementById('modalForm');
const modalList = document.getElementById('modalList');
const formProp = document.getElementById('formProp');
const propMsg = document.getElementById('propMsg');
const propList = document.getElementById('propList');
const modalFormTitle = document.getElementById('modalFormTitle');

function openModal(el) { el.classList.add('open'); }
function closeModal(el) { el.classList.remove('open'); }

// Fecha ao clicar no X, no "Cancelar" ou fora do modal.
document.querySelectorAll('[data-close]').forEach((b) =>
  b.addEventListener('click', () => {
    closeModal(modalForm);
    closeModal(modalList);
  })
);
[modalForm, modalList].forEach((ov) =>
  ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(ov); })
);

function resetForm() {
  formProp.reset();
  document.getElementById('propId').value = '';
  propMsg.className = 'form-msg';
  modalFormTitle.textContent = 'Cadastrar Propriedade';
  document.getElementById('propSubmit').textContent = 'Salvar';
}

// ---- Cadastrar ----
document.getElementById('btnCadastrar').addEventListener('click', () => {
  resetForm();
  openModal(modalForm);
});

// ---- Gerenciar ----
document.getElementById('btnGerenciar').addEventListener('click', async () => {
  await carregarLista();
  openModal(modalList);
});

// ---- Salvar (criar/editar) ----
formProp.addEventListener('submit', async (e) => {
  e.preventDefault();
  propMsg.className = 'form-msg';

  const id = document.getElementById('propId').value;
  const payload = {
    nome: document.getElementById('propNome').value.trim(),
    localizacao: document.getElementById('propLocal').value.trim(),
    area_ha: document.getElementById('propArea').value,
    cultura: document.getElementById('propCultura').value.trim(),
    observacoes: document.getElementById('propObs').value.trim(),
  };
  if (!payload.nome) {
    propMsg.textContent = 'O nome da propriedade é obrigatório.';
    propMsg.className = 'form-msg show error';
    return;
  }

  try {
    if (id) {
      await api('/api/propriedades/' + id, { method: 'PUT', body: JSON.stringify(payload) });
      toast('Propriedade atualizada!');
    } else {
      await api('/api/propriedades', { method: 'POST', body: JSON.stringify(payload) });
      toast('Propriedade cadastrada!');
    }
    closeModal(modalForm);
    if (modalList.classList.contains('open')) await carregarLista();
  } catch (err) {
    propMsg.textContent = err.message;
    propMsg.className = 'form-msg show error';
  }
});

// ---- Lista ----
async function carregarLista() {
  propList.innerHTML = '<div class="prop-empty">Carregando...</div>';
  try {
    const props = await api('/api/propriedades');
    if (!props.length) {
      propList.innerHTML = '<div class="prop-empty">Nenhuma propriedade cadastrada ainda.<br>Clique em “Cadastrar Propriedade” para começar.</div>';
      return;
    }
    propList.innerHTML = props.map(renderItem).join('');
    bindItemActions(props);
  } catch (err) {
    propList.innerHTML = `<div class="prop-empty">${escapeHtml(err.message)}</div>`;
  }
}

function renderItem(p) {
  const rows = [];
  if (p.localizacao) rows.push(['Localização', escapeHtml(p.localizacao)]);
  if (p.area_ha != null) rows.push(['Área', Number(p.area_ha).toLocaleString('pt-BR') + ' ha']);
  if (p.cultura) rows.push(['Cultura', escapeHtml(p.cultura)]);
  if (p.observacoes) rows.push(['Observações', escapeHtml(p.observacoes)]);

  const meta = rows.length
    ? '<dl class="prop-meta">' +
        rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') +
      '</dl>'
    : '<p class="prop-meta-empty">Sem detalhes adicionais.</p>';

  return `
    <div class="prop-item" data-id="${p.id}">
      <div class="prop-info">
        <h4>${escapeHtml(p.nome)}</h4>
        ${meta}
      </div>
      <div class="actions">
        <button class="icon-btn" data-edit="${p.id}">Editar</button>
        <button class="icon-btn danger" data-del="${p.id}">Excluir</button>
      </div>
    </div>`;
}

function bindItemActions(props) {
  propList.querySelectorAll('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const p = props.find((x) => String(x.id) === b.dataset.edit);
      if (!p) return;
      resetForm();
      modalFormTitle.textContent = 'Editar Propriedade';
      document.getElementById('propSubmit').textContent = 'Atualizar';
      document.getElementById('propId').value = p.id;
      document.getElementById('propNome').value = p.nome || '';
      document.getElementById('propLocal').value = p.localizacao || '';
      document.getElementById('propArea').value = p.area_ha != null ? p.area_ha : '';
      document.getElementById('propCultura').value = p.cultura || '';
      document.getElementById('propObs').value = p.observacoes || '';
      openModal(modalForm);
    })
  );

  propList.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm('Deseja realmente excluir esta propriedade?')) return;
      try {
        await api('/api/propriedades/' + b.dataset.del, { method: 'DELETE' });
        toast('Propriedade excluída!');
        await carregarLista();
      } catch (err) {
        toast(err.message, true);
      }
    })
  );
}

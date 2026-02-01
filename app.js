// === Данные ===
let competitors = JSON.parse(localStorage.getItem('competitors')) || [];
let templates = JSON.parse(localStorage.getItem('templates')) || [];

// === DOM ===
const competitorForm = document.getElementById('competitorForm');
const templateForm = document.getElementById('templateForm');
const competitorsListEl = document.getElementById('competitorsList');
const templatesListEl = document.getElementById('templatesList');
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('exportBtn');
const copyTableBtn = document.getElementById('copyTableBtn');
const clearBtn = document.getElementById('clearBtn');

// === Фильтры ===
let filterCategory = '';
let filterDevice = '';

// === Рендер списка конкурентов ===
function renderCompetitors() {
  const filtered = competitors.filter(item => {
    const catMatch = !filterCategory || item.category === filterCategory;
    const devMatch = !filterDevice || 
      (item.deviceType || '').toLowerCase().includes(filterDevice.toLowerCase());
    return catMatch && devMatch;
  });

  countEl.textContent = filtered.length;
  competitorsListEl.innerHTML = '';

  if (filtered.length === 0) {
    competitorsListEl.innerHTML = '<p style="padding: 16px; color: #888;">Нет записей. Добавьте первого конкурента!</p>';
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'competitor-card';
    const categoryLabel = item.category === 'продажа' ? '🛍️ Продажа' : '🔧 Ремонт';
    card.innerHTML = `
      <h3>${categoryLabel} — ${item.title} — ${item.price} ₽</h3>
      <p><strong>Устройство:</strong> ${item.deviceType || '—'}</p>
      <p><strong>Город:</strong> ${item.city || '—'}</p>
      ${item.avitoUrl ? `<p><a href="${item.avitoUrl}" target="_blank">🔗 Открыть на Avito</a></p>` : ''}
      ${item.notes ? `<p class="notes">${item.notes}</p>` : ''}
    `;
    competitorsListEl.appendChild(card);
  });
}

// === Рендер шаблонов ===
function renderTemplates() {
  if (!templatesListEl) return;
  templatesListEl.innerHTML = '';

  templates.forEach((tpl, index) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <h4>${tpl.title}</h4>
      <p>${tpl.text}</p>
      <div class="template-actions">
        <button onclick="copyTemplate(${index})">📋 Копировать</button>
        <button onclick="deleteTemplate(${index})" style="background:#e74c3c;">🗑️ Удалить</button>
      </div>
    `;
    templatesListEl.appendChild(card);
  });
}

// === Глобальные функции для кнопок ===
window.copyTemplate = function(index) {
  navigator.clipboard.writeText(templates[index].text).then(() => {
    alert('Текст шаблона скопирован!');
  }).catch(() => alert('Не удалось скопировать'));
};

window.deleteTemplate = function(index) {
  if (confirm('Удалить шаблон?')) {
    templates.splice(index, 1);
    localStorage.setItem('templates', JSON.stringify(templates));
    renderTemplates();
  }
};

// === Обработчики форм ===
if (competitorForm) {
  competitorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const category = document.getElementById('category').value;
    const deviceType = document.getElementById('deviceType').value.trim();
    const avitoUrl = document.getElementById('avitoUrl').value.trim();
    const title = document.getElementById('title').value.trim();
    const price = parseInt(document.getElementById('price').value) || 0;
    const city = document.getElementById('city').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!category || !title || price <= 0) {
      alert('Заполните обязательные поля: тип, название и цену!');
      return;
    }

    competitors.push({
      category,
      deviceType,
      avitoUrl,
      title,
      price,
      city,
      notes,
      date: new Date().toISOString()
    });

    localStorage.setItem('competitors', JSON.stringify(competitors));
    renderCompetitors();
    competitorForm.reset();
    document.getElementById('category').value = '';
  });
}

if (templateForm) {
  templateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('templateTitle').value.trim();
    const text = document.getElementById('templateText').value.trim();
    if (title && text) {
      templates.push({ title, text });
      localStorage.setItem('templates', JSON.stringify(templates));
      renderTemplates();
      templateForm.reset();
    }
  });
}

// === Экспорт и копирование ===
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    if (competitors.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    let csv = 'Тип;Устройство;Название;Цена;Город;Ссылка;Заметки;Дата\n';
    competitors.forEach(item => {
      const row = [
        `"${item.category}"`,
        `"${(item.deviceType || '').replace(/"/g, '""')}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        item.price,
        `"${(item.city || '').replace(/"/g, '""')}"`,
        `"${(item.avitoUrl || '').replace(/"/g, '""')}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        new Date(item.date).toLocaleString('ru-RU')
      ].join(';');
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'avito-competitors.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (copyTableBtn) {
  copyTableBtn.addEventListener('click', () => {
    if (competitors.length === 0) {
      alert('Нет данных');
      return;
    }

    let table = 'Тип\tУстройство\tНазвание\tЦена\tГород\n';
    competitors.forEach(item => {
      table += `${item.category}\t${item.deviceType || ''}\t${item.title}\t${item.price}\t${item.city || ''}\n`;
    });

    navigator.clipboard.writeText(table).then(() => {
      alert('Таблица скопирована! Вставьте в Excel, Telegram или WhatsApp.');
    }).catch(() => alert('Не удалось скопировать'));
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (confirm('Очистить весь список конкурентов? Это нельзя отменить.')) {
      competitors = [];
      localStorage.removeItem('competitors');
      renderCompetitors();
    }
  });
}

// === Фильтры (динамически добавляем) ===
const filterSection = document.createElement('div');
filterSection.className = 'filter-section';
filterSection.innerHTML = `
  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
    <select id="filterCategory">
      <option value="">Все типы</option>
      <option value="продажа">Продажа</option>
      <option value="ремонт">Ремонт</option>
    </select>
    <input type="text" id="filterDevice" placeholder="Фильтр по устройству..." style="flex: 1; min-width: 150px;" />
  </div>
`;

// Вставляем фильтры над списком
const listSection = document.querySelector('.list-section');
if (listSection) {
  listSection.insertBefore(filterSection, listSection.querySelector('.controls').nextElementSibling);
}

document.getElementById('filterCategory').addEventListener('change', (e) => {
  filterCategory = e.target.value;
  renderCompetitors();
});

document.getElementById('filterDevice').addEventListener('input', (e) => {
  filterDevice = e.target.value;
  renderCompetitors();
});

// === Инициализация ===
renderCompetitors();
renderTemplates();
document.getElementById('category')?.focus();

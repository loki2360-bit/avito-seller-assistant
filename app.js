let competitors = JSON.parse(localStorage.getItem('competitors')) || [];

const form = document.getElementById('competitorForm');
const listEl = document.getElementById('competitorsList');
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

// Фильтры
let filterCategory = '';
let filterDevice = '';

// Рендер списка с фильтрацией
function renderList() {
  const filtered = competitors.filter(item => {
    const catMatch = !filterCategory || item.category === filterCategory;
    const devMatch = !filterDevice || 
      (item.deviceType || '').toLowerCase().includes(filterDevice.toLowerCase());
    return catMatch && devMatch;
  });

  countEl.textContent = filtered.length;
  listEl.innerHTML = '';

  if (filtered.length === 0) {
    listEl.innerHTML = '<p style="padding: 16px; color: #888;">Нет записей</p>';
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
    listEl.appendChild(card);
  });
}

// Сохранение
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const deviceType = document.getElementById('deviceType').value.trim();
  const avitoUrl = document.getElementById('avitoUrl').value.trim();
  const title = document.getElementById('title').value.trim();
  const price = parseInt(document.getElementById('price').value);
  const city = document.getElementById('city').value.trim();
  const notes = document.getElementById('notes').value.trim();

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
  renderList();
  form.reset();
  document.getElementById('category').value = ''; // сброс select
});

// Экспорт в CSV (обновлён)
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

// Очистка
clearBtn.addEventListener('click', () => {
  if (confirm('Очистить весь список? Это нельзя отменить.')) {
    competitors = [];
    localStorage.removeItem('competitors');
    renderList();
  }
});

// === ФИЛЬТРАЦИЯ ===
const filterSection = document.createElement('div');
filterSection.className = 'filter-section';
filterSection.innerHTML = `
  <div style="margin: 16px 0; display: flex; gap: 10px; flex-wrap: wrap;">
    <select id="filterCategory">
      <option value="">Все типы</option>
      <option value="продажа">Продажа</option>
      <option value="ремонт">Ремонт</option>
    </select>
    <input type="text" id="filterDevice" placeholder="Фильтр по устройству..." style="flex: 1; min-width: 150px; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" />
  </div>
`;
document.querySelector('.list-section .controls').parentNode.insertBefore(filterSection, document.querySelector('.list-section .controls'));

document.getElementById('filterCategory').addEventListener('change', (e) => {
  filterCategory = e.target.value;
  renderList();
});

document.getElementById('filterDevice').addEventListener('input', (e) => {
  filterDevice = e.target.value;
  renderList();
});

// Инициализация
renderList();

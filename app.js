// Хранилище данных
let competitors = JSON.parse(localStorage.getItem('competitors')) || [];

// DOM элементы
const form = document.getElementById('competitorForm');
const listEl = document.getElementById('competitorsList');
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

// Обновление списка
function renderList() {
  countEl.textContent = competitors.length;
  listEl.innerHTML = '';

  competitors.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'competitor-card';
    card.innerHTML = `
      <h3>${item.title} — ${item.price} ₽</h3>
      <p><strong>Город:</strong> ${item.city || '—'}</p>
      ${item.avitoUrl ? `<p><a href="${item.avitoUrl}" target="_blank">🔗 Открыть на Avito</a></p>` : ''}
      ${item.notes ? `<p class="notes">${item.notes}</p>` : ''}
    `;
    listEl.appendChild(card);
  });
}

// Сохранение формы
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const avitoUrl = document.getElementById('avitoUrl').value.trim();
  const title = document.getElementById('title').value.trim();
  const price = parseInt(document.getElementById('price').value);
  const city = document.getElementById('city').value.trim();
  const notes = document.getElementById('notes').value.trim();

  competitors.push({ avitoUrl, title, price, city, notes, date: new Date().toISOString() });
  localStorage.setItem('competitors', JSON.stringify(competitors));
  renderList();
  form.reset();
});

// Экспорт в CSV
exportBtn.addEventListener('click', () => {
  if (competitors.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  let csv = 'Название;Цена;Город;Ссылка;Заметки;Дата\n';
  competitors.forEach(item => {
    const row = [
      `"${item.title.replace(/"/g, '""')}"`,
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
  if (confirm('Очистить весь список конкурентов? Это действие нельзя отменить.')) {
    competitors = [];
    localStorage.removeItem('competitors');
    renderList();
  }
});

// Инициализация
renderList();

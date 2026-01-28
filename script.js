// === ПРОСТОЙ И БЕЗОПАСНЫЙ СКРИПТ — НИКАКИХ return ВНЕ ФУНКЦИЙ! ===

document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('search-input');
  const orderNumberInput = document.getElementById('order-number');
  const itemTypeSelect = document.getElementById('item-type');
  const workstationSelect = document.getElementById('workstation');
  const createBtn = document.getElementById('create-btn');
  const itemsList = document.getElementById('items-list');

  // --- Тестовая логика (без Supabase) — чтобы кнопка работала СЕЙЧАС ---
  let counter = 0;

  createBtn.addEventListener('click', function () {
    const order = (orderNumberInput.value || '').trim();
    const type = itemTypeSelect.value;
    const ws = workstationSelect.value;

    if (!order) {
      alert('❗ Введите номер заказа');
      return; // ← это OK: внутри функции
    }

    counter++;
    const id = 'local-' + counter;

    const itemEl = document.createElement('div');
    itemEl.className = 'item-row';
    itemEl.dataset.id = id;
    itemEl.innerHTML = `
      <div>
        <strong>${order}</strong>
        <div class="item-type">${type}</div>
      </div>
      <select onchange="updateWorkstation('${id}', this.value)">
        <option value="распил" ${ws === 'распил' ? 'selected' : ''}>распил</option>
        <option value="чпу" ${ws === 'чпу' ? 'selected' : ''}>чпу</option>
        <option value="фанеровка" ${ws === 'фанеровка' ? 'selected' : ''}>фанеровка</option>
        <option value="шлифовка" ${ws === 'шлифовка' ? 'selected' : ''}>шлифовка</option>
        <option value="сборка" ${ws === 'сборка' ? 'selected' : ''}>сборка</option>
        <option value="покраска" ${ws === 'покраска' ? 'selected' : ''}>покраска</option>
        <option value="пвх" ${ws === 'пвх' ? 'selected' : ''}>пвх</option>
        <option value="упаковка" ${ws === 'упаковка' ? 'selected' : ''}>упаковка</option>
      </select>
    `;
    itemsList.appendChild(itemEl);

    // Очищаем тип и участок, оставляем номер
    itemTypeSelect.value = 'наружняя панель';
    workstationSelect.value = 'распил';

    console.log(`✅ Создана локальная позиция: ${order} → ${type} (${ws})`);
  });

  // Глобальная функция для перемещения (работает даже без Supabase)
  window.updateWorkstation = function (id, newWs) {
    const el = document.querySelector(`[data-id="${id}"] select`);
    if (el) {
      el.previousElementSibling.textContent = newWs; // упрощённо
      console.log(`🔄 Перемещено: ${id} → ${newWs}`);
    }
  };

  // Поиск (пока только заглушка)
  searchInput.addEventListener('input', function () {
    console.log('Поиск:', searchInput.value);
  });

  console.log('✅ Локальный режим активен. Кнопка "+" должна работать.');
});

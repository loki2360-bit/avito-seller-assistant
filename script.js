document.addEventListener('DOMContentLoaded', function () {
  const createBtn = document.getElementById('create-btn');
  const itemsList = document.getElementById('items-list');
  const orderInput = document.getElementById('order-number');
  const typeSelect = document.getElementById('item-type');
  const wsSelect = document.getElementById('workstation');

  if (!createBtn) {
    console.error('Кнопка #create-btn не найдена');
    return;
  }

  createBtn.addEventListener('click', function () {
    const order = (orderInput.value || '').trim();
    const type = typeSelect.value;
    const ws = wsSelect.value;

    if (!order) {
      alert('Введите номер заказа');
      return; // ← разрешено: внутри функции
    }

    const item = document.createElement('div');
    item.className = 'item-row';
    item.innerHTML = `
      <div>
        <strong>${order}</strong>
        <div class="item-type">${type}</div>
      </div>
      <select onchange="updateWorkstation(this)">
        <option value="распил">распил</option>
        <option value="чпу">чпу</option>
        <option value="фанеровка">фанеровка</option>
        <option value="шлифовка">шлифовка</option>
        <option value="сборка">сборка</option>
        <option value="покраска">покраска</option>
        <option value="пвх">пвх</option>
        <option value="упаковка">упаковка</option>
      </select>
    `;
    itemsList.appendChild(item);

    // Сброс типов, номер оставляем
    typeSelect.value = 'наружняя панель';
    wsSelect.value = 'распил';

    console.log(`✅ Создано: ${order} | ${type} → ${ws}`);
  });

  window.updateWorkstation = function (select) {
    const row = select.closest('.item-row');
    if (row) {
      const strong = row.querySelector('strong');
      const newWs = select.value;
      strong.textContent += ` (${newWs})`; // простая визуализация
      console.log('Перемещено:', newWs);
    }
  };

  console.log('✅ Интерфейс загружен. Кнопка + готова.');
});

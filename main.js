// === Инициализация данных ===
let stations = JSON.parse(localStorage.getItem('stations')) || [
  "Распил", "ЧПУ", "Покраска", "Фрезеровка",
  "Шпонировка", "Сборка", "Упаковка"
];

let orders = JSON.parse(localStorage.getItem('orders')) || [];
let currentStation = localStorage.getItem('currentStation') || stations[0];

// === Сохранение ===
function saveData() {
  localStorage.setItem('stations', JSON.stringify(stations));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('currentStation', currentStation);
}

// === DOM ===
const stationsList = document.getElementById('stations-list');
const ordersContainer = document.getElementById('orders-container');
const orderInput = document.getElementById('order-input');
const addOrderBtn = document.getElementById('add-order');
const searchInput = document.getElementById('search-input');
const adminBtn = document.getElementById('admin-btn');

// === Рендер участков с счётчиками (только активные: не закрытые) ===
function renderStations() {
  const activeOrders = orders.filter(o => o.status !== 'Закрыт');
  const counts = {};
  stations.forEach(s => counts[s] = 0);
  activeOrders.forEach(o => {
    if (counts.hasOwnProperty(o.currentStation)) {
      counts[o.currentStation]++;
    }
  });

  stationsList.innerHTML = '';
  stations.forEach(station => {
    const li = document.createElement('li');
    li.textContent = `${station} (${counts[station]})`;
    li.classList.toggle('active', station === currentStation);
    li.addEventListener('click', () => {
      currentStation = station;
      saveData();
      renderStations();
      loadOrders();
    });
    stationsList.appendChild(li);
  });
}

// === Загрузка ВСЕХ заказов (включая закрытые) для текущего участка ===
function loadOrders(searchTerm = null) {
  ordersContainer.innerHTML = '';

  let filtered = orders.filter(order => {
    if (searchTerm) {
      return order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return order.currentStation === currentStation;
    }
  });

  if (filtered.length === 0) {
    ordersContainer.innerHTML = searchTerm ? '<p>Не найдено</p>' : '<p>Нет задач</p>';
    return;
  }

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  filtered.forEach((order, index) => {
    const card = document.createElement('div');
    card.className = 'order-card';

    // Статус с пометкой
    let statusText = order.status;
    if (order.status === 'Закрыт') {
      statusText = '❌ Закрыт';
    }

    // Выпадающий список статусов (если не закрыт)
    let statusSelect = '';
    if (!searchTerm && order.status !== 'Закрыт') {
      const options = ['Принят в работу', 'В работе', 'Готов', 'Закрыт'].map(s => 
        `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`
      ).join('');

      statusSelect = `
        <select onchange="updateStatus(${index}, this.value)" style="margin-left: 8px;">
          ${options}
        </select>
      `;
    }

    // Кнопка переместить (если не закрыт)
    let moveButton = '';
    if (!searchTerm && order.status !== 'Закрыт') {
      moveButton = `<button onclick="showMoveDialog(${index})">Переместить</button>`;
    }

    card.innerHTML = `
      <div class="order-id">#${order.orderId} (${statusText})</div>
      <div class="status-buttons">
        ${moveButton}
        ${statusSelect}
      </div>
    `;
    ordersContainer.appendChild(card);
  });
}

// === Добавление заказа — по умолчанию "Принят в работу" ===
addOrderBtn.addEventListener('click', () => {
  const orderId = orderInput.value.trim();
  if (!orderId) return alert('Введите номер заказа');
  if (orders.some(o => o.orderId === orderId)) return alert('Такой заказ уже есть');

  orders.push({
    orderId,
    currentStation: stations[0],
    status: 'Принят в работу', // ← изменили!
    createdAt: new Date().toISOString()
  });

  saveData();
  orderInput.value = '';
  if (currentStation === stations[0]) loadOrders();
  renderStations();
});

// === Поиск ===
searchInput.addEventListener('input', (e) => {
  loadOrders(e.target.value.trim());
});

// === Обновить статус заказа ===
window.updateStatus = (index, newStatus) => {
  orders[index].status = newStatus;
  saveData();
  renderStations(); // пересчитаем счётчики
  loadOrders();     // обновим отображение
};

// === Показать диалог перемещения с выпадающим списком ===
window.showMoveDialog = (index) => {
  const modal = document.createElement('div');
  modal.id = 'move-modal';
  modal.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); z-index: 2000;
    display: flex; justify-content: center; align-items: center;
  `;

  let options = stations.map(s => 
    `<option value="${s}" ${s === orders[index].currentStation ? 'selected' : ''}>${s}</option>`
  ).join('');

  modal.innerHTML = `
    <div style="background: white; padding: 20px; color: black; max-width: 300px; width: 90%;">
      <h4>Переместить заказ #${orders[index].orderId}</h4>
      <select id="move-select" style="width: 100%; margin: 10px 0;">${options}</select>
      <div>
        <button onclick="confirmMove(${index})" style="margin-right: 10px;">OK</button>
        <button onclick="closeMoveDialog()">Отмена</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
};

// === Подтвердить перемещение ===
window.confirmMove = (index) => {
  const select = document.getElementById('move-select');
  const newStation = select.value;
  orders[index].currentStation = newStation;
  // Не меняем статус при перемещении — оставляем как есть
  saveData();
  closeMoveDialog();
  renderStations();
  loadOrders();
};

// === Закрыть модальное окно ===
window.closeMoveDialog = () => {
  const modal = document.getElementById('move-modal');
  if (modal) modal.remove();
};

// === Админка (без изменений) ===
adminBtn.addEventListener('click', () => {
  const pass = prompt('Админ-пароль:');
  if (pass !== 'admin123') {
    alert('Неверный пароль');
    return;
  }

  const adminPanel = document.createElement('div');
  adminPanel.id = 'admin-panel';
  adminPanel.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.7); z-index: 1000; padding: 20px;
    display: flex; justify-content: center; align-items: center;
  `;

  let stationsHtml = stations.map(s => 
    `<div>${s} <button onclick="deleteStation('${s}')">✕</button></div>`
  ).join('');

  adminPanel.innerHTML = `
    <div style="background: white; padding: 20px; color: black; max-width: 500px; width: 90%;">
      <h3>Админ-панель</h3>
      
      <h4>Участки</h4>
      <div id="admin-stations">${stationsHtml}</div>
      <input type="text" id="new-station" placeholder="Новый участок" />
      <button onclick="addStation()">Добавить</button>

      <h4 style="margin-top: 20px;">Заказы</h4>
      <div id="admin-orders"></div>

      <button onclick="document.body.removeChild(document.getElementById('admin-panel'))" 
              style="margin-top: 20px;">Закрыть</button>
    </div>
  `;

  const ordersHtml = orders.map((o, i) => 
    `<div>#${o.orderId} (${o.currentStation}) — ${o.status} 
       <button onclick="deleteOrder(${i})">Удалить</button>
     </div>`
  ).join('');
  adminPanel.querySelector('#admin-orders').innerHTML = ordersHtml || '<p>Нет заказов</p>';

  document.body.appendChild(adminPanel);
});

// === Функции админки ===
window.addStation = () => {
  const input = document.getElementById('new-station');
  const name = input.value.trim();
  if (!name) return;
  if (stations.includes(name)) return alert('Участок уже существует');
  stations.push(name);
  saveData();
  location.reload();
};

window.deleteStation = (name) => {
  if (stations.length <= 1) return alert('Нужен хотя бы один участок');
  if (!confirm(`Удалить участок "${name}"?`)) return;
  stations = stations.filter(s => s !== name);
  if (!stations.includes(currentStation)) currentStation = stations[0];
  saveData();
  location.reload();
};

window.deleteOrder = (index) => {
  if (confirm(`Удалить заказ #${orders[index].orderId}?`)) {
    orders.splice(index, 1);
    saveData();
    location.reload();
  }
};

// === Инициализация ===
renderStations();
loadOrders();

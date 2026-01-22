// === Хранилище данных ===
let stations = JSON.parse(localStorage.getItem('stations')) || [
  "Распил", "ЧПУ", "Покраска", "Фрезеровка",
  "Шпонировка", "Сборка", "Упаковка"
];

let orders = JSON.parse(localStorage.getItem('orders')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];

// Создаём первого пользователя по умолчанию
if (users.length === 0) {
  users.push({ username: 'оператор', password: '12345' });
  localStorage.setItem('users', JSON.stringify(users));
}

let currentUser = null;
let currentStation = stations[0];

// === Сохранение ===
function saveData() {
  localStorage.setItem('stations', JSON.stringify(stations));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('users', JSON.stringify(users));
}

// === Генерация уникального ID ===
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// === DOM ===
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminBtn = document.getElementById('admin-btn');
const currentUserEl = document.getElementById('current-user');

// === Проверка автоматического входа ===
function checkAutoLogin() {
  try {
    const saved = localStorage.getItem('currentUser');
    if (!saved) {
      loginScreen.style.display = 'flex';
      return;
    }

    const savedUser = JSON.parse(saved);
    const found = users.find(u =>
      u.username === savedUser.username &&
      u.password === savedUser.password
    );

    if (found) {
      currentUser = found;
      showApp();
    } else {
      // Неверные данные — очищаем
      localStorage.removeItem('currentUser');
      loginScreen.style.display = 'flex';
    }
  } catch (e) {
    console.error('Ошибка входа:', e);
    loginScreen.style.display = 'flex';
  }
}

// === Вход ===
loginBtn.addEventListener('click', () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    loginError.style.display = 'none';
    showApp();
  } else {
    loginError.textContent = 'Неверное имя или пароль';
    loginError.style.display = 'block';
  }
});

// === Выход ===
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
  app.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginUsername.value = '';
  loginPassword.value = '';
});

// === Показать основное приложение ===
function showApp() {
  loginScreen.style.display = 'none';
  app.style.display = 'block';
  currentUserEl.textContent = `Привет, ${currentUser.username}`;
  renderStations();
  loadOrders();
}

// === Рендер участков ===
function renderStations() {
  const counts = {};
  stations.forEach(s => counts[s] = 0);
  orders.forEach(o => {
    if (counts.hasOwnProperty(o.station)) counts[o.station]++;
  });

  const list = document.getElementById('stations-list');
  list.innerHTML = '';
  stations.forEach(station => {
    const li = document.createElement('li');
    li.textContent = `${station} (${counts[station]})`;
    li.classList.toggle('active', station === currentStation);
    li.addEventListener('click', () => {
      currentStation = station;
      renderStations();
      loadOrders();
    });
    list.appendChild(li);
  });
}

// === Загрузка заказов ===
function loadOrders(searchTerm = null) {
  const container = document.getElementById('orders-container');
  container.innerHTML = '';

  let filtered = orders.filter(order => {
    if (searchTerm) {
      return order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return order.station === currentStation;
    }
  });

  if (filtered.length === 0) {
    container.innerHTML = searchTerm ? '<p>Не найдено</p>' : '<p>Нет задач</p>';
    return;
  }

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  filtered.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';

    card.innerHTML = `
      <div class="order-id">#${order.orderId}</div>
      <div class="status-buttons">
        <button onclick="showMoveDialog('${order.id}')">Переместить</button>
        <button onclick="closeOrder('${order.id}')">Закрыть</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// === Добавление заказа ===
document.getElementById('add-order').addEventListener('click', () => {
  const orderId = document.getElementById('order-input').value.trim();
  if (!orderId) return alert('Введите номер заказа');
  if (orders.some(o => o.orderId === orderId)) return alert('Такой заказ уже есть');

  orders.push({
    id: generateId(),
    orderId,
    station: stations[0],
    createdAt: new Date().toISOString()
  });

  saveData();
  document.getElementById('order-input').value = '';
  if (currentStation === stations[0]) loadOrders();
  renderStations();
});

// === Поиск ===
document.getElementById('search-input').addEventListener('input', (e) => {
  loadOrders(e.target.value.trim());
});

// === Переместить заказ ===
window.showMoveDialog = (orderId) => {
  const id = String(orderId);
  const order = orders.find(o => o.id === id);
  if (!order) return alert('Заказ не найден');

  const modal = document.createElement('div');
  modal.id = 'move-modal';
  modal.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); z-index: 2000;
    display: flex; justify-content: center; align-items: center;
  `;

  let options = stations.map(s => 
    `<option value="${s}" ${s === order.station ? 'selected' : ''}>${s}</option>`
  ).join('');

  modal.innerHTML = `
    <div style="background: white; padding: 20px; color: black; max-width: 300px; width: 90%;">
      <h4>Переместить #${order.orderId}</h4>
      <select id="move-select" style="width: 100%; margin: 10px 0;">${options}</select>
      <div>
        <button onclick="confirmMove('${id}')" style="margin-right: 10px;">OK</button>
        <button onclick="closeMoveDialog()">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.confirmMove = (orderId) => {
  const select = document.getElementById('move-select');
  const id = String(orderId);
  const order = orders.find(o => o.id === id);
  if (order) {
    order.station = select.value;
    saveData();
  }
  closeMoveDialog();
  renderStations();
  loadOrders();
};

window.closeMoveDialog = () => {
  const el = document.getElementById('move-modal');
  if (el) el.remove();
};

// === Закрыть заказ ===
window.closeOrder = (orderId) => {
  const id = String(orderId);
  const order = orders.find(o => o.id === id);
  if (!order) return;

  if (confirm(`Закрыть заказ #${order.orderId}?`)) {
    orders = orders.filter(o => o.id !== id);
    saveData();
    renderStations();
    loadOrders();
  }
};

// === Админка ===
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

      <h4 style="margin-top: 20px;">Пользователи</h4>
      <div id="admin-users"></div>

      <button onclick="document.body.removeChild(document.getElementById('admin-panel'))" 
              style="margin-top: 20px;">Закрыть</button>
    </div>
  `;

  // Заказы
  const ordersHtml = orders.map(o => 
    `<div>#${o.orderId} (${o.station}) 
       <button onclick="deleteOrder('${o.id}')">Удалить</button>
     </div>`
  ).join('');
  adminPanel.querySelector('#admin-orders').innerHTML = ordersHtml || '<p>Нет заказов</p>';

  // Пользователи
  const usersHtml = users.map(u => 
    `<div>${u.username} 
       <button onclick="deleteUser('${u.username}')">✕</button>
     </div>`
  ).join('');
  adminPanel.querySelector('#admin-users').innerHTML = usersHtml || '<p>Нет пользователей</p>';

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

window.deleteOrder = (orderId) => {
  const id = String(orderId);
  const order = orders.find(o => o.id === id);
  if (!order) return alert('Заказ не найден');
  if (confirm(`Удалить заказ #${order.orderId}?`)) {
    orders = orders.filter(o => o.id !== id);
    saveData();
    location.reload();
  }
};

window.deleteUser = (username) => {
  if (users.length <= 1) return alert('Нужен хотя бы один пользователь');
  if (!confirm(`Удалить пользователя "${username}"?`)) return;
  users = users.filter(u => u.username !== username);
  saveData();
  location.reload();
};

// === Запуск ===
checkAutoLogin();

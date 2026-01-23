// === Supabase config ===
const SUPABASE_URL = 'https://zitdekerfjocbulmfuyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_41ROEqZ74QbA4B6_JASt4w_DeRDGXWR';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentStation = '';

// === DOM элементы ===
const stationsList = document.getElementById('stations-list');
const ordersContainer = document.getElementById('orders-container');
const orderInput = document.getElementById('order-input');
const addOrderBtn = document.getElementById('add-order');
const searchInput = document.getElementById('search-input');
const adminBtn = document.getElementById('admin-btn');
const addStationBtn = document.getElementById('add-station-btn');

// === Загрузка при старте ===
document.addEventListener('DOMContentLoaded', () => {
  renderStations();
  loadOrders();
});

// === Загрузка участков из Supabase ===
async function loadStations() {
  const { data } = await supabase.from('stations').select('name').order('name', { ascending: true });
  return data ? data.map(s => s.name) : [];
}

// === Рендер участков с счётчиками ===
async function renderStations() {
  const stations = await loadStations();
  if (stations.length === 0) {
    // Загрузим участки по умолчанию, если таблица пуста
    const defaultStations = [
      "Распил", "ЧПУ", "Покраска", "Фрезеровка",
      "Шпонировка", "Сборка", "Упаковка"
    ];
    for (const name of defaultStations) {
      await supabase.from('stations').insert({ name });
    }
    return renderStations();
  }

  const counts = {};
  stations.forEach(s => counts[s] = 0);

  const { data: ordersData } = await supabase.from('orders').select('station');
  if (ordersData) {
    ordersData.forEach(row => {
      if (counts.hasOwnProperty(row.station)) {
        counts[row.station]++;
      }
    });
  }

  stationsList.innerHTML = '';
  stations.forEach(station => {
    const li = document.createElement('li');
    li.textContent = `${station} (${counts[station]})`;
    li.classList.toggle('active', station === currentStation);
    li.addEventListener('click', () => {
      currentStation = station;
      renderStations();
      loadOrders();
    });
    stationsList.appendChild(li);
  });

  updateOpenOrdersCount();
}

// === Подсчёт открытых заказов ===
async function updateOpenOrdersCount() {
  const { data } = await supabase.from('orders').select('id', { count: 'exact' });
  const count = data ? data.length : 0;
  document.getElementById('open-orders-count').textContent = count;
}

// === Загрузка заказов ===
async function loadOrders(searchTerm = null) {
  let query = supabase.from('orders').select('*');

  if (searchTerm) {
    query = query.ilike('order_id', `%${searchTerm}%`);
  } else if (currentStation) {
    query = query.eq('station', currentStation);
  }

  const { data } = await query.order('created_at', { ascending: false });
  renderOrders(data || []);
  updateOpenOrdersCount();
}

function renderOrders(ordersList) {
  ordersContainer.innerHTML = '';

  if (ordersList.length === 0) {
    ordersContainer.innerHTML = '<p>Нет задач</p>';
    return;
  }

  ordersList.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const moveBtn = document.createElement('button');
    moveBtn.textContent = 'Переместить';
    moveBtn.addEventListener('click', () => showMoveDialog(order.id));

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.addEventListener('click', () => closeOrder(order.id));

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'status-buttons';
    buttonsDiv.appendChild(moveBtn);
    buttonsDiv.appendChild(closeBtn);

    const idDiv = document.createElement('div');
    idDiv.className = 'order-id';
    idDiv.textContent = `#${order.order_id}`;

    card.appendChild(idDiv);
    card.appendChild(buttonsDiv);
    ordersContainer.appendChild(card);
  });
}

// === Добавление заказа ===
addOrderBtn.addEventListener('click', async () => {
  const orderId = orderInput.value.trim();
  if (!orderId) return alert('Введите номер заказа');

  const stations = await loadStations();
  if (stations.length === 0) return alert('Нет участков');

  const { error } = await supabase.from('orders').insert({
    order_id: orderId,
    station: stations[0]
  });

  if (error) {
    alert('Ошибка: ' + error.message);
  } else {
    orderInput.value = '';
    if (!currentStation || currentStation === stations[0]) loadOrders();
    renderStations();
  }
});

// === Поиск ===
searchInput.addEventListener('input', (e) => {
  loadOrders(e.target.value.trim());
});

// === Переместить заказ ===
function showMoveDialog(orderId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'move-modal';

  const select = document.createElement('select');
  loadStations().then(stations => {
    stations.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      select.appendChild(opt);
    });
  });

  const okBtn = document.createElement('button');
  okBtn.textContent = 'OK';
  okBtn.addEventListener('click', () => confirmMove(orderId, select.value));

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Отмена';
  cancelBtn.addEventListener('click', () => {
    document.getElementById('move-modal')?.remove();
  });

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.innerHTML = '<h4>Переместить заказ</h4>';
  content.appendChild(select);
  content.appendChild(okBtn);
  content.appendChild(cancelBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);
}

async function confirmMove(orderId, newStation) {
  const { error } = await supabase
    .from('orders')
    .update({ station: newStation })
    .eq('id', orderId);

  if (error) {
    alert('Ошибка: ' + error.message);
  } else {
    document.getElementById('move-modal')?.remove();
    loadOrders();
    renderStations();
  }
}

// === Закрыть заказ ===
async function closeOrder(orderId) {
  if (!confirm('Закрыть заказ?')) return;

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    alert('Ошибка: ' + error.message);
  } else {
    loadOrders();
    renderStations();
  }
}

// === Добавление нового участка ===
addStationBtn.addEventListener('click', async () => {
  const name = prompt('Название нового участка:');
  if (!name || name.trim() === '') return;

  const trimmedName = name.trim();
  
  const { data: existing } = await supabase
    .from('stations')
    .select('name')
    .eq('name', trimmedName);

  if (existing && existing.length > 0) {
    alert('Такой участок уже существует');
    return;
  }

  const { error } = await supabase
    .from('stations')
    .insert({ name: trimmedName });

  if (error) {
    alert('Ошибка: ' + error.message);
  } else {
    renderStations();
  }
});

// === Админка ===
adminBtn.addEventListener('click', async () => {
  const pass = prompt('Админ-пароль:');
  if (pass !== 'admin123') {
    alert('Неверный пароль');
    return;
  }

  const { data: stationsData } = await supabase.from('stations').select('name').order('name', { ascending: true });
  const stationsList = stationsData ? stationsData.map(s => s.name) : [];

  const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'admin-panel';

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.innerHTML = '<h3>Админ-панель</h3>';

  // Участки
  const stationsSection = document.createElement('div');
  stationsSection.innerHTML = '<h4>Участки</h4>';
  const stationsContainer = document.createElement('div');
  
  stationsList.forEach(name => {
    const div = document.createElement('div');
    div.textContent = name;
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.addEventListener('click', async () => {
      if (confirm(`Удалить участок "${name}"?`)) {
        await supabase.from('stations').delete().eq('name', name);
        location.reload();
      }
    });
    div.appendChild(btn);
    stationsContainer.appendChild(div);
  });

  const newStationInput = document.createElement('input');
  newStationInput.type = 'text';
  newStationInput.placeholder = 'Новый участок';

  const addStationBtn = document.createElement('button');
  addStationBtn.textContent = 'Добавить';
  addStationBtn.addEventListener('click', async () => {
    const name = newStationInput.value.trim();
    if (!name) return;
    const { error } = await supabase.from('stations').insert({ name });
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      newStationInput.value = '';
      location.reload();
    }
  });

  stationsSection.appendChild(stationsContainer);
  stationsSection.appendChild(newStationInput);
  stationsSection.appendChild(addStationBtn);
  content.appendChild(stationsSection);

  // Заказы
  const ordersSection = document.createElement('div');
  ordersSection.innerHTML = '<h4>Заказы</h4>';
  const ordersContainer = document.createElement('div');
  
  if (!ordersData || ordersData.length === 0) {
    ordersContainer.innerHTML = '<p>Нет заказов</p>';
  } else {
    ordersData.forEach(order => {
      const div = document.createElement('div');
      div.textContent = `#${order.order_id} (${order.station})`;
      const btn = document.createElement('button');
      btn.textContent = 'Удалить';
      btn.addEventListener('click', async () => {
        if (confirm(`Удалить заказ #${order.order_id}?`)) {
          await supabase.from('orders').delete().eq('id', order.id);
          location.reload();
        }
      });
      div.appendChild(btn);
      ordersContainer.appendChild(div);
    });
  }
  ordersSection.appendChild(ordersContainer);
  content.appendChild(ordersSection);

  // Кнопка закрытия
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Закрыть';
  closeBtn.style.marginTop = '12px';
  closeBtn.addEventListener('click', () => {
    document.getElementById('admin-panel')?.remove();
  });
  content.appendChild(closeBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);
});

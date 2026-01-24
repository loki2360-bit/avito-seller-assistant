// === Supabase config ===
const SUPABASE_URL = 'https://zitdekerfjocbulmfuyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_41ROEqZ74QbA4B6_JASt4w_DeRDGXWR';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Пароли ===
const PASSWORDS = {
  operator: '12345',
  admin: 'admin123'
};

let currentUserRole = null;
let currentStation = '';

// === DOM элементы ===
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const userRoleEl = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const stationsList = document.getElementById('stations-list');
const ordersContainer = document.getElementById('orders-container');
const orderInput = document.getElementById('order-input');
const addOrderBtn = document.getElementById('add-order');
const searchInput = document.getElementById('search-input');
const adminControls = document.getElementById('admin-controls');
const newStationInput = document.getElementById('new-station');
const addStationBtn = document.getElementById('add-station');

// === Кэш участков ===
let cachedStations = null;

// === Выход из системы ===
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmoji');
  currentUserRole = null;
  app.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginPassword.value = '';
});

// === Премиум-функционал ===
const premiumCodeInput = document.getElementById('premium-code');
const applyPremiumBtn = document.getElementById('apply-premium');
const emojiSelector = document.getElementById('emoji-selector');
const emojiOptions = document.querySelectorAll('.emoji-options span');

// Проверяем, есть ли сохранённый премиум-статус при загрузке
const savedEmoji = localStorage.getItem('userEmoji');
if (savedEmoji) {
  emojiSelector.style.display = 'block';
}

// Применение премиум-кода
applyPremiumBtn.addEventListener('click', () => {
  const code = premiumCodeInput.value.trim();
  // Замените 'PREMIUM123' на ваш реальный код
  if (code === 'PREMIUM123') {
    alert('Премиум-статус активирован!');
    const defaultEmoji = '🌟';
    localStorage.setItem('userEmoji', defaultEmoji);
    emojiSelector.style.display = 'block';
    if (currentUserRole) {
      updateUserRoleDisplay(defaultEmoji);
    }
  } else {
    alert('Неверный премиум-код');
  }
});

// === Выбор эмодзи ===
emojiOptions.forEach(span => {
  span.addEventListener('click', () => {
    const emoji = span.getAttribute('data-emoji');
    localStorage.setItem('userEmoji', emoji);
    if (currentUserRole) {
      updateUserRoleDisplay(emoji);
    }
    // Скрываем панель выбора после выбора
    emojiSelector.style.display = 'none';
  });
});

// Обновление отображения роли с эмодзи
function updateUserRoleDisplay(emoji) {
  const roleText = currentUserRole === 'admin' ? 'Администратор' : 'Оператор';
  userRoleEl.innerHTML = `${emoji} ${roleText}`;
}

// === Вход по паролю ===
function handleLogin() {
  const password = loginPassword.value.trim();
  
  if (password === PASSWORDS.admin) {
    currentUserRole = 'admin';
    localStorage.setItem('userRole', 'admin');
  } else if (password === PASSWORDS.operator) {
    currentUserRole = 'operator';
    localStorage.setItem('userRole', 'operator');
  } else {
    loginError.textContent = 'Неверный пароль';
    loginError.style.display = 'block';
    return;
  }
  
  // Устанавливаем текст роли
  userRoleEl.textContent = currentUserRole === 'admin' ? 'Администратор' : 'Оператор';
  adminControls.style.display = currentUserRole === 'admin' ? 'block' : 'none';
  
  // Проверяем премиум-статус после входа
  const savedEmoji = localStorage.getItem('userEmoji');
  if (savedEmoji) {
    updateUserRoleDisplay(savedEmoji);
    emojiSelector.style.display = 'block';
  }
  
  loginError.style.display = 'none';
  loginScreen.style.display = 'none';
  app.style.display = 'block';
  
  initApp();
}

loginBtn.addEventListener('click', handleLogin);
loginPassword.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
});

// === Инициализация приложения ===
async function initApp() {
  try {
    const stations = await loadStations();
    if (stations.length > 0) {
      currentStation = stations[0];
    }
    renderStations();
    loadOrders();
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    alert('Ошибка при загрузке данных.');
  }
}

// === Загрузка участков из базы ===
async function loadStations() {
  if (cachedStations !== null) {
    return cachedStations;
  }
  
  const { data, error } = await supabaseClient.from('stations').select('name').order('name', { ascending: true });
  if (error) throw error;
  
  cachedStations = data ? data.map(s => s.name) : [];
  return cachedStations;
}

// === Рендер участков ===
async function renderStations() {
  try {
    const stations = await loadStations();
    const counts = {};
    stations.forEach(s => counts[s] = 0);

    const { data, error } = await supabaseClient.from('orders').select('station');
    if (!error && data) {
      data.forEach(row => {
        if (counts.hasOwnProperty(row.station)) {
          counts[row.station]++;
        }
      });
    }

    stationsList.innerHTML = '';
    stations.forEach(station => {
      const li = document.createElement('li');
      li.textContent = `${station} (${counts[station] || 0})`;
      li.classList.toggle('active', station === currentStation);
      li.addEventListener('click', () => {
        currentStation = station;
        renderStations();
        loadOrders();
      });
      stationsList.appendChild(li);
    });
  } catch (error) {
    console.error('Ошибка рендера участков:', error);
    stationsList.innerHTML = '<li style="color: #dc3545;">Ошибка загрузки</li>';
  }
}

// === Загрузка заказов ===
async function loadOrders(searchTerm = null) {
  try {
    let query = supabaseClient.from('orders').select('*');

    if (searchTerm) {
      query = query.ilike('order_id', `%${searchTerm}%`);
    } else {
      query = query.eq('station', currentStation);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    renderOrders(data || []);
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
    ordersContainer.innerHTML = '<p style="text-align:center; color:#dc3545;">Ошибка загрузки</p>';
  }
}

// === Отображение заказов ===
async function renderOrders(ordersList) {
  ordersContainer.innerHTML = '';

  if (ordersList.length === 0) {
    ordersContainer.innerHTML = '<p style="text-align:center; color:#6c757d;">Нет задач</p>';
    return;
  }

  const stations = await loadStations();

  ordersList.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';

    // Контейнер для ID и возможного комментария
    const idContainer = document.createElement('div');
    idContainer.style.position = 'relative';
    idContainer.style.cursor = 'pointer';
    idContainer.title = order.comment ? 'Просмотреть комментарий' : 'Добавить комментарий';

    const idDiv = document.createElement('div');
    idDiv.className = 'order-id';
    idDiv.textContent = `#${order.order_id}`;
    
    // Обработчик клика по номеру заказа
    idContainer.addEventListener('click', () => {
      if (order.comment) {
        // Показать существующий комментарий
        showCommentView(order.comment);
      } else {
        // Добавить новый комментарий
        showCommentDialog(order.id);
      }
    });

    idContainer.appendChild(idDiv);

    // Выпадающий список для перемещения
    const moveSelect = document.createElement('select');
    moveSelect.className = 'move-select';
    
    stations.forEach(station => {
      const opt = document.createElement('option');
      opt.value = station;
      opt.textContent = station;
      if (station === order.station) {
        opt.selected = true;
      }
      moveSelect.appendChild(opt);
    });

    moveSelect.addEventListener('change', async () => {
      const newStation = moveSelect.value;
      try {
        const { error } = await supabaseClient
          .from('orders')
          .update({ station: newStation })
          .eq('id', order.id);

        if (error) throw error;

        loadOrders();
        renderStations();
      } catch (error) {
        console.error('Ошибка перемещения:', error);
        alert('Ошибка при перемещении заказа.');
        moveSelect.value = order.station;
      }
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.addEventListener('click', () => closeOrder(order.id));

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'status-buttons';
    buttonsDiv.appendChild(moveSelect);
    buttonsDiv.appendChild(closeBtn);

    card.appendChild(idContainer);
    card.appendChild(buttonsDiv);
    ordersContainer.appendChild(card);
  });
}

// === Диалог добавления комментария ===
function showCommentDialog(orderId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'comment-modal';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Введите комментарий к заказу...';
  textarea.rows = 4;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Сохранить';
  saveBtn.addEventListener('click', async () => {
    const comment = textarea.value.trim();
    if (!comment) {
      alert('Комментарий не может быть пустым');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({ comment: comment })
        .eq('id', orderId);

      if (error) throw error;

      document.getElementById('comment-modal')?.remove();
      loadOrders();
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      alert('Ошибка при добавлении комментария.');
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Отмена';
  cancelBtn.addEventListener('click', () => {
    document.getElementById('comment-modal')?.remove();
  });

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.innerHTML = '<h4>Добавить комментарий</h4>';
  content.appendChild(textarea);
  content.appendChild(saveBtn);
  content.appendChild(cancelBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);
}

// === Просмотр комментария ===
function showCommentView(comment) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'comment-view-modal';

  const content = document.createElement('div');
  content.className = 'modal-content';
  
  const title = document.createElement('h4');
  title.textContent = 'Комментарий к заказу';
  title.style.textAlign = 'center';
  title.style.marginBottom = '12px';

  const commentText = document.createElement('div');
  commentText.textContent = comment;
  commentText.style.fontSize = '14px';
  commentText.style.lineHeight = '1.5';
  commentText.style.padding = '12px';
  commentText.style.backgroundColor = '#f8f9fa';
  commentText.style.borderRadius = '8px';
  commentText.style.border = '1px solid #e9ecef';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Закрыть';
  closeBtn.addEventListener('click', () => {
    document.getElementById('comment-view-modal')?.remove();
  });

  content.appendChild(title);
  content.appendChild(commentText);
  content.appendChild(closeBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);
}

// === Добавление заказа ===
addOrderBtn.addEventListener('click', async () => {
  const orderId = orderInput.value.trim();
  
  if (!orderId) return alert('Введите номер заказа');
  
  try {
    const stations = await loadStations();
    if (stations.length === 0) return alert('Нет участков');

    const { error } = await supabaseClient.from('orders').insert({
      order_id: orderId,
      station: stations[0]
    });

    if (error) {
      console.error('Ошибка добавления:', error);
      alert(`Ошибка: ${error.message}`);
      return;
    }

    orderInput.value = '';
    if (currentStation === stations[0]) loadOrders();
    renderStations();
  } catch (error) {
    console.error('Неизвестная ошибка:', error);
    alert('Неизвестная ошибка. Проверьте консоль.');
  }
});

// === Поиск ===
searchInput.addEventListener('input', (e) => {
  loadOrders(e.target.value.trim());
});

// === Закрыть заказ ===
async function closeOrder(orderId) {
  if (!confirm('Закрыть заказ?')) return;

  try {
    const { error } = await supabaseClient
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;

    loadOrders();
    renderStations();
  } catch (error) {
    console.error('Ошибка закрытия заказа:', error);
    alert('Ошибка при закрытии заказа.');
  }
}

// === Управление участками (только для админа) ===
addStationBtn.addEventListener('click', async () => {
  if (currentUserRole !== 'admin') return;
  
  const name = newStationInput.value.trim();
  if (!name) return;
  
  try {
    const stations = await loadStations();
    if (stations.includes(name)) return alert('Участок уже существует');
    
    const { error } = await supabaseClient.from('stations').insert({ name });
    if (error) throw error;
    
    newStationInput.value = '';
    cachedStations = null; // Сбрасываем кэш
    renderStations();
  } catch (error) {
    console.error('Ошибка добавления участка:', error);
    alert('Ошибка при добавлении участка.');
  }
});

// === Удаление участка (через долгое нажатие) ===
stationsList.addEventListener('contextmenu', async (e) => {
  if (currentUserRole !== 'admin') return;
  
  const li = e.target.closest('li');
  if (!li) return;
  
  e.preventDefault();
  const stationName = li.textContent.split(' ')[0];
  
  if (confirm(`Удалить участок "${stationName}"?`)) {
    try {
      const { error } = await supabaseClient
        .from('stations')
        .delete()
        .eq('name', stationName);
      
      if (error) throw error;
      
      cachedStations = null; // Сбрасываем кэш
      renderStations();
    } catch (error) {
      console.error('Ошибка удаления участка:', error);
      alert('Ошибка при удалении участка.');
    }
  }
});

// === Запуск приложения ===
if (!checkAutoLogin()) {
  loginScreen.style.display = 'flex';
}

// === Проверка автоматического входа ===
function checkAutoLogin() {
  const savedRole = localStorage.getItem('userRole');
  
  if (savedRole && (savedRole === 'operator' || savedRole === 'admin')) {
    currentUserRole = savedRole;
    userRoleEl.textContent = savedRole === 'admin' ? 'Администратор' : 'Оператор';
    adminControls.style.display = savedRole === 'admin' ? 'block' : 'none';
    
    // Проверяем премиум-статус
    const savedEmoji = localStorage.getItem('userEmoji');
    if (savedEmoji) {
      updateUserRoleDisplay(savedEmoji);
      emojiSelector.style.display = 'block';
    }
    
    loginScreen.style.display = 'none';
    app.style.display = 'block';
    
    initApp();
    return true;
  }
  return false;
}

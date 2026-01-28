// === ПРОВЕРКА ЗАГРУЗКИ SUPABASE ===
if (typeof createClient !== 'function') {
  console.error('❌ Supabase SDK не загружен! Проверьте <script src="...supabase.min.js">');
  document.getElementById('items-list').innerHTML = 
    '<p style="color:red; text-align:center;">Ошибка: Supabase не подключён</p>';
  document.getElementById('create-btn')?.addEventListener('click', () => {
    alert('Supabase не загружен. Проверьте подключение в index.html.');
  });
  window.moveItem = () => alert('Supabase не загружен.');
  return;
}

// === Настройки Supabase ===
const SUPABASE_URL = 'https://zitdekerfjocbulmfuyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_41ROEqZ74QbA4B6_JASt4w_DeRDGXWR';

// ⚠️ ВАЖНО: ЗАМЕНИТЕ ВЫШЕ НА ВАШИ ДАННЫЕ!
if (SUPABASE_URL.includes('ваш-проект') || SUPABASE_ANON_KEY.includes('ваш-anon')) {
  console.warn('⚠️ Осторожно: ключи не изменены! Замените SUPABASE_URL и SUPABASE_ANON_KEY в script.js');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === DOM-элементы ===
const searchInput = document.getElementById('search-input');
const orderNumberInput = document.getElementById('order-number');
const itemTypeSelect = document.getElementById('item-type');
const workstationSelect = document.getElementById('workstation');
const createBtn = document.getElementById('create-btn');
const itemsList = document.getElementById('items-list');

// === Защита от XSS ===
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// === Загрузка данных ===
async function loadItems() {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('order_number', { ascending: true })
      .order('item_type', { ascending: true });

    if (error) {
      console.error('❌ Ошибка запроса:', error);
      itemsList.innerHTML = `<p style="color:red;">Ошибка: ${error.message}</p>`;
      return;
    }

    renderItems(data || []);
  } catch (err) {
    console.error('💥 Критическая ошибка:', err);
    itemsList.innerHTML = `<p style="color:red;">Ошибка выполнения: ${err.message || 'неизвестно'}</p>`;
  }
}

// === Отображение списка ===
function renderItems(items) {
  const searchTerm = (searchInput.value || '').toLowerCase().trim();
  const filtered = items.filter(item =>
    item.order_number.toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    itemsList.innerHTML = '<p>Нет записей. Создайте первую позицию.</p>';
    return;
  }

  itemsList.innerHTML = filtered.map(item => `
    <div class="item-row" data-id="${item.id}">
      <div>
        <strong>${escapeHtml(item.order_number)}</strong>
        <div class="item-type">${escapeHtml(item.item_type)}</div>
      </div>
      <select onchange="moveItem('${item.id}', this.value)">
        ${['распил', 'чпу', 'фанеровка', 'шлифовка', 'сборка', 'покраска', 'пвх', 'упаковка']
          .map(ws => `<option value="${ws}" ${ws === item.current_workstation ? 'selected' : ''}>${ws}</option>`)
          .join('')}
      </select>
    </div>
  `).join('');
}

// === Создание новой записи ===
createBtn.addEventListener('click', async () => {
  const order = (orderNumberInput.value || '').trim();
  const type = itemTypeSelect.value;
  const ws = workstationSelect.value;

  if (!order) {
    alert('❗ Введите номер заказа');
    return;
  }

  try {
    const { error } = await supabase.from('items').insert({
      order_number: order,
      item_type: type,
      current_workstation: ws
    });

    if (error) {
      console.error('❌ Ошибка создания:', error);
      alert(`Не удалось создать: ${error.message}`);
    } else {
      console.log('✅ Запись создана:', { order, type, ws });
      // Оставляем номер для быстрого добавления следующей
      itemTypeSelect.value = 'наружняя панель';
      workstationSelect.value = 'распил';
      loadItems();
    }
  } catch (err) {
    console.error('💥 Ошибка при создании:', err);
    alert('Системная ошибка. Проверьте консоль (F12).');
  }
});

// === Перемещение ===
window.moveItem = async (id, newWs) => {
  try {
    const { error } = await supabase
      .from('items')
      .update({ current_workstation: newWs })
      .eq('id', id);

    if (error) {
      console.error('❌ Ошибка перемещения:', error);
      alert(`Не удалось переместить: ${error.message}`);
    } else {
      console.log(`✅ Перемещено: ${id} → ${newWs}`);
      loadItems();
    }
  } catch (err) {
    console.error('💥 Ошибка перемещения:', err);
    alert('Ошибка перемещения. Проверьте консоль.');
  }
};

// === Поиск ===
searchInput.addEventListener('input', loadItems);

// === Инициализация ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Приложение запущено. Проверка Supabase...');
  
  // Проверка подключения
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.warn('ℹ️ Аутентификация не требуется (анонимный доступ)');
    } else {
      console.log('🔐 Сессия: OK');
    }
  });

  // Загрузка данных
  loadItems();
});

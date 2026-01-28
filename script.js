// === НАСТРОЙКИ SUPABASE ===
// ⚠️ ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ ИЗ SUPABASE!
const SUPABASE_URL = 'https://zitdekerfjocbulmfuyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_41ROEqZ74QbA4B6_JASt4w_DeRDGXWR';

// === ПОДКЛЮЧЕНИЕ ===
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async function () {
  const createBtn = document.getElementById('create-btn');
  const itemsList = document.getElementById('items-list');
  const orderInput = document.getElementById('order-number');
  const typeSelect = document.getElementById('item-type');
  const wsSelect = document.getElementById('workstation');
  const searchInput = document.getElementById('search-input');

  // === ЗАГРУЗКА ДАННЫХ ===
  async function loadItems() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('order_number', { ascending: true })
        .order('item_type', { ascending: true });

      if (error) throw error;

      renderItems(data || []);
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      itemsList.innerHTML = '<p style="color:red;">Ошибка подключения к базе</p>';
    }
  }

  // === ОТОБРАЖЕНИЕ ===
  function renderItems(items) {
    const term = (searchInput.value || '').toLowerCase();
    const filtered = items.filter(item =>
      item.order_number.toLowerCase().includes(term)
    );

    itemsList.innerHTML = filtered.length
      ? filtered.map(item => `
          <div class="item-row">
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
        `).join('')
      : '<p>Нет записей</p>';
  }

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  window.moveItem = async (id, newWs) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ current_workstation: newWs })
        .eq('id', id);
      if (!error) loadItems();
    } catch (err) {
      console.error('Ошибка перемещения:', err);
    }
  };

  // === СОЗДАНИЕ ===
  createBtn.addEventListener('click', async function () {
    const order = (orderInput.value || '').trim();
    const type = typeSelect.value;
    const ws = wsSelect.value;

    if (!order) {
      alert('Введите номер заказа');
      return;
    }

    try {
      const { error } = await supabase.from('items').insert({
        order_number: order,
        item_type: type,
        current_workstation: ws
      });
      if (!error) {
        typeSelect.value = 'наружняя панель';
        wsSelect.value = 'распил';
        loadItems();
      }
    } catch (err) {
      console.error('Ошибка создания:', err);
      alert('Не удалось создать запись');
    }
  });

  // === ПОИСК ===
  searchInput.addEventListener('input', loadItems);

  // === СТАРТ ===
  loadItems();
});

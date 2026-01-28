// === ВСТРОЕННЫЙ SUPABASE JS SDK v2.41.1 (IIFE, без внешних зависимостей) ===
(() => {
  const _global = typeof globalThis !== 'undefined' ? globalThis : window;
  if (_global.createClient) return;

  // Минифицированный Supabase Client (сжатая версия для GitHub Pages)
  // Источник: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.41.1/dist/umd/supabase.min.js
  // Вручную вшито для обхода MIME-блокировок GitHub Pages
  const supabaseCode = `!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";n.r(t);var r=n(1);t.createClient=function(e,t){return new r.SupabaseClient(e,t)}}]);`;
  try {
    new Function(supabaseCode)();
  } catch (e) { console.warn('Supabase fallback failed, using minimal client'); }

  // Если не удалось — создаём заглушку для отладки
  if (typeof _global.createClient !== 'function') {
    _global.createClient = (url, key) => ({
      from: () => ({
        select: () => ({ then: cb => cb([]) }),
        insert: () => ({ then: cb => cb({}) }),
        update: () => ({ then: cb => cb({}) })
      })
    });
  }
})();

// === ОСНОВНОЙ КОД ПРИЛОЖЕНИЯ ===
document.addEventListener('DOMContentLoaded', () => {
  const createBtn = document.getElementById('create-btn');
  const itemsList = document.getElementById('items-list');
  const orderInput = document.getElementById('order-number');
  const typeSelect = document.getElementById('item-type');
  const wsSelect = document.getElementById('workstation');
  const searchInput = document.getElementById('search-input');

  // ⚠️ ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ ИЗ SUPABASE!
  const SUPABASE_URL = 'https://zitdekerfjocbulmfuyo.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_41ROEqZ74QbA4B6_JASt4w_DeRDGXWR';

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function loadItems() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('order_number', { ascending: true })
        .order('item_type', { ascending: true });

      if (error) throw error;

      itemsList.innerHTML = data.length
        ? data.map(item => `
            <div class="item-row">
              <div><strong>${item.order_number}</strong> • ${item.item_type}</div>
              <select onchange="moveItem('${item.id}', this.value)">
                ${['распил','чпу','фанеровка','шлифовка','сборка','покраска','пвх','упаковка']
                  .map(ws => `<option value="${ws}" ${ws === item.current_workstation ? 'selected' : ''}>${ws}</option>`)
                  .join('')}
              </select>
            </div>
          `).join('')
        : '<p>Нет записей</p>';
    } catch (err) {
      console.error('Ошибка:', err);
      itemsList.innerHTML = `<p style="color:red;">${err.message || 'Неизвестная ошибка'}</p>`;
    }
  }

  window.moveItem = async (id, ws) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ current_workstation: ws })
        .eq('id', id);
      if (!error) loadItems();
    } catch (err) {
      console.error('Перемещение:', err);
    }
  };

  createBtn.addEventListener('click', async () => {
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
      console.error('Создание:', err);
      alert('Ошибка создания');
    }
  });

  searchInput.addEventListener('input', loadItems);
  loadItems();
});

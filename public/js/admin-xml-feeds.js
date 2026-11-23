(() => {
  const panel = document.getElementById('adminXmlPanel');
  const status = document.getElementById('adminXmlStatus');
  const container = document.getElementById('adminXmlFeeds');
  const refresh = document.getElementById('adminXmlRefresh');
  if (!panel || !status || !container || !refresh) return;

  async function api(url, method = 'GET', body) {
    const token = localStorage.getItem('royalGarageToken');
    const response = await fetch(url, {
      method, cache: 'no-store',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw Error(data.message || 'HTTP ' + response.status);
    return data;
  }

  async function load() {
    status.textContent = 'Завантажуємо XML-джерела…';
    container.replaceChildren();
    try {
      const { feeds } = await api('/api/admin/xml-feeds');
      if (!feeds.length) {
        status.textContent = 'XML-джерел поки немає.';
        return;
      }
      status.textContent = 'Джерел: ' + feeds.length;
      for (const feed of feeds) {
        const card = document.createElement('article');
        card.className = 'platform-admin-panel';
        const title = document.createElement('h3');
        title.textContent = feed.business_name || 'Бізнес';
        const url = document.createElement('p');
        url.style.overflowWrap = 'anywhere';
        url.textContent = feed.url;
        const state = document.createElement('p');
        state.textContent = feed.approved
          ? (feed.enabled ? 'Погоджено, синхронізація увімкнена' : 'Погоджено, синхронізація вимкнена')
          : 'Очікує погодження';
        card.append(title, url, state);
        if (feed.last_error) {
          const error = document.createElement('p');
          error.textContent = 'Остання помилка: ' + feed.last_error;
          card.append(error);
        }
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.flexWrap = 'wrap';
        actions.style.gap = '8px';
        for (const [label, approved] of [['Погодити', true], ['Відхилити / відкликати', false]]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'upholstery-primary-button';
          button.textContent = label;
          button.disabled = approved === Boolean(feed.approved);
          button.addEventListener('click', async () => {
            if (!confirm((approved ? 'Погодити' : 'Відкликати погодження') + ' XML-джерело для ' + (feed.business_name || 'бізнесу') + '?')) return;
            button.disabled = true;
            status.textContent = 'Зберігаємо рішення…';
            try {
              await api('/api/admin/xml-feeds/' + encodeURIComponent(feed.id) + '/approval', 'PATCH', { approved });
              await load();
            } catch (error) {
              status.textContent = error.message;
              button.disabled = false;
            }
          });
          actions.append(button);
        }
        if (feed.approved && feed.enabled) {
          const sync = document.createElement('button');
          sync.type = 'button';
          sync.className = 'upholstery-primary-button';
          sync.textContent = 'Синхронізувати зараз';
          sync.addEventListener('click', async () => {
            if (!confirm('Запустити імпорт автомобілів із цього XML прямо зараз?')) return;
            sync.disabled = true;
            status.textContent = 'Виконується імпорт…';
            try {
              const response = await api('/api/admin/xml-feeds/' + encodeURIComponent(feed.id) + '/sync', 'POST');
              await load();
              status.textContent = 'Імпорт завершено. Оброблено автомобілів: ' + response.imported;
            } catch (error) {
              status.textContent = 'Помилка імпорту: ' + error.message;
              await load();
              status.textContent = 'Помилка імпорту: ' + error.message;
            } finally { sync.disabled = false; }
          });
          actions.append(sync);
        }
        if (!feed.enabled) {
          const hide = document.createElement('button');
          hide.type = 'button';
          hide.className = 'upholstery-primary-button';
          hide.textContent = 'Прибрати імпортовані автомобілі';
          hide.addEventListener('click', async () => {
            if (!confirm('Зняти з публікації ВСІ активні автомобілі, імпортовані саме з цього XML-джерела? Інші оголошення не зміняться.')) return;
            hide.disabled = true;
            status.textContent = 'Приховуємо імпортовані автомобілі…';
            try {
              const result = await api('/api/admin/xml-feeds/' + encodeURIComponent(feed.id) + '/hide-listings', 'POST');
              await load();
              status.textContent = 'Знято з публікації: ' + result.hidden + '. XML має залишатися вимкненим.';
            } catch (error) {
              status.textContent = error.message;
              hide.disabled = false;
            }
          });
          actions.append(hide);
        }
        card.append(actions);
        container.append(card);
      }
    } catch (error) {
      status.textContent = error.message;
    }
  }
  refresh.addEventListener('click', load);
  const observer = new MutationObserver(() => {
    const platform = document.getElementById('platformAdmin');
    if (platform && !platform.hidden) {
      observer.disconnect();
      load();
    }
  });
  const platform = document.getElementById('platformAdmin');
  if (platform && !platform.hidden) load();
  else if (platform) observer.observe(platform, { attributes: true, attributeFilter: ['hidden'] });
})();
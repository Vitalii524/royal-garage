const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const { parseHTML } = require('linkedom');

const source = fs.readFileSync('public/js/share.js', 'utf8');

function setup(page, location, nativeShare) {
    const { document, window } = parseHTML(fs.readFileSync(`public/${page}.html`, 'utf8'));
    const calls = [];
    window.prompt = (_, url) => calls.push(['prompt', url]);
    const navigator = { clipboard: { writeText: async url => calls.push(['clipboard', url]) } };
    if (nativeShare) navigator.share = async data => {
        calls.push(['native', data]);
        if (nativeShare instanceof Error) throw nativeShare;
    };
    vm.runInNewContext(source, { window, document, navigator, URL, location: new URL(location), setTimeout: () => {} });
    return { document, window, calls };
}

test('Royal Auto uses its public page and metadata in the system share sheet', async () => {
    const { document, calls } = setup('handmade', 'https://royalgarage.com.ua/handmade.html?ref=menu', true);
    await document.querySelector('[data-share-business]').onclick();
    assert.equal(calls[0][0], 'native');
    assert.match(calls[0][1].title, /RoyalAuto/);
    assert.ok(calls[0][1].text);
    assert.equal(calls[0][1].url, 'https://royalgarage.com.ua/handmade.html');
    await document.getElementById('copyBusinessLink').onclick();
    assert.deepEqual(calls[1], ['clipboard', 'https://royalgarage.com.ua/handmade.html']);
});

test('canonical profiles share their own owner id and fall back to copy', async () => {
    const { document, window, calls } = setup('business-profile', 'https://royalgarage.com.ua/business-profile.html');
    const source = fs.readFileSync('public/js/business-profile.js', 'utf8');
    const init = source.slice(source.indexOf('        const shareButton ='), source.indexOf('        renderContacts(profile);'));
    const context = {
        document, window, URL,
        $: id => document.getElementById(id),
        requestedOwnerId: () => 'second-business',
        profile: { ownerId: 'second-business', name: 'Другий бізнес', description: 'Опис бізнесу' }
    };
    window.location = new URL('https://royalgarage.com.ua/business-profile.html?id=second-business&ref=catalog');
    vm.runInNewContext(init, context);
    const button = document.getElementById('shareBusinessLink');
    assert.equal(button.hidden, false);
    await button.onclick();
    assert.deepEqual(calls[0], ['clipboard', 'https://royalgarage.com.ua/business-profile.html?id=second-business']);
});

test('cancelling the native menu leaves the clipboard alone', async () => {
    const cancel = Object.assign(new Error('Cancelled'), { name: 'AbortError' });
    const { document, calls } = setup('handmade', 'https://royalgarage.com.ua/handmade.html', cancel);
    await document.querySelector('[data-share-business]').onclick();
    assert.equal(calls.length, 1);
});

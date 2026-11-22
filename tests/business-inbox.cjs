const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const { parseHTML } = require('linkedom');

const html = fs.readFileSync('public/profile.html', 'utf8');
const script = fs.readFileSync('public/js/profile.js', 'utf8');
const royalAuto = { id: '32ce413e-9eb6-417a-b99a-77d9ca7c144a', accountType: 'business' };
const otherBusiness = { id: 'store', accountType: 'business' };
const personal = { id: 'customer', accountType: 'user' };

async function openProfile(user, search) {
    const { document } = parseHTML(html);
    const redirects = [];
    const calls = [];
    const context = {
        document,
        URLSearchParams,
        window: {
            location: { search, replace: url => redirects.push(url) },
            history: { replaceState: () => {} }
        },
        elements: {
            myChatsList: document.getElementById('myChatsList'),
            chatsModal: document.getElementById('chatsModal')
        },
        loadProfileFromServer: async () => {
            calls.push('profile');
            return user;
        },
        renderMyChats: async () => calls.push('chats'),
        openModal: modal => modal.classList.add('modal-open'),
        renderFirstMemberBadge() {},
        renderAccountSettings() {},
        fillSellerProfileSettings() {},
        initializeGarageCars() {},
        renderProfileSellerReputation() {},
        renderProfileSellerReviews() {},
        openServiceHistoryFromUrl() {}
    };
    const start = script.indexOf('async function initializeProfilePage()');
    const end = script.indexOf('function updateGlobalChatsButton()', start);
    const initializer = script.slice(start, end).trimEnd();
    await vm.runInNewContext(initializer, context);
    return { document, redirects, calls };
}

test('customer message links open the inbox for RoyalAuto and other businesses', async () => {
    for (const page of ['handmade', 'business-profile']) {
        const { document } = parseHTML(fs.readFileSync(`public/${page}.html`, 'utf8'));
        assert.ok(document.querySelector('a[href="profile.html?section=chats"]'), page);
    }
    const admin = parseHTML(fs.readFileSync('public/royal-auto-admin.html', 'utf8')).document;
    assert.ok(admin.querySelector('#platformAdmin'));
    assert.equal(admin.querySelector('#platformAdmin a[href="profile.html?section=chats"]'), null);
    for (const [user, destination] of [[royalAuto, 'handmade.html'], [otherBusiness, 'business-profile.html']]) {
        const { document, redirects, calls } = await openProfile(user, '?section=chats');
        const inbox = document.getElementById('businessInbox');
        assert.equal(inbox.hidden, false);
        assert.equal(inbox.querySelector('a').getAttribute('href'), destination);
        assert.ok(inbox.querySelector('#myChatsList'));
        assert.deepEqual(redirects, []);
        assert.deepEqual(calls, ['profile', 'chats']);
    }
});

test('default business destinations and personal inbox still work', async () => {
    assert.deepEqual((await openProfile(royalAuto, '')).redirects, ['royal-auto-admin.html']);
    assert.deepEqual((await openProfile(otherBusiness, '')).redirects, ['business-profile.html']);
    const { document, calls } = await openProfile(personal, '?section=chats');
    assert.equal(document.getElementById('businessInbox').hidden, true);
    assert.ok(document.getElementById('chatsModal').classList.contains('modal-open'));
    assert.deepEqual(calls, ['profile', 'chats']);
});

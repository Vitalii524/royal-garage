const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const server = readFileSync('server.js', 'utf8');
const start = server.indexOf('function requireBusinessAdministrator');
const end = server.indexOf('async function requireCrmAccess', start);
const routes = new Map();
const queries = [];
const royalAuto = 'royal-auto';
vm.runInNewContext(server.slice(start, end), {
    app: {
        post() {},
        get: (route, ...handlers) => routes.set('GET ' + route, handlers),
        patch: (route, ...handlers) => routes.set('PATCH ' + route, handlers)
    },
    requireAuth(req, res, next) { return req.user ? next() : res.status(401).json({}); },
    requireAdmin(req, res, next) { return req.user.role === 'admin' ? next() : res.status(403).json({}); },
    ROYAL_AUTO_OWNER_ID: royalAuto,
    pool: {
        async query(sql, params) {
            queries.push({ sql, params });
            return { rows: params ? Array.from({ length: 31 }, (_, id) => ({ id })) : [{ code: 'car_service' }] };
        }
    }
});

async function request(route, user, query = {}) {
    const res = {
        statusCode: 200, status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; }, set() { return this; }
    };
    const handlers = routes.get(route);
    let i = 0;
    const next = () => handlers[i++]({ user, query }, res, next);
    await next();
    return res;
}

test('only platform administrators can list or manage businesses', async () => {
    for (const route of [...routes.keys()].filter(route => route.includes("/api/admin/"))) {
        assert.equal((await request(route)).statusCode, 401);
        for (const user of [{ role: 'user' }, { role: 'business' }, { role: 'admin', userId: royalAuto }]) {
            assert.equal((await request(route, user)).statusCode, 403);
        }
    }
    assert.equal(queries.length, 0);
});

test('directory uses parameterized filters, registration order and stable pagination', async () => {
    const route = 'GET /api/admin/businesses';
    const admin = { role: 'admin', userId: 'administrator' };
    assert.equal((await request(route, admin, { page: '0' })).statusCode, 400);
    assert.equal((await request(route, admin, { status: 'unknown' })).statusCode, 400);
    const result = await request(route, admin, { q: 'АТ', category: 'car_service', status: 'active', page: '2' });
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.businesses.length, 30);
    assert.equal(result.data.categories[0].code, 'car_service');
    assert.equal(result.data.hasMore, true);
    assert.match(queries[1].sql, /ORDER BY "createdAt", id LIMIT \$4 OFFSET \$5/);
    assert.equal(JSON.stringify(queries[1].params), JSON.stringify(['АТ', 'car_service', 'active', 31, 30]));
});

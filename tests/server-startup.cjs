// Run the ordinary entry point in this test process without connecting to a database.
const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const { Pool } = require('pg');

test('web startup checks the schema once and never runs migrations or an import', async t => {
    const statements = [];
    t.mock.method(Pool.prototype, 'query', async sql => {
        statements.push(sql);
        return { rows: [], rowCount: 0 };
    });
    const listening = new Promise(resolve => {
        t.mock.method(express.application, 'listen', resolve);
    });
    require('../server');
    await listening;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(statements.length, 1);
    assert.match(statements[0], /^\s*SELECT\b/i);
    assert.match(statements[0], /business_moderation_appeals/);
    assert.match(statements[0], /LIMIT 0\s*$/);
});

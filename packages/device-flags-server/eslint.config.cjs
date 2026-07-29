const { defineConfig } = require('eslint/config');
const universeNode = require('eslint-config-universe/flat/node');

module.exports = defineConfig([{ ignores: ['build'] }, ...universeNode]);

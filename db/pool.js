'use strict';

const { Pool } = require('pg');
const config = require('../config');

// Pool de conexões reutilizado por toda a aplicação.
const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});

module.exports = pool;

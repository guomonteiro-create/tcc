'use strict';

// Configurações do Colheita+.
// Edite os valores abaixo com os dados do seu PostgreSQL.

module.exports = {
  // Conexão com o banco PostgreSQL
  db: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456', // <-- troque pela senha do seu PostgreSQL
    database: 'colheita',
  },

  // Porta em que o site vai rodar (http://localhost:3000)
  port: 3000,

  // Segredo usado para assinar os cookies de sessão (troque por algo aleatório)
  sessionSecret: 'troque-este-segredo-por-algo-bem-aleatorio',
};

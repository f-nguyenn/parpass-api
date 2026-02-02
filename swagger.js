const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ParPass API',
      version: '1.0.0',
      description: 'Golf network membership API for the Jacksonville market',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./index.js'],
};

module.exports = swaggerJsdoc(options);
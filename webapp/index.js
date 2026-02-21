const express = require('express');
const app = express();
const PORT = 3000;

// Basic landing page
app.get('/', (req, res) => {
  res.send('<h1>Bem-vindo à Forja do Ace!</h1><p>Este é o início de algo incrível. 🚀</p>');
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 Forja do Ace App is running at http://localhost:${PORT}`);
});
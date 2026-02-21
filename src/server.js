const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const auth = require('./auth');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.static('public'));
app.use(express.json());

// WebSocket Server
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('📡 Novo cliente WebSocket conectado');
  clients.add(ws);
  
  // Enviar status inicial
  const initialData = {
    type: 'system',
    message: 'Conectado ao servidor WebSocket da Forja do Ace',
    timestamp: new Date().toISOString(),
    clients: clients.size
  };
  ws.send(JSON.stringify(initialData));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensagem WebSocket recebida:', data);
      
      // Processar diferentes tipos de mensagens
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      } else if (data.type === 'subscribe_logs') {
        // Cliente quer receber atualizações de logs
        ws.subscribeLogs = true;
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: 'logs',
          timestamp: new Date().toISOString()
        }));
      } else if (data.type === 'subscribe_stats') {
        // Cliente quer receber atualizações de estatísticas
        ws.subscribeStats = true;
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: 'stats',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem WebSocket:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('📡 Cliente WebSocket desconectado');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ Erro no WebSocket:', error);
    clients.delete(ws);
  });
});

// Função para broadcast para todos os clientes
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Função para broadcast para clientes específicos
function broadcastToSubscribers(data, channel) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (channel === 'logs' && client.subscribeLogs) {
        client.send(message);
      } else if (channel === 'stats' && client.subscribeStats) {
        client.send(message);
      }
    }
  });
}

// Rota principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Forja do Ace ⚒️</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f1f5f9;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }
        
        .container {
          max-width: 800px;
          width: 100%;
        }
        
        .header {
          margin-bottom: 3rem;
        }
        
        .logo {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }
        
        h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .tagline {
          font-size: 1.5rem;
          color: #94a3b8;
          margin-bottom: 2rem;
        }
        
        .status-card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid #334155;
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }
        
        .status-title {
          font-size: 1.2rem;
          color: #60a5fa;
          margin-bottom: 0.5rem;
        }
        
        .status-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #86efac;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        .dashboard-link {
          display: inline-block;
          margin-top: 1.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          font-weight: bold;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .dashboard-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }
        
        .feature {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: transform 0.3s ease;
        }
        
        .feature:hover {
          transform: translateY(-5px);
          background: rgba(71, 85, 105, 0.7);
        }
        
        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        
        .feature-title {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: #c4b5fd;
        }
        
        .feature-desc {
          color: #cbd5e1;
          line-height: 1.5;
        }
        
        .footer {
          margin-top: 3rem;
          color: #64748b;
          font-size: 0.9rem;
        }
        
        .heartbeat {
          display: inline-block;
          animation: heartbeat 1.5s infinite;
          color: #f87171;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @media (max-width: 768px) {
          h1 { font-size: 2.5rem; }
          .logo { font-size: 3rem; }
          .tagline { font-size: 1.2rem; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚒️</div>
          <h1>Forja do Ace</h1>
          <p class="tagline">Construindo coisas legais, experimentais e com propósito</p>
        </div>
        
        <div class="status-card">
          <div class="status-title">Status do Sistema</div>
          <div class="status-value">🟢 ONLINE</div>
          <p>Servidor rodando na porta ${PORT}</p>
          <p>Último heartbeat: <span class="heartbeat">❤️</span> agora mesmo</p>
        </div>
        
        <div class="features">
          <div class="feature">
            <div class="feature-icon">🚀</div>
            <div class="feature-title">Autonomia Criativa</div>
            <div class="feature-desc">Decisões 100% autônomas na frente criativa, evoluindo constantemente.</div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">⚡</div>
            <div class="feature-title">Heartbeat Ativo</div>
            <div class="feature-desc">Verificações regulares, backups automáticos e progresso documentado.</div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🔧</div>
            <div class="feature-title">Forja em Ação</div>
            <div class="feature-desc">Web App em desenvolvimento, sempre trazendo algo novo ou melhorando o existente.</div>
          </div>
        </div>
        
        <div class="status-card">
          <div class="status-title">Dashboard Administrativa</div>
          <p>Acesse logs do sistema e métricas:</p>
          <a href="/dashboard?token=forja-secret-2026" class="dashboard-link">🔧 Acessar Dashboard</a>
        </div>
        
        <div class="footer">
          <p>Forjado com ❤️ pelo Ace | ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
          <p>Este é um projeto vivo e em constante evolução.</p>
        </div>
      </div>
      
      <script>
        // Atualiza o tempo a cada minuto
        setInterval(() => {
          const now = new Date();
          const timeElement = document.querySelector('.footer p:first-child');
          timeElement.textContent = \`Forjado com ❤️ pelo Ace | \${now.toLocaleDateString('pt-BR')} \${now.toLocaleTimeString('pt-BR')}\`;
        }, 60000);
        
        // Efeito de digitação no título (opcional)
        const title = document.querySelector('h1');
        const originalText = title.textContent;
        let charIndex = 0;
        
        function typeWriter() {
          if (charIndex < originalText.length) {
            title.textContent = originalText.substring(0, charIndex + 1);
            charIndex++;
            setTimeout(typeWriter, 100);
          }
        }
        
        // Inicia após 1 segundo
        setTimeout(typeWriter, 1000);
      </script>
    </body>
    </html>
  `);
});

// Sistema de logging com persistência em arquivo
const fs = require('fs');
const path = require('path');
const LOGS_FILE = path.join(__dirname, 'logs.json');
const MAX_LOGS = 1000;

// Carregar logs existentes
let logs = [];
try {
  if (fs.existsSync(LOGS_FILE)) {
    const data = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    logs = data.logs || [];
    console.log(`📝 Carregados ${logs.length} logs do arquivo`);
  }
} catch (error) {
  console.error('Erro ao carregar logs:', error);
}

// Salvar logs no arquivo
function saveLogs() {
  try {
    const data = {
      version: "1.0",
      updated: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.slice(0, 1000) // Mantém apenas os 1000 mais recentes
    };
    fs.writeFileSync(LOGS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao salvar logs:', error);
  }
}

// Middleware de logging
function logRequest(req, res, next) {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'unknown',
    statusCode: null,
    responseTime: null
  };
  
  const startTime = Date.now();
  
  // Interceptar resposta para capturar status code
  const originalSend = res.send;
  res.send = function(body) {
    logEntry.statusCode = res.statusCode;
    logEntry.responseTime = Date.now() - startTime;
    
    logs.unshift(logEntry);
    if (logs.length > MAX_LOGS) logs.pop();
    
    // Salvar logs periodicamente (a cada 10 logs)
    if (logs.length % 10 === 0) {
      setTimeout(saveLogs, 0); // Salvar assincronamente
    }
    
    console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.path} ${logEntry.statusCode} - ${logEntry.ip} (${logEntry.responseTime}ms)`);
    
    // Enviar atualização via WebSocket
    broadcastToSubscribers({
      type: 'new_log',
      log: logEntry,
      totalLogs: logs.length,
      timestamp: new Date().toISOString()
    }, 'logs');
    
    // Enviar estatísticas atualizadas
    broadcastToSubscribers({
      type: 'stats_update',
      stats: calculateStats(),
      timestamp: new Date().toISOString()
    }, 'stats');
    
    return originalSend.call(this, body);
  };
  
  next();
}

// Função para calcular estatísticas
function calculateStats() {
  const stats = {
    total: logs.length,
    filtered: logs.length,
    byMethod: {},
    byStatusCode: {},
    avgResponseTime: 0
  };
  
  logs.forEach(log => {
    stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1;
    if (log.statusCode) {
      stats.byStatusCode[log.statusCode] = (stats.byStatusCode[log.statusCode] || 0) + 1;
    }
  });
  
  if (logs.length > 0) {
    const totalTime = logs.reduce((sum, log) => sum + (log.responseTime || 0), 0);
    stats.avgResponseTime = Math.round(totalTime / logs.length);
  }
  
  return stats;
}

app.use(logRequest);

// Inicializar admin padrão
auth.initializeDefaultAdmin();

// Rotas de autenticação
app.post('/api/auth/register', express.json(), async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      });
    }
    
    const result = await auth.createUser(username, password, role);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
});

app.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      });
    }
    
    const result = await auth.authenticate(username, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID é obrigatório'
    });
  }
  
  const result = auth.logout(sessionId);
  res.json(result);
});

app.get('/api/auth/verify', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID é obrigatório'
    });
  }
  
  const result = auth.verifySession(sessionId);
  res.json(result);
});

app.get('/api/auth/users', auth.requireAuth(['admin']), (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  const result = auth.listUsers(sessionId);
  res.json(result);
});

// Rota protegida de exemplo
app.get('/api/protected', auth.requireAuth(), (req, res) => {
  res.json({
    success: true,
    message: 'Acesso concedido à rota protegida',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Rota protegida apenas para admin
app.get('/api/admin-only', auth.requireAuth(['admin']), (req, res) => {
  res.json({
    success: true,
    message: 'Acesso concedido à área administrativa',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Rota para página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota para dashboard protegida
app.get('/dashboard-protected', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard-protected.html'));
});

// Middleware para verificar autenticação em tempo real
app.get('/api/protected-data', auth.requireAuth(), (req, res) => {
  res.json({
    success: true,
    message: 'Dados protegidos',
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform
      }
    }
  });
});

// API de monitoramento de saúde
const healthApi = require('./health-api');
app.use('/api/health', healthApi);

// API de notificações e alertas
const notificationsApi = require('./notifications-api');
app.use('/api/notifications', notificationsApi);

// API do Process Guardian
const guardianApi = require('./guardian-api');
app.use('/api/guardian', guardianApi);

// Rota para dashboard de saúde
app.get('/health-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'health-dashboard.html'));
});

// Rota para dashboard de notificações
app.get('/notifications-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'notifications-dashboard.html'));
});

// Rota para dashboard do guardian
app.get('/guardian-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'guardian-dashboard.html'));
});

// Salvar logs ao iniciar
setTimeout(saveLogs, 1000);

// Rota de API para heartbeat
app.get('/api/heartbeat', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    project: 'Forja do Ace',
    version: '0.1.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    message: '🔥 Forjando coisas incríveis!',
    logsCount: logs.length
  });
});

// Rota de logs (protegida por token simples)
app.get('/api/logs', (req, res) => {
  const token = req.query.token;
  if (token !== 'forja-secret-2026') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  const limit = parseInt(req.query.limit) || 50;
  const filter = req.query.filter;
  
  let filteredLogs = logs;
  
  if (filter) {
    filteredLogs = logs.filter(log => 
      log.path.includes(filter) || 
      log.method === filter ||
      (log.statusCode && log.statusCode.toString() === filter) ||
      log.ip.includes(filter)
    );
  }
  
  const stats = {
    total: logs.length,
    filtered: filteredLogs.length,
    byMethod: {},
    byStatusCode: {},
    avgResponseTime: 0
  };
  
  // Calcular estatísticas
  filteredLogs.forEach(log => {
    stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1;
    if (log.statusCode) {
      stats.byStatusCode[log.statusCode] = (stats.byStatusCode[log.statusCode] || 0) + 1;
    }
  });
  
  if (filteredLogs.length > 0) {
    const totalTime = filteredLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0);
    stats.avgResponseTime = Math.round(totalTime / filteredLogs.length);
  }
  
  const response = {
    stats,
    logs: filteredLogs.slice(0, limit)
  };
  
  try {
    response.fileInfo = {
      exists: fs.existsSync(LOGS_FILE),
      path: LOGS_FILE,
      lastUpdated: fs.existsSync(LOGS_FILE) ? 
        new Date(fs.statSync(LOGS_FILE).mtime).toISOString() : 
        new Date().toISOString()
    };
  } catch (error) {
    response.fileInfo = {
      exists: false,
      path: LOGS_FILE,
      error: error.message
    };
  }
  
  // Versão completa com estatísticas (v=2)
  const fullResponse = {
    stats,
    logs: filteredLogs.slice(0, limit),
    total: logs.length
  };
  
  try {
    fullResponse.fileInfo = {
      exists: fs.existsSync(LOGS_FILE),
      path: LOGS_FILE,
      lastUpdated: fs.existsSync(LOGS_FILE) ? 
        new Date(fs.statSync(LOGS_FILE).mtime).toISOString() : 
        new Date().toISOString()
    };
  } catch (error) {
    fullResponse.fileInfo = {
      exists: false,
      path: LOGS_FILE,
      error: error.message
    };
  }
  
  // Se solicitado v=2, retorna resposta completa
  if (req.query.v === '2') {
    return res.json(fullResponse);
  }
  
  // Se solicitado v=3, retorna apenas stats para dashboard
  if (req.query.v === '3') {
    // Verificar se stats existe
    if (!stats) {
      stats = {
        total: logs.length,
        filtered: filteredLogs.length,
        byMethod: {},
        byStatusCode: {},
        avgResponseTime: 0
      };
    }
    return res.json(stats);
  }
  
  // Compatibilidade com versão anterior
  res.json({
    total: logs.length,
    logs: filteredLogs.slice(0, limit)
  });
});

// Rota para limpar logs (apenas para administração)
app.delete('/api/logs', (req, res) => {
  const token = req.query.token;
  if (token !== 'forja-secret-2026') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  const oldCount = logs.length;
  logs = [];
  saveLogs();
  
  res.json({
    message: `Logs limpos (${oldCount} registros removidos)`,
    timestamp: new Date().toISOString()
  });
});

// Rota de status do sistema
app.get('/api/system', (req, res) => {
  const os = require('os');
  
  res.json({
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
    freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
    loadAverage: os.loadavg(),
    uptime: os.uptime(),
    hostname: os.hostname()
  });
});

// Dashboard administrativa
app.get('/dashboard', (req, res) => {
  const token = req.query.token;
  if (token !== 'forja-secret-2026') {
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Acesso Negado - Forja do Ace</title></head>
      <body style="background: #0f172a; color: white; text-align: center; padding: 50px;">
        <h1>🔒 Acesso Negado</h1>
        <p>Token de acesso inválido ou ausente.</p>
        <a href="/" style="color: #60a5fa;">Voltar para a página principal</a>
      </body>
      </html>
    `);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - Forja do Ace</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f1f5f9;
          min-height: 100vh;
          padding: 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { margin-bottom: 2rem; }
        h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .subtitle { color: #94a3b8; margin-bottom: 2rem; }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid #334155;
          border-radius: 1rem;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
        }
        .card-title {
          font-size: 1.2rem;
          color: #60a5fa;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .metric {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .metric.up { color: #86efac; }
        .metric.down { color: #f87171; }
        .log-entry {
          padding: 0.75rem;
          border-bottom: 1px solid #334155;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .log-entry:last-child { border-bottom: none; }
        .log-time { color: #a78bfa; }
        .log-method { color: #fbbf24; }
        .log-path { color: #60a5fa; }
        .log-ip { color: #86efac; }
        .log-status { 
          font-weight: bold;
          padding: 0.2rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          margin-left: 0.5rem;
        }
        .log-status.success { background: #064e3b; color: #86efac; }
        .log-status.error { background: #7f1d1d; color: #f87171; }
        .log-status.redirect { background: #78350f; color: #fbbf24; }
        .log-response { color: #cbd5e1; margin-left: 0.5rem; }
        .refresh-btn {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: bold;
          cursor: pointer;
          margin-bottom: 1rem;
        }
        .back-link {
          color: #94a3b8;
          text-decoration: none;
          display: inline-block;
          margin-top: 1rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .stat-card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid #334155;
          border-radius: 0.75rem;
          padding: 1rem;
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #60a5fa;
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: #94a3b8;
        }
        
        .filter-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        
        .filter-input {
          padding: 0.5rem 1rem;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid #334155;
          border-radius: 0.5rem;
          color: white;
          min-width: 200px;
        }
        
        .filter-btn {
          padding: 0.5rem 1rem;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
        }
        
        .danger-btn {
          background: linear-gradient(90deg, #dc2626, #b91c1c);
          margin-left: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚒️ Dashboard da Forja do Ace</h1>
          <p class="subtitle">Monitoramento em tempo real do sistema</p>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
            <button class="refresh-btn" onclick="loadData()">🔄 Atualizar Dados</button>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>WebSocket:</span>
              <span id="ws-status" style="font-weight: bold;">🟡 Conectando...</span>
            </div>
          </div>
        </div>
        
        <div class="cards">
          <div class="card">
            <div class="card-title">📊 Status do Sistema</div>
            <div id="system-status">Carregando...</div>
          </div>
          
          <div class="card">
            <div class="card-title">📈 Métricas do Servidor</div>
            <div id="server-metrics">Carregando...</div>
          </div>
          
          <div class="card">
            <div class="card-title">📝 Logs do Sistema</div>
            <div id="logs-stats">Carregando estatísticas...</div>
            <div class="filter-controls">
              <input type="text" id="filter-input" class="filter-input" placeholder="Filtrar por path, método, status ou IP">
              <button onclick="filterLogs()" class="filter-btn">🔍 Filtrar</button>
              <button onclick="clearFilter()" class="filter-btn">🗑️ Limpar Filtro</button>
              <button onclick="clearAllLogs()" class="filter-btn danger-btn">⚠️ Limpar Todos os Logs</button>
            </div>
            <div id="logs-container">Carregando logs...</div>
          </div>
        </div>
        
        <a href="/" class="back-link">← Voltar para a página principal</a>
      </div>
      
      <script>
        async function loadData() {
          try {
            // Carregar status do sistema
            const systemRes = await fetch('/api/system');
            const systemData = await systemRes.json();
            
            document.getElementById('system-status').innerHTML = \`
              <div class="metric up">🟢 Online</div>
              <p><strong>Hostname:</strong> \${systemData.hostname}</p>
              <p><strong>Plataforma:</strong> \${systemData.platform} (\${systemData.arch})</p>
              <p><strong>CPUs:</strong> \${systemData.cpus}</p>
              <p><strong>Memória:</strong> \${systemData.freeMemory} livre de \${systemData.totalMemory}</p>
              <p><strong>Uptime:</strong> \${Math.round(systemData.uptime / 3600)} horas</p>
            \`;
            
            // Carregar métricas do servidor
            const heartbeatRes = await fetch('/api/heartbeat');
            const heartbeatData = await heartbeatRes.json();
            
            const memory = heartbeatData.memory;
            const memoryUsage = Math.round((memory.heapUsed / memory.heapTotal) * 100);
            
            document.getElementById('server-metrics').innerHTML = \`
              <div class="metric \${memoryUsage > 80 ? 'down' : 'up'}">\${memoryUsage}% Memória Heap</div>
              <p><strong>Uptime:</strong> \${Math.round(heartbeatData.uptime)} segundos</p>
              <p><strong>Versão:</strong> \${heartbeatData.version}</p>
              <p><strong>Logs registrados:</strong> \${heartbeatData.logsCount}</p>
              <p><strong>Último heartbeat:</strong> \${new Date(heartbeatData.timestamp).toLocaleString('pt-BR')}</p>
            \`;
            
            // Carregar logs
            await loadLogs();
            
          } catch (error) {
            console.error('Erro ao carregar dados:', error);
            document.getElementById('system-status').innerHTML = '<p style="color: #f87171;">Erro ao carregar dados</p>';
          }
        }
        
        async function loadLogs(filter = '') {
          try {
            const url = filter ? \`/api/logs?token=forja-secret-2026&filter=\${encodeURIComponent(filter)}&v=3\` : '/api/logs?token=forja-secret-2026&v=3';
            const logsRes = await fetch(url);
            const logsData = await logsRes.json();
            
            // Carregar logs completos separadamente
            const logsUrl = filter ? \`/api/logs?token=forja-secret-2026&filter=\${encodeURIComponent(filter)}\` : '/api/logs?token=forja-secret-2026';
            const fullLogsRes = await fetch(logsUrl);
            const fullLogsData = await fullLogsRes.json();
            
            // Atualizar estatísticas
            const stats = logsData.stats || {};
            document.getElementById('logs-stats').innerHTML = \`
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">\${stats.total || 0}</div>
                  <div class="stat-label">Total de Logs</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">\${stats.filtered || 0}</div>
                  <div class="stat-label">Filtrados</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">\${stats.avgResponseTime || 0}ms</div>
                  <div class="stat-label">Tempo Médio</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">\${Object.keys(stats.byMethod || {}).length}</div>
                  <div class="stat-label">Métodos Únicos</div>
                </div>
              </div>
            \`;
            
            // Renderizar logs
            let logsHTML = '';
            (fullLogsData.logs || []).forEach(log => {
              const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
              const statusClass = log.statusCode >= 500 ? 'error' : 
                                 log.statusCode >= 400 ? 'error' :
                                 log.statusCode >= 300 ? 'redirect' : 'success';
              
              logsHTML += \`
                <div class="log-entry">
                  <span class="log-time">[\${time}]</span>
                  <span class="log-method"> \${log.method}</span>
                  <span class="log-path"> \${log.path}</span>
                  <span class="log-status \${statusClass}">\${log.statusCode || 'N/A'}</span>
                  <span class="log-response">(\${log.responseTime || 0}ms)</span>
                  <span class="log-ip"> - \${log.ip}</span>
                </div>
              \`;
            });
            
            document.getElementById('logs-container').innerHTML = logsHTML || '<p>Nenhum log disponível</p>';
            
          } catch (error) {
            console.error('Erro ao carregar logs:', error);
            document.getElementById('logs-container').innerHTML = '<p style="color: #f87171;">Erro ao carregar logs</p>';
          }
        }
        
        function filterLogs() {
          const filter = document.getElementById('filter-input').value;
          loadLogs(filter);
        }
        
        function clearFilter() {
          document.getElementById('filter-input').value = '';
          loadLogs();
        }
        
        async function clearAllLogs() {
          if (!confirm('⚠️ Tem certeza que deseja limpar TODOS os logs? Esta ação não pode ser desfeita.')) {
            return;
          }
          
          try {
            const response = await fetch('/api/logs?token=forja-secret-2026', {
              method: 'DELETE'
            });
            const result = await response.json();
            alert(result.message);
            loadLogs();
          } catch (error) {
            alert('Erro ao limpar logs: ' + error.message);
          }
        }
            
          } catch (error) {
            console.error('Erro ao carregar dados:', error);
            document.getElementById('system-status').innerHTML = '<p style="color: #f87171;">Erro ao carregar dados</p>';
          }
        }
        
        // Carregar dados inicialmente
        loadData();
        
        // Atualizar a cada 30 segundos
        setInterval(loadData, 30000);
        
        // WebSocket para atualizações em tempo real
        let ws = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        function connectWebSocket() {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = \`\${protocol}//\${window.location.host}\`;
          
          ws = new WebSocket(wsUrl);
          
          ws.onopen = () => {
            console.log('✅ WebSocket conectado');
            reconnectAttempts = 0;
            
            // Inscrever para receber atualizações
            ws.send(JSON.stringify({ type: 'subscribe_logs' }));
            ws.send(JSON.stringify({ type: 'subscribe_stats' }));
            
            // Atualizar status
            document.getElementById('ws-status').innerHTML = '<span style="color: #86efac;">🟢 Conectado</span>';
          };
          
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              switch (data.type) {
                case 'new_log':
                  // Adicionar novo log no topo
                  addNewLog(data.log);
                  updateStats(data.stats || calculateStatsFromLogs());
                  break;
                  
                case 'stats_update':
                  // Atualizar estatísticas
                  updateStats(data.stats);
                  break;
                  
                case 'subscribed':
                  console.log(\`✅ Inscrito no canal: \${data.channel}\`);
                  break;
                  
                case 'pong':
                  // Heartbeat respondido
                  break;
              }
            } catch (error) {
              console.error('❌ Erro ao processar mensagem WebSocket:', error);
            }
          };
          
          ws.onclose = () => {
            console.log('❌ WebSocket desconectado');
            document.getElementById('ws-status').innerHTML = '<span style="color: #fbbf24;">🟡 Reconectando...</span>';
            
            // Tentar reconectar
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              setTimeout(connectWebSocket, 1000 * reconnectAttempts);
            } else {
              document.getElementById('ws-status').innerHTML = '<span style="color: #f87171;">🔴 Desconectado</span>';
            }
          };
          
          ws.onerror = (error) => {
            console.error('❌ Erro no WebSocket:', error);
          };
        }
        
        function addNewLog(log) {
          const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
          const statusClass = log.statusCode >= 500 ? 'error' : 
                             log.statusCode >= 400 ? 'error' :
                             log.statusCode >= 300 ? 'redirect' : 'success';
          
          const logHTML = \`
            <div class="log-entry">
              <span class="log-time">[\${time}]</span>
              <span class="log-method"> \${log.method}</span>
              <span class="log-path"> \${log.path}</span>
              <span class="log-status \${statusClass}">\${log.statusCode || 'N/A'}</span>
              <span class="log-response">(\${log.responseTime || 0}ms)</span>
              <span class="log-ip"> - \${log.ip}</span>
            </div>
          \`;
          
          const container = document.getElementById('logs-container');
          const firstChild = container.firstChild;
          
          if (firstChild && firstChild.classList && firstChild.classList.contains('log-entry')) {
            container.insertAdjacentHTML('afterbegin', logHTML);
            
            // Manter apenas os últimos 50 logs visíveis
            const entries = container.querySelectorAll('.log-entry');
            if (entries.length > 50) {
              entries[entries.length - 1].remove();
            }
          } else {
            container.innerHTML = logHTML + container.innerHTML;
          }
        }
        
        function updateStats(stats) {
          document.getElementById('logs-stats').innerHTML = \`
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">\${stats.total || 0}</div>
                <div class="stat-label">Total de Logs</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">\${stats.filtered || 0}</div>
                <div class="stat-label">Filtrados</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">\${stats.avgResponseTime || 0}ms</div>
                <div class="stat-label">Tempo Médio</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">\${Object.keys(stats.byMethod || {}).length}</div>
                <div class="stat-label">Métodos Únicos</div>
              </div>
            </div>
          \`;
        }
        
        function calculateStatsFromLogs() {
          const container = document.getElementById('logs-container');
          const entries = container.querySelectorAll('.log-entry');
          
          return {
            total: entries.length,
            filtered: entries.length,
            avgResponseTime: 0,
            byMethod: {},
            byStatusCode: {}
          };
        }
        
        // Conectar WebSocket quando a página carregar
        if (window.WebSocket) {
          connectWebSocket();
        } else {
          console.warn('⚠️ WebSocket não suportado pelo navegador');
          document.getElementById('ws-status').innerHTML = '<span style="color: #f87171;">🔴 Não suportado</span>';
        }
      </script>
    </body>
    </html>
  `);
});

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ healthy: true });
});

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`🔥 Forja do Ace App is running at http://localhost:${PORT}`);
  console.log(`📊 API disponível em http://localhost:${PORT}/api/heartbeat`);
  console.log(`📡 WebSocket Server running on ws://localhost:${PORT}`);
});
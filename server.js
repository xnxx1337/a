const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Arquivo para armazenar dados (simulação de banco de dados)
const DATA_FILE = path.join(__dirname, 'devices.json');

// Inicializar arquivo de dados se não existir
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Função auxiliar para ler dispositivos
function readDevices() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Função auxiliar para salvar dispositivos
function saveDevices(devices) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(devices, null, 2));
}

// Gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== ROTAS DA API ====================

// GET /api/devices - Listar todos os dispositivos
app.get('/api/devices', (req, res) => {
    const devices = readDevices();
    res.json(devices);
});

// POST /api/devices - Adicionar novo dispositivo
app.post('/api/devices', (req, res) => {
    const { ip, type, port, status } = req.body;

    if (!ip || !type || !port) {
        return res.status(400).json({ error: 'Campos obrigatórios: ip, type, port' });
    }

    const devices = readDevices();
    const newDevice = {
        id: generateId(),
        ip,
        type,
        port,
        status: status || 'online',
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    devices.push(newDevice);
    saveDevices(devices);

    res.status(201).json(newDevice);
});

// DELETE /api/devices/:id - Remover dispositivo
app.delete('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    const devices = readDevices();
    const filteredDevices = devices.filter(d => d.id !== id);

    if (devices.length === filteredDevices.length) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    saveDevices(filteredDevices);
    res.json({ message: 'Dispositivo removido com sucesso' });
});

// POST /api/devices/:id/test - Testar dispositivo
app.post('/api/devices/:id/test', (req, res) => {
    const { id } = req.params;
    const devices = readDevices();
    const device = devices.find(d => d.id === id);

    if (!device) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    // Simulação de teste de conectividade
    const latency = Math.floor(Math.random() * 100) + 10; // 10-110ms
    const isOnline = device.status === 'online';
    
    // Atualizar lastSeen
    device.lastSeen = new Date().toISOString();
    saveDevices(devices);

    res.json({
        device,
        latency,
        response: isOnline ? 'Dispositivo respondeu corretamente' : 'Dispositivo offline',
        timestamp: new Date().toISOString()
    });
});

// GET /api/stats - Obter estatísticas
app.get('/api/stats', (req, res) => {
    const devices = readDevices();
    
    const stats = {
        totalDevices: devices.length,
        onlineCameras: devices.filter(d => d.type === 'camera' && d.status === 'online').length,
        totalIoT: devices.filter(d => ['camera', 'iot'].includes(d.type)).length,
        onlineDevices: devices.filter(d => d.status === 'online').length,
        uptimeRate: devices.length > 0 
            ? Math.round((devices.filter(d => d.status === 'online').length / devices.length) * 100)
            : 0
    };

    res.json(stats);
});

// POST /api/commands/:cmd - Executar comando educacional
app.post('/api/commands/:cmd', (req, res) => {
    const { cmd } = req.params;
    const devices = readDevices();
    
    let output = '';

    switch (cmd) {
        case 'ping':
            output = `📡 Ping executado em ${devices.length} dispositivos\n\n`;
            devices.forEach(device => {
                const latency = Math.floor(Math.random() * 50) + 5;
                output += `${device.ip}: tempo=${latency}ms status=${device.status}\n`;
            });
            break;

        case 'status':
            output = `📊 Status dos Dispositivos:\n\n`;
            const stats = {
                total: devices.length,
                online: devices.filter(d => d.status === 'online').length,
                offline: devices.filter(d => d.status === 'offline').length,
                cameras: devices.filter(d => d.type === 'camera').length,
                iot: devices.filter(d => d.type === 'iot').length
            };
            output += `Total: ${stats.total}\n`;
            output += `Online: ${stats.online}\n`;
            output += `Offline: ${stats.offline}\n`;
            output += `Câmeras: ${stats.cameras}\n`;
            output += `IoT: ${stats.iot}\n`;
            break;

        case 'info':
            output = `ℹ️ Informações do Sistema:\n\n`;
            output += `SkyCNC - Sistema Educacional de Botnets\n`;
            output += `Versão: 1.0.0\n`;
            output += `Dispositivos Cadastrados: ${devices.length}\n`;
            output += `Servidor: http://localhost:${PORT}\n`;
            output += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
            break;

        case 'test':
            output = `🧪 Teste de Conectividade:\n\n`;
            devices.forEach(device => {
                const result = device.status === 'online' ? '✅ OK' : '❌ OFFLINE';
                output += `${device.ip}:${device.port} - ${result}\n`;
            });
            break;

        default:
            return res.status(400).json({ error: 'Comando não reconhecido' });
    }

    res.json({ output, timestamp: new Date().toISOString() });
});

// Rota para servir arquivos estáticos (opcional)
app.use(express.static(__dirname));

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🌐 SkyCNC API Server rodando em http://localhost:${PORT}`);
    console.log(`📚 Sistema Educacional de Botnets`);
    console.log(`\n⚠️  AVISO: Este é um sistema educacional apenas!\n`);
});


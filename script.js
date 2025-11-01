const API_URL = 'http://localhost:3000/api';

// Elementos do DOM
const devicesTableBody = document.getElementById('devicesTableBody');
const addDeviceForm = document.getElementById('addDeviceForm');
const refreshBtn = document.getElementById('refreshBtn');
const totalDevicesEl = document.getElementById('totalDevices');
const onlineCamerasEl = document.getElementById('onlineCameras');
const totalIoTEl = document.getElementById('totalIoT');
const uptimeRateEl = document.getElementById('uptimeRate');
const commandOutput = document.getElementById('commandOutput');

// Carregar dispositivos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    loadDevices();
    updateStats();
    
    // Atualizar estatísticas a cada 5 segundos
    setInterval(updateStats, 5000);
});

// Formulário de adicionar dispositivo
addDeviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deviceData = {
        ip: document.getElementById('deviceIp').value,
        type: document.getElementById('deviceType').value,
        port: parseInt(document.getElementById('devicePort').value),
        status: document.getElementById('deviceStatus').value
    };

    try {
        const response = await fetch(`${API_URL}/devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceData)
        });

        if (response.ok) {
            const device = await response.json();
            addDeviceForm.reset();
            loadDevices();
            updateStats();
            showNotification('Dispositivo adicionado com sucesso!', 'success');
        } else {
            throw new Error('Erro ao adicionar dispositivo');
        }
    } catch (error) {
        showNotification('Erro ao conectar com a API. Certifique-se de que o servidor está rodando.', 'error');
        console.error('Erro:', error);
    }
});

// Botão de atualizar
refreshBtn.addEventListener('click', () => {
    loadDevices();
    updateStats();
    showNotification('Lista atualizada!', 'success');
});

// Botões de comando
document.querySelectorAll('.cmd-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const cmd = btn.dataset.cmd;
        await executeCommand(cmd);
    });
});

// Carregar dispositivos
async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/devices`);
        if (response.ok) {
            const devices = await response.json();
            renderDevices(devices);
        } else {
            throw new Error('Erro ao carregar dispositivos');
        }
    } catch (error) {
        devicesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    ⚠️ Erro ao conectar com a API. Certifique-se de que o servidor está rodando na porta 3000.
                </td>
            </tr>
        `;
        console.error('Erro:', error);
    }
}

// Renderizar dispositivos na tabela
function renderDevices(devices) {
    if (devices.length === 0) {
        devicesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">Nenhum dispositivo cadastrado ainda. Adicione um dispositivo acima.</td>
            </tr>
        `;
        return;
    }

    devicesTableBody.innerHTML = devices.map(device => `
        <tr>
            <td>#${device.id}</td>
            <td>${device.ip}</td>
            <td>${getDeviceTypeIcon(device.type)} ${device.type}</td>
            <td>${device.port}</td>
            <td><span class="status-badge status-${device.status}">${device.status}</span></td>
            <td>${formatDate(device.lastSeen)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteDevice(${device.id})">🗑️ Remover</button>
                <button class="btn btn-sm btn-secondary" onclick="testDevice(${device.id})">🧪 Testar</button>
            </td>
        </tr>
    `).join('');
}

// Obter ícone do tipo de dispositivo
function getDeviceTypeIcon(type) {
    const icons = {
        'camera': '📹',
        'router': '📡',
        'iot': '🔌',
        'other': '🖥️'
    };
    return icons[type] || '🖥️';
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

// Atualizar estatísticas
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        if (response.ok) {
            const stats = await response.json();
            totalDevicesEl.textContent = stats.totalDevices || 0;
            onlineCamerasEl.textContent = stats.onlineCameras || 0;
            totalIoTEl.textContent = stats.totalIoT || 0;
            uptimeRateEl.textContent = `${stats.uptimeRate || 0}%`;
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Deletar dispositivo
async function deleteDevice(id) {
    if (!confirm('Tem certeza que deseja remover este dispositivo?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/devices/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadDevices();
            updateStats();
            showNotification('Dispositivo removido com sucesso!', 'success');
        } else {
            throw new Error('Erro ao remover dispositivo');
        }
    } catch (error) {
        showNotification('Erro ao remover dispositivo', 'error');
        console.error('Erro:', error);
    }
}

// Testar dispositivo
async function testDevice(id) {
    commandOutput.textContent = 'Testando dispositivo...';
    
    try {
        const response = await fetch(`${API_URL}/devices/${id}/test`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            commandOutput.textContent = `✅ Teste bem-sucedido!\n\nDispositivo: ${result.device.ip}\nStatus: ${result.device.status}\nLatência: ${result.latency}ms\nResposta: ${result.response}`;
        } else {
            throw new Error('Erro ao testar dispositivo');
        }
    } catch (error) {
        commandOutput.textContent = `❌ Erro ao testar dispositivo: ${error.message}`;
        console.error('Erro:', error);
    }
}

// Executar comando
async function executeCommand(cmd) {
    commandOutput.textContent = `Executando comando: ${cmd}...`;
    
    try {
        const response = await fetch(`${API_URL}/commands/${cmd}`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            commandOutput.textContent = result.output || 'Comando executado com sucesso!';
        } else {
            throw new Error('Erro ao executar comando');
        }
    } catch (error) {
        commandOutput.textContent = `❌ Erro ao executar comando: ${error.message}`;
        console.error('Erro:', error);
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Adicionar animações CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


// State
let players = [];
let courtCount = 2;

// DOM Elements
const playerNameInput = document.getElementById('playerName');
const playerLevelInput = document.getElementById('playerLevel');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const bulkInput = document.getElementById('bulkInput');
const parseBtn = document.getElementById('parseBtn');
const courtCountDisplay = document.getElementById('courtCountDisplay');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const playerList = document.getElementById('playerList');
const playerCountBadge = document.getElementById('playerCount');
const matchContainer = document.getElementById('matchContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderPlayers();
});

// Event Listeners
addPlayerBtn.addEventListener('click', addSinglePlayer);
parseBtn.addEventListener('click', parseBulkInput);
generateBtn.addEventListener('click', generateMatches);
clearBtn.addEventListener('click', clearAllPlayers);

// Functions

function addSinglePlayer() {
    const name = playerNameInput.value.trim();
    const level = parseInt(playerLevelInput.value);

    if (!name) {
        alert('請輸入姓名');
        return;
    }
    if (isNaN(level) || level < 1 || level > 10) {
        alert('請輸入有效的等級 (1-10)');
        return;
    }

    addPlayerToState(name, level);
    playerNameInput.value = '';
    playerLevelInput.value = '';
    playerNameInput.focus();
}

function parseBulkInput() {
    const text = bulkInput.value;
    if (!text.trim()) return;

    const lines = text.split(/\n/);
    let addedCount = 0;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // Strategy: Try to match "Name Level" first. If that fails, assume just "Name".

        // 1. Try to match: ID(opt) Name Level Extra(opt)
        // Regex: Start, ID(opt), Name(Greedy), Space, Level, Extra(opt)
        let match = line.match(/^(?:(\d+)[\.\s]*)?\s*(.+)\s+(\d+).*$/);

        let name, level;

        if (match) {
            name = match[2].trim();
            level = parseInt(match[3]);
        } else {
            // 2. Fallback: ID(opt) Name
            match = line.match(/^(?:(\d+)[\.\s]*)?\s*(.+).*$/);
            if (match) {
                name = match[2].trim();
                level = 5; // Default level
            }
        }

        if (name) {
            addPlayerToState(name, level);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        bulkInput.value = '';
        alert(`成功匯入 ${addedCount} 位選手！`);
    } else {
        alert('無法辨識格式，請確認格式為：姓名 等級 (例如：小明 7)');
    }
}

function addPlayerToState(name, level) {
    const player = {
        id: Date.now() + Math.random(),
        name: name,
        level: level
    };
    players.push(player);
    saveToStorage();
    renderPlayers();
}

function removePlayer(id) {
    players = players.filter(p => p.id !== id);
    saveToStorage();
    renderPlayers();
}

function clearAllPlayers() {
    if (confirm('確定要清空所有選手名單嗎？')) {
        players = [];
        saveToStorage();
        renderPlayers();
        matchContainer.innerHTML = '<div class="empty-state">點擊「產生對戰表」開始排點</div>';
    }
}

function adjustCourt(delta) {
    let newCount = courtCount + delta;
    if (newCount < 1) newCount = 1;
    if (newCount > 10) newCount = 10;
    courtCount = newCount;
    courtCountDisplay.textContent = courtCount;
}

function renderPlayers() {
    playerList.innerHTML = '';
    playerCountBadge.textContent = players.length;

    if (players.length === 0) {
        playerList.innerHTML = '<div class="empty-state">尚未加入選手</div>';
        return;
    }

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <span class="delete-player" onclick="removePlayer(${player.id})">✕</span>
            <div class="player-name">${player.name}</div>
            <div class="player-level">Lv.${player.level}</div>
        `;
        playerList.appendChild(card);
    });
}

localStorage.setItem('badminton_players', JSON.stringify(players));
}

function loadFromStorage() {
    const data = localStorage.getItem('badminton_players');
    if (data) {
        players = JSON.parse(data);
    }
}

// Expose removePlayer to global scope for the inline onclick handler
window.removePlayer = removePlayer;
window.adjustCourt = adjustCourt;

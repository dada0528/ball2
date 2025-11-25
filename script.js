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

function generateMatches() {
    if (players.length < 4) {
        alert('至少需要 4 位選手才能開始比賽！');
        return;
    }

    // Sort by "Effective Level" to add variety while keeping balance
    // Effective Level = Real Level + Random Noise (-1.5 to +1.5)
    const sortedPlayers = [...players].sort((a, b) => {
        const noiseA = (Math.random() * 3) - 1.5;
        const noiseB = (Math.random() * 3) - 1.5;
        const levelA = a.level + noiseA;
        const levelB = b.level + noiseB;
        return levelB - levelA;
    });

    matchContainer.innerHTML = '';

    const playersPerMatch = 4;
    const totalMatches = Math.floor(sortedPlayers.length / playersPerMatch);

    if (totalMatches === 0) {
        matchContainer.innerHTML = '<div class="empty-state">人數不足以湊成一場比賽</div>';
        return;
    }

    // Create ALL matches
    for (let i = 0; i < totalMatches; i++) {
        const group = sortedPlayers.slice(i * 4, (i + 1) * 4);

        // Balance within the group: Strongest + Weakest vs Middle Two
        group.sort((a, b) => b.level - a.level);
        const teamA = [group[0], group[3]];
        const teamB = [group[1], group[2]];

        // Determine if this match is on a court or waiting
        const isCourt = i < courtCount;
        const matchTitle = isCourt ? `第 ${i + 1} 場地` : `候補對戰 ${i - courtCount + 1}`;
        const cardClass = isCourt ? 'court-card' : 'court-card waiting-card';
        const badgeColor = isCourt ? 'var(--accent)' : 'var(--text-muted)';

        const matchEl = document.createElement('div');
        matchEl.className = cardClass;
        matchEl.style.animationDelay = `${i * 0.1}s`;

        // Calculate average level for display
        const avgLevel = (group.reduce((acc, p) => acc + p.level, 0) / 4).toFixed(1);

        matchEl.innerHTML = `
            <div class="court-header">
                <span class="court-title">${matchTitle}</span>
                <span style="font-size: 0.8rem; color: var(--text-muted)">均等: ${avgLevel}</span>
            </div>
            <div class="match-vs">
                <div class="team">
                    <div class="team-player">${teamA[0].name} <span style="font-size:0.8em; opacity:0.7">(${teamA[0].level})</span></div>
                    <div class="team-player">${teamA[1].name} <span style="font-size:0.8em; opacity:0.7">(${teamA[1].level})</span></div>
                </div>
                <div class="vs-badge" style="background: ${badgeColor}">VS</div>
                <div class="team">
                    <div class="team-player">${teamB[0].name} <span style="font-size:0.8em; opacity:0.7">(${teamB[0].level})</span></div>
                    <div class="team-player">${teamB[1].name} <span style="font-size:0.8em; opacity:0.7">(${teamB[1].level})</span></div>
                </div>
            </div>
        `;
        matchContainer.appendChild(matchEl);
    }

    // Show waiting players (Leftovers who didn't make a full match)
    const waitingPlayers = sortedPlayers.slice(totalMatches * 4);
    if (waitingPlayers.length > 0) {
        const waitingEl = document.createElement('div');
        waitingEl.style.padding = '1rem';
        waitingEl.style.color = 'var(--text-muted)';
        waitingEl.style.textAlign = 'center';
        waitingEl.style.background = 'rgba(0,0,0,0.2)';
        waitingEl.style.borderRadius = '8px';
        waitingEl.innerHTML = `<strong>輪空休息：</strong> ${waitingPlayers.map(p => `${p.name} (${p.level})`).join(', ')}`;
        matchContainer.appendChild(waitingEl);
    }
}

function saveToStorage() {
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

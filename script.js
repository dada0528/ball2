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

        // Regex to match "Name Level" or just "Name"
        // Supports: "Name 8", "Name, 8", "Name", "Name8"
        // Captures: Group 1 (Name), Group 2 (Level - optional)
        const match = line.match(/^([^\d,]+)[,\s]*(\d+)?$/);

        if (match) {
            const name = match[1].trim();
            // Default level 5 if not specified
            const level = match[2] ? parseInt(match[2]) : 5; 
            
            if (name) {
                addPlayerToState(name, level);
                addedCount++;
            }
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

    // Sort by level descending (Strongest first)
    // Add a small random factor to shuffle players with same level
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.level !== b.level) return b.level - a.level;
        return Math.random() - 0.5;
    });

    const matches = [];
    const playersPerMatch = 4;
    const maxMatches = Math.min(courtCount, Math.floor(sortedPlayers.length / playersPerMatch));

    // Take the top N*4 players for the matches
    const activePlayers = sortedPlayers.slice(0, maxMatches * playersPerMatch);
    const waitingPlayers = sortedPlayers.slice(maxMatches * playersPerMatch);

    matchContainer.innerHTML = '';

    if (maxMatches === 0) {
        matchContainer.innerHTML = '<div class="empty-state">人數不足以湊成一場比賽</div>';
        return;
    }

    // Create matches
    for (let i = 0; i < maxMatches; i++) {
        // Get 4 players for this court
        // Strategy: To balance, we can take 4 players with similar skill levels (competitive)
        // OR take 1 strong, 1 weak, etc.
        // Here we take chunks of 4 from the sorted list (similar skill levels play together)
        // This usually makes for better games than mixing Lv10 with Lv1.
        
        const group = activePlayers.slice(i * 4, (i + 1) * 4);
        
        // Within this group of 4 similar level players, we balance them.
        // Sort this small group by level again to be sure
        group.sort((a, b) => b.level - a.level);
        
        // P1 (Strongest), P2, P3, P4 (Weakest)
        // Team A: P1 + P4
        // Team B: P2 + P3
        const teamA = [group[0], group[3]];
        const teamB = [group[1], group[2]];

        const matchEl = document.createElement('div');
        matchEl.className = 'court-card';
        matchEl.style.animationDelay = `${i * 0.1}s`;
        matchEl.innerHTML = `
            <div class="court-header">
                <span class="court-title">第 ${i + 1} 場地</span>
                <span style="font-size: 0.8rem; color: var(--text-muted)">均等: ${((group.reduce((acc, p) => acc + p.level, 0)) / 4).toFixed(1)}</span>
            </div>
            <div class="match-vs">
                <div class="team">
                    <div class="team-player">${teamA[0].name} <span style="font-size:0.8em; opacity:0.7">(${teamA[0].level})</span></div>
                    <div class="team-player">${teamA[1].name} <span style="font-size:0.8em; opacity:0.7">(${teamA[1].level})</span></div>
                </div>
                <div class="vs-badge">VS</div>
                <div class="team">
                    <div class="team-player">${teamB[0].name} <span style="font-size:0.8em; opacity:0.7">(${teamB[0].level})</span></div>
                    <div class="team-player">${teamB[1].name} <span style="font-size:0.8em; opacity:0.7">(${teamB[1].level})</span></div>
                </div>
            </div>
        `;
        matchContainer.appendChild(matchEl);
    }

    // Show waiting players if any
    if (waitingPlayers.length > 0) {
        const waitingEl = document.createElement('div');
        waitingEl.style.padding = '1rem';
        waitingEl.style.color = 'var(--text-muted)';
        waitingEl.style.textAlign = 'center';
        waitingEl.innerHTML = `<strong>候補/休息：</strong> ${waitingPlayers.map(p => p.name).join(', ')}`;
        matchContainer.appendChild(waitingEl);
    }
}

// Local Storage Helper
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

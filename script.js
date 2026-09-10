function getLogoUrl(team) {
    if (!team) return '';
    const teamFilename = team.toLowerCase() === "como" ? "como-1907" : team.toLowerCase();
    return `logos/italy_${teamFilename}_3000x3000.football-logos.cc.png`;
}

const ROLE_SLOTS = { P: 3, D: 8, C: 8, A: 6 };
const INITIAL_CREDITS = 500;

const ROLE_COLORS = {
    P: { bg: '#fef9c3', text: '#854d0e' },
    D: { bg: '#dcfce7', text: '#166534' },
    C: { bg: '#e0f2fe', text: '#075985' },
    A: { bg: '#fee2e2', text: '#991b1b' }
};

let teams = JSON.parse(localStorage.getItem('fanta_teams')) || [];
let currentViewMode = 'cards';
let selectedPlayerFromDb = null;

// STATO ASTA LIVE & AUDIO
let currentCalledPlayer = null;
let timerInterval = null;
let timeLeft = 5;
let isAudioMuted = false; // Stato per attivare/disattivare l'audio

// Web Audio API per generare i beep senza file esterni
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Funzione per attivare/disattivare i suoni del timer
function toggleAudioMute() {
    isAudioMuted = !isAudioMuted;
    const btn = document.getElementById('btnToggleAudio');
    if (btn) {
        if (isAudioMuted) {
            btn.textContent = '🔇 Suono Disattivato';
            btn.style.backgroundColor = '#f87171';
            btn.style.color = '#ffffff';
        } else {
            btn.textContent = '🔊 Suono Attivo';
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }
    }
}

// Funzione per suonare un Beep sintetico
function playBeep(freq = 800, duration = 0.15, type = 'sine', forcePlay = false) {
    // Se l'audio è disattivato e non è un test manuale, non suonare
    if (isAudioMuted && !forcePlay) return;

    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Inviluppo del volume per evitare i "pop"
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio non supportato o bloccato dal browser", e);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('fanta_teams', JSON.stringify(teams));
}

function addTeam() {
    const input = document.getElementById('newTeamName');
    const name = input.value.trim();
    if (!name) return;

    const team = {
        name: name,
        credits: INITIAL_CREDITS,
        players: { P: [], D: [], C: [], A: [] }
    };

    teams.push(team);
    input.value = '';
    saveToLocalStorage();
    updateUI();
}

function removeTeam(index) {
    if (confirm(`Sei sicuro di voler eliminare la squadra "${teams[index].name}"?`)) {
        teams.splice(index, 1);
        saveToLocalStorage();
        updateUI();
    }
}

// LOGICA ASTA LIVE
function getAllPurchasedPlayerNames() {
    const purchased = new Set();
    teams.forEach(t => {
        ['P', 'D', 'C', 'A'].forEach(role => {
            t.players[role].forEach(p => purchased.add(p.name.toLowerCase()));
        });
    });
    return purchased;
}

function callRandomPlayer() {
    initAudio();
    clearInterval(timerInterval);
    
    const role = document.getElementById('auctionRoleSelect').value;
    const purchasedNames = getAllPurchasedPlayerNames();

    let availablePlayers = PLAYERS_DB.filter(p => !purchasedNames.has(p.name.toLowerCase()));

    if (role !== 'ALL') {
        availablePlayers = availablePlayers.filter(p => p.role === role);
    }

    if (availablePlayers.length === 0) {
        alert("Tutti i calciatori per questo ruolo/selezione sono già stati acquistati!");
        return;
    }

    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    currentCalledPlayer = availablePlayers[randomIndex];

    document.getElementById('activePlayerCard').style.display = 'flex';
    document.getElementById('activePlayerName').textContent = currentCalledPlayer.name;
    document.getElementById('activePlayerClub').textContent = currentCalledPlayer.team ? `(${currentCalledPlayer.team})` : '';
    
    const roleBadge = document.getElementById('activePlayerRole');
    roleBadge.textContent = currentCalledPlayer.role;
    roleBadge.className = `role-badge badge-${currentCalledPlayer.role}`;

    const logoImg = document.getElementById('activeTeamLogo');
    const logoUrl = getLogoUrl(currentCalledPlayer.team);
    if (logoUrl) {
        logoImg.src = logoUrl;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }

    document.getElementById('playerName').value = currentCalledPlayer.name;
    document.getElementById('playerRole').value = currentCalledPlayer.role;
    selectedPlayerFromDb = currentCalledPlayer;

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    const configuredTime = parseInt(document.getElementById('auctionTimerInput').value) || 5;
    timeLeft = configuredTime;
    
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        // LOGICA AUDIO PER GLI ULTIMI SECONDI (controlla lo stato Mute in playBeep)
        if (timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
            playBeep(750, 0.15);
        } else if (timeLeft === 0) {
            playBeep(1200, 0.4, 'square');
            clearInterval(timerInterval);
        }
    }, 1000);
}

function resetTimer() {
    if (!currentCalledPlayer) return;
    initAudio();
    startTimer();
}

function updateTimerDisplay() {
    const display = document.getElementById('timerCountdown');
    if (display) {
        display.textContent = timeLeft;
    }
}

function cancelCall() {
    clearInterval(timerInterval);
    currentCalledPlayer = null;
    document.getElementById('activePlayerCard').style.display = 'none';
    document.getElementById('playerName').value = '';
    selectedPlayerFromDb = null;
}

function markAsUnsold() {
    cancelCall();
}

// Scorciatoia Tastiera: BARRA SPAZIATRICE = Rilancio
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && currentCalledPlayer) {
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'select') {
            event.preventDefault();
            resetTimer();
        }
    }
});

// Autocompletamento Calciatori
function onPlayerInput(val) {
    const listContainer = document.getElementById('autocompleteList');
    listContainer.innerHTML = '';
    selectedPlayerFromDb = null;

    if (!val || val.length < 2) return;

    const query = val.toLowerCase();
    const matches = PLAYERS_DB.filter(p => p.name.toLowerCase().includes(query));

    matches.slice(0, 6).forEach(player => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        
        const logoUrl = getLogoUrl(player.team);
        const logoHtml = logoUrl ? `<img src="${logoUrl}" class="team-logo" onerror="this.style.display='none'">` : '';

        item.innerHTML = `
            ${logoHtml}
            <div>
                <strong>${player.name}</strong> 
                <small style="color:var(--text-muted)">(${player.role})</small>
            </div>
        `;

        item.onclick = function() {
            document.getElementById('playerName').value = player.name;
            document.getElementById('playerRole').value = player.role;
            selectedPlayerFromDb = player;
            listContainer.innerHTML = '';
        };

        listContainer.appendChild(item);
    });
}

document.addEventListener('click', function (e) {
    if (!e.target.closest('.autocomplete-wrapper')) {
        const list = document.getElementById('autocompleteList');
        if (list) list.innerHTML = '';
    }
});

function buyPlayer() {
    const teamIndex = document.getElementById('selectTeam').value;
    const name = document.getElementById('playerName').value.trim();
    const role = document.getElementById('playerRole').value;
    const cost = parseInt(document.getElementById('playerCost').value);

    if (teamIndex === "" || !name || isNaN(cost) || cost <= 0) {
        alert("Inserisci tutti i dati dell'acquisto in modo corretto.");
        return;
    }

    const team = teams[teamIndex];

    if (team.credits < cost) {
        alert("Crediti insufficienti per questa squadra!");
        return;
    }

    const clubTeam = selectedPlayerFromDb ? selectedPlayerFromDb.team : '';

    team.credits -= cost;
    team.players[role].push({ name: name, cost: cost, team: clubTeam });

    document.getElementById('playerName').value = '';
    document.getElementById('playerCost').value = '';
    selectedPlayerFromDb = null;

    cancelCall();

    saveToLocalStorage();
    updateUI();
}

function removePlayer(teamIndex, role, playerIndex) {
    const team = teams[teamIndex];
    const player = team.players[role][playerIndex];
    
    if (confirm(`Vuoi svincolare ${player.name}? Verranno restituiti ${player.cost} crediti.`)) {
        team.credits += player.cost;
        team.players[role].splice(playerIndex, 1);
        saveToLocalStorage();
        updateUI();
    }
}

function toggleRole(element) {
    const list = element.nextElementSibling;
    const arrow = element.querySelector('.arrow-icon');
    if (list.style.display === "none") {
        list.style.display = "block";
        arrow.style.transform = "rotate(0deg)";
    } else {
        list.style.display = "none";
        arrow.style.transform = "rotate(-90deg)";
    }
}

function setViewMode(mode) {
    currentViewMode = mode;
    
    const btnCards = document.getElementById('btnCardsView');
    const btnCompact = document.getElementById('btnCompactView');
    if (btnCards) btnCards.classList.toggle('active', mode === 'cards');
    if (btnCompact) btnCompact.classList.toggle('active', mode === 'compact');
    
    const cardsContainer = document.getElementById('teamsContainer');
    const compactContainer = document.getElementById('compactContainer');
    
    if (cardsContainer && compactContainer) {
        if (mode === 'cards') {
            cardsContainer.style.setProperty('display', 'flex', 'important');
            compactContainer.style.setProperty('display', 'none', 'important');
        } else {
            cardsContainer.style.setProperty('display', 'none', 'important');
            compactContainer.style.setProperty('display', 'block', 'important');
        }
    }
    
    updateUI();
}

function searchPlayers() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const playerItems = document.querySelectorAll('.player-item');

    playerItems.forEach(item => {
        const nameText = item.querySelector('.player-name')?.textContent.toLowerCase() || '';
        if (query !== '' && nameText.includes(query)) {
            item.classList.add('highlight');
            const list = item.closest('.player-list');
            if (list) list.style.display = "block";
        } else {
            item.classList.remove('highlight');
        }
    });
}

function exportToCSV() {
    if (teams.length === 0) {
        alert("Nessuna squadra da esportare.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Squadra,Ruolo,Calciatore,Costo\n";

    teams.forEach(team => {
        ['P', 'D', 'C', 'A'].forEach(role => {
            team.players[role].forEach(player => {
                csvContent += `"${team.name}","${role}","${player.name}",${player.cost}\n`;
            });
        });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "asta_fantacalcio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetAll() {
    if (confirm("ATTENZIONE: Sei sicuro di voler azzerare l'intera asta? Tutti i dati verranno cancellati!")) {
        teams = [];
        localStorage.removeItem('fanta_teams');
        updateUI();
    }
}

function updateUI() {
    const select = document.getElementById('selectTeam');
    if (select) {
        const currentSelectValue = select.value;
        select.innerHTML = '<option value="">Seleziona Squadra</option>';
        teams.forEach((team, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = team.name;
            select.appendChild(option);
        });
        select.value = currentSelectValue;
    }

    if (currentViewMode === 'cards') {
        renderCardsView();
    } else {
        renderCompactView();
    }
}

function renderCardsView() {
    const container = document.getElementById('teamsContainer');
    if (!container) return;
    container.innerHTML = '';

    teams.forEach((team, teamIndex) => {
        const card = document.createElement('div');
        card.className = 'team-card';
        
        let html = `
            <div class="team-header">
                <div>
                    <div class="team-name">${team.name}</div>
                    <button class="delete-btn" onclick="removeTeam(${teamIndex})">Elimina squadra</button>
                </div>
                <div class="credits-badge">${team.credits} <small style="font-size:10px; font-weight:normal;">CR</small></div>
            </div>
        `;

        const roles = [
            { key: 'P', label: 'Portieri' },
            { key: 'D', label: 'Difensori' },
            { key: 'C', label: 'Centrocampisti' },
            { key: 'A', label: 'Attaccanti' }
        ];

        roles.forEach(role => {
            const playerList = team.players[role.key];
            const maxSlot = ROLE_SLOTS[role.key];
            
            const spentInRole = playerList.reduce((sum, p) => sum + p.cost, 0);
            const spentPercentage = Math.round((spentInRole / INITIAL_CREDITS) * 100);

            html += `
                <div class="role-section">
                    <div class="role-header" onclick="toggleRole(this)">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="role-badge badge-${role.key}">${role.key}</span>
                            <span>${role.label} (${playerList.length}/${maxSlot})</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="role-spent-percentage">${spentPercentage}%</span>
                            <span class="arrow-icon">▼</span>
                        </div>
                    </div>
                    <ul class="player-list">
            `;
            
            if (playerList.length === 0) {
                html += `<li class="player-item" style="color:var(--text-muted); font-style:italic;">Nessun acquisto</li>`;
            } else {
                playerList.forEach((player, playerIndex) => {
                    const logoUrl = getLogoUrl(player.team);
                    const logoHtml = logoUrl ? `<img src="${logoUrl}" class="team-logo" onerror="this.style.display='none'">` : '';

                    html += `
                        <li class="player-item">
                            <div class="player-info">
                                ${logoHtml}
                                <span class="player-name">${player.name}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="player-cost">${player.cost} cr</span>
                                <span class="remove-player-btn" title="Svincola" style="cursor:pointer; color:var(--danger);" onclick="event.stopPropagation(); removePlayer(${teamIndex}, '${role.key}', ${playerIndex})">✕</span>
                            </div>
                        </li>
                    `;
                });
            }

            html += `</ul></div>`;
        });

        card.innerHTML = html;
        container.appendChild(card);
    });
}

function renderCompactView() {
    const container = document.getElementById('compactContainer');
    if (!container) return;

    if (teams.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Nessuna squadra presente.</p>';
        return;
    }

    let html = `<table class="compact-table"><thead><tr>`;
    
    teams.forEach(t => {
        html += `<th>
            <div style="font-size: 14px; font-weight:bold; color:var(--primary);">${t.name}</div>
            <small style="color:var(--success); font-weight:bold;">${t.credits} CR</small>
        </th>`;
    });
    html += `</tr></thead><tbody><tr>`;

    teams.forEach((team) => {
        html += `<td>`;
        ['P', 'D', 'C', 'A'].forEach(role => {
            const players = team.players[role];
            const maxSlot = ROLE_SLOTS[role];
            const color = ROLE_COLORS[role];
            
            html += `<div style="background-color:${color.bg}; color:${color.text}; font-weight:bold; font-size:11px; padding:3px 6px; border-radius:4px; margin-top:8px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                <span>${role}</span>
                <span>${players.length}/${maxSlot}</span>
            </div>`;

            if (players.length === 0) {
                html += `<div style="font-style:italic; color:#94a3b8; font-size:10px; padding-left:4px;">-</div>`;
            } else {
                players.forEach((p) => {
                    const logoUrl = getLogoUrl(p.team);
                    const logoHtml = logoUrl ? `<img src="${logoUrl}" class="team-logo" style="width:12px;height:12px; vertical-align:middle; margin-right:3px;" onerror="this.style.display='none'">` : '';
                    
                    html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:3px; padding:0 2px;">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:95px;" title="${p.name}">
                            ${logoHtml}${p.name}
                        </span>
                        <span style="font-weight:bold; color:var(--text-main); font-size:10px;">${p.cost}</span>
                    </div>`;
                });
            }
        });
        html += `</td>`;
    });

    html += `</tr></tbody></table>`;
    container.innerHTML = html;
}

window.onload = function() {
    setViewMode('cards');
};

window.onload = function() {
    setViewMode('cards');
};

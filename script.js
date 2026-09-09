// Funzione per generare il percorso del logo
function getLogoUrl(team) {
    if (!team) return '';
    const teamFilename = team.toLowerCase() === "como" ? "como-1907" : team.toLowerCase();
    return `logos/italy_${teamFilename}_3000x3000.football-logos.cc.png`;
}

const ROLE_SLOTS = { P: 3, D: 8, C: 8, A: 6 };
const INITIAL_CREDITS = 500;

let teams = JSON.parse(localStorage.getItem('fanta_teams')) || [];
let currentViewMode = 'cards'; // 'cards' oppure 'compact'
let selectedPlayerFromDb = null;

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

// Chiudi la tendina se si clicca fuori
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
    document.getElementById('btnCardsView').classList.toggle('active', mode === 'cards');
    document.getElementById('btnCompactView').classList.toggle('active', mode === 'compact');
    
    document.getElementById('teamsContainer').style.display = mode === 'cards' ? 'flex' : 'none';
    document.getElementById('compactContainer').style.display = mode === 'compact' ? 'block' : 'none';
    
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
                    <button class="delete-btn" style="color:var(--danger); background:none; border:none; cursor:pointer; font-size:11px; padding:0;" onclick="removeTeam(${teamIndex})">Elimina squadra</button>
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
                            <span>${role.label} (${playerList.length}/${maxSlot})</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span>${spentPercentage}%</span>
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
                            <div class="player-info" style="display:flex; align-items:center; gap:6px;">
                                ${logoHtml}
                                <span class="player-name">${player.name}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="player-cost" style="font-weight:bold;">${player.cost} cr</span>
                                <span title="Svincola" style="cursor:pointer; color:var(--danger);" onclick="event.stopPropagation(); removePlayer(${teamIndex}, '${role.key}', ${playerIndex})">✕</span>
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
    
    // Intestazioni squadre affiancate
    teams.forEach(t => {
        html += `<th>
            <div style="font-size: 13px; font-weight:bold;">${t.name}</div>
            <small style="color:var(--success); font-weight:bold;">${t.credits} CR rimasti</small>
        </th>`;
    });
    html += `</tr></thead><tbody><tr>`;

    // Contenuto colonne
    teams.forEach((team) => {
        html += `<td>`;
        ['P', 'D', 'C', 'A'].forEach(role => {
            const players = team.players[role];
            const maxSlot = ROLE_SLOTS[role];
            
            html += `<div style="font-weight:bold; font-size:10px; margin-top:8px; margin-bottom:4px; color:var(--text-muted); border-bottom: 1px solid var(--border); display:flex; justify-content:space-between;">
                <span>${role}</span>
                <span>(${players.length}/${maxSlot})</span>
            </div>`;

            if (players.length === 0) {
                html += `<div style="font-style:italic; color:#94a3b8; font-size:10px; margin-bottom:2px;">-</div>`;
            } else {
                players.forEach((p) => {
                    const logoUrl = getLogoUrl(p.team);
                    const logoHtml = logoUrl ? `<img src="${logoUrl}" class="team-logo" style="width:12px;height:12px; margin-right:3px;" onerror="this.style.display='none'">` : '';
                    
                    html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:3px; gap:4px;">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:95px;" title="${p.name}">
                            ${logoHtml}${p.name}
                        </span>
                        <span style="font-weight:bold; color:var(--success); font-size:10px;">${p.cost}</span>
                    </div>`;
                });
            }
        });
        html += `</td>`;
    });

    html += `</tr></tbody></table>`;
    container.innerHTML = html;
}

window.onload = updateUI;

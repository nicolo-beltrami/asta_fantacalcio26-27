// Limiti di slot standard (3P, 8D, 8C, 6A)
const ROLE_SLOTS = { P: 3, D: 8, C: 8, A: 6 };

let teams = JSON.parse(localStorage.getItem('fanta_teams')) || [];

function saveToLocalStorage() {
    localStorage.setItem('fanta_teams', JSON.stringify(teams));
}

function addTeam() {
    const input = document.getElementById('newTeamName');
    const name = input.value.trim();
    if (!name) return;

    const team = {
        name: name,
        credits: 500,
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

    team.credits -= cost;
    team.players[role].push({ name: name, cost: cost });

    document.getElementById('playerName').value = '';
    document.getElementById('playerCost').value = '';

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

function searchPlayers() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const playerItems = document.querySelectorAll('.player-item');

    playerItems.forEach(item => {
        const nameText = item.querySelector('.player-name')?.textContent.toLowerCase() || '';
        if (query !== '' && nameText.includes(query)) {
            item.classList.add('highlight');
            // Apre la lista se era nascosta
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
    const container = document.getElementById('teamsContainer');
    
    // Aggiorna Select
    const currentSelectValue = select.value;
    select.innerHTML = '<option value="">Seleziona Squadra</option>';
    teams.forEach((team, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = team.name;
        select.appendChild(option);
    });
    select.value = currentSelectValue;

    // Aggiorna Griglia Squadre
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
            
            html += `
                <div class="role-section">
                    <div class="role-header" onclick="toggleRole(this)">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="role-badge badge-${role.key}">${role.key}</span>
                            <span>${role.label} (${playerList.length}/${maxSlot})</span>
                        </div>
                        <span class="arrow-icon">▼</span>
                    </div>
                    <ul class="player-list">
            `;
            
            if (playerList.length === 0) {
                html += `<li class="player-item" style="color:var(--text-muted); font-style:italic;">Nessun acquisto</li>`;
            } else {
                playerList.forEach((player, playerIndex) => {
                    html += `
                        <li class="player-item">
                            <span class="player-name">${player.name}</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="player-cost">${player.cost} cr</span>
                                <span class="remove-player-btn" title="Svincola" onclick="event.stopPropagation(); removePlayer(${teamIndex}, '${role.key}', ${playerIndex})">✕</span>
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

window.onload = updateUI;

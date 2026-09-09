let teams = [];

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
    updateUI();
}

function buyPlayer() {
    const teamIndex = document.getElementById('selectTeam').value;
    const name = document.getElementById('playerName').value.trim();
    const role = document.getElementById('playerRole').value;
    const cost = parseInt(document.getElementById('playerCost').value);

    if (teamIndex === "" || !name || isNaN(cost) || cost <= 0) {
        alert("Inserisci tutti i dati correttamente!");
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

    updateUI();
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
    teams.forEach((team) => {
        const card = document.createElement('div');
        card.className = 'team-card';
        
        let html = `
            <div class="team-header">
                <h3>${team.name}</h3>
                <span class="credits">${team.credits} FM</span>
            </div>
        `;

        const roles = [
            { key: 'P', label: 'Portieri' },
            { key: 'D', label: 'Difensori' },
            { key: 'C', label: 'Centrocampisti' },
            { key: 'A', label: 'Attaccanti' }
        ];

        roles.forEach(role => {
            html += `<div class="role-section"><div class="role-title">${role.label} (${team.players[role.key].length})</div><ul class="player-list">`;
            team.players[role.key].forEach(player => {
                html += `<li class="player-item"><span>${player.name}</span><span class="player-cost">${player.cost} cr</span></li>`;
            });
            html += `</ul></div>`;
        });

        card.innerHTML = html;
        container.appendChild(card);
    });
}

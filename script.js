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

function removeTeam(index) {
    if (confirm(`Sei sicuro di voler eliminare "${teams[index].name}"?`)) {
        teams.splice(index, 1);
        updateUI();
    }
}

function buyPlayer() {
    const teamIndex = document.getElementById('selectTeam').value;
    const name = document.getElementById('playerName').value.trim();
    const role = document.getElementById('playerRole').value;
    const cost = parseInt(document.getElementById('playerCost').value);

    if (teamIndex === "" || !name || isNaN(cost) || cost <= 0) {
        alert("Inserisci correttamente tutti i dati dell'acquisto.");
        return;
    }

    const team = teams[teamIndex];

    if (team.credits < cost) {
        alert("Crediti insufficienti!");
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
    
    // Aggiorna Selettore
    const currentSelectValue = select.value;
    select.innerHTML = '<option value="">Seleziona Squadra</option>';
    teams.forEach((team, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = team.name;
        select.appendChild(option);
    });
    select.value = currentSelectValue;

    // Aggiorna Griglia Card
    container.innerHTML = '';
    teams.forEach((team, index) => {
        const card = document.createElement('div');
        card.className = 'team-card';
        
        let html = `
            <div class="team-header">
                <div>
                    <div class="team-name">${team.name}</div>
                    <button class="delete-btn" onclick="removeTeam(${index})">Elimina squadra</button>
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
            html += `
                <div class="role-section">
                    <div class="role-header">
                        <span class="role-badge badge-${role.key}">${role.key}</span>
                        <span>${role.label} (${playerList.length})</span>
                    </div>
                    <ul class="player-list">
            `;
            
            playerList.forEach(player => {
                html += `
                    <li class="player-item">
                        <span class="player-name">${player.name}</span>
                        <span class="player-cost">${player.cost} cr</span>
                    </li>
                `;
            });

            html += `</ul></div>`;
        });

        card.innerHTML = html;
        container.appendChild(card);
    });
}

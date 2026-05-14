// app.js
const API_URL = 'https://pokeapi.co/api/v2';
const grid = document.getElementById('pokedex-grid');
const modal = document.getElementById('pokemon-modal');

// Cargar primeros 151 para el ejemplo (Kanto)
async function initPokedex() {
    const response = await fetch(`${API_URL}/pokemon?limit=151`);
    const data = await response.json();
    renderCards(data.results);
}

function renderCards(pokemonList) {
    grid.innerHTML = '';
    pokemonList.forEach(async (poke, index) => {
        const id = index + 1; // Extraer ID real en producción
        
        // Sprite principal de Pokémon HOME
        const homeSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
        
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.onclick = () => openModal(id, poke.name);
        
        // HTML de la tarjeta con sistema de fallback (onerror)
        card.innerHTML = `
            <img src="${homeSprite}" 
                 alt="${poke.name}" 
                 onerror="this.onerror=null; this.src='./assets/${poke.name}.gif';">
            <h3>${poke.name.charAt(0).toUpperCase() + poke.name.slice(1)}</h3>
            <p>Nº ${id.toString().padStart(3, '0')}</p>
        `;
        grid.appendChild(card);
    });
}

async function openModal(id, name) {
    // 1. Obtener datos del Pokémon
    const res = await fetch(`${API_URL}/pokemon/${id}`);
    const pokemon = await res.json();
    
    // 2. Modelo 3D (Animaciones Showdown de la API)
    const model3D = pokemon.sprites.other.showdown.front_default;
    document.getElementById('modal-model-3d').src = model3D || `./assets/${name}_3d.gif`;
    document.getElementById('modal-name').textContent = name.toUpperCase();

    // 3. Procesar Habilidades con Tooltips
    const abilitiesDiv = document.getElementById('modal-abilities');
    abilitiesDiv.innerHTML = '';
    
    for (const item of pokemon.abilities) {
        // Hacemos un fetch a la habilidad para sacar la descripción
        const abilityRes = await fetch(item.ability.url);
        const abilityData = await abilityRes.json();
        
        // Buscar la descripción en español (o inglés si no hay)
        const flavorText = abilityData.flavor_text_entries.find(e => e.language.name === 'es') 
                           || abilityData.flavor_text_entries[0];

        abilitiesDiv.innerHTML += `
            <div class="ability-badge">
                ${item.ability.name.toUpperCase()}
                <span class="tooltip-text">${flavorText ? flavorText.flavor_text : 'Sin descripción'}</span>
            </div>
        `;
    }

    // Mostrar modal
    modal.classList.remove('hidden');
}

// Cerrar modal
document.querySelector('.close-btn').onclick = () => {
    modal.classList.add('hidden');
};

// Iniciar aplicación
initPokedex();

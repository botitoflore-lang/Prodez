const TYPE_COLORS = {
    fire: '#F08030', water: '#6890F0', grass: '#78C850', electric: '#F8D030',
    ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820', rock: '#B8A038',
    ghost: '#705898', dragon: '#7038F8', steel: '#B8B8D0', fairy: '#EE99AC', default: '#71717a'
};

let offset = 0;
const limit = 20;
let isSearching = false;

const container = document.getElementById('pokemon-container');
const sentinel = document.getElementById('sentinel');
const modal = document.getElementById('detail-modal');
const modalContent = document.getElementById('modal-content');

// --- CARGA INICIAL ---
async function startApp() {
    await fetchPokemons(); // Carga los primeros 20
}

async function fetchPokemons() {
    if (isSearching) return;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await res.json();
        const details = await Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
        renderCards(details);
        offset += limit;
    } catch (err) { console.error("Error:", err); }
}

function renderCards(pokemons) {
    pokemons.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'bg-slate-900 p-4 rounded-xl cursor-pointer border border-slate-800 hover:border-red-500 transition-all';
        const img = pokemon.sprites.other['home'].front_default || pokemon.sprites.other['official-artwork'].front_default;
        
        card.innerHTML = `
            <img src="${img}" class="w-full h-40 object-contain">
            <h3 class="text-center font-bold capitalize mt-2 text-white">${pokemon.name}</h3>
        `;
        card.onclick = () => showDetails(pokemon.id);
        container.appendChild(card);
    });
}

// --- DETALLES (MT, HUEVO Y 3D) ---
async function showDetails(id) {
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div class="text-white text-center p-10">Cargando datos...</div>`;

    try {
        const poke = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
        const species = await fetch(poke.species.url).then(r => r.json());

        // Clasificación de movimientos
        const movesByMethod = { 'level-up': [], 'machine': [], 'egg': [] };
        poke.moves.forEach(m => {
            const method = m.version_group_details[0].move_learn_method.name;
            if (movesByMethod[method]) movesByMethod[method].push(m.move);
        });

        const color = TYPE_COLORS[poke.types[0].type.name];
        // Modelo animado (GIF de Showdown)
        const animated = `https://play.pokemonshowdown.com/sprites/ani/${poke.name.toLowerCase()}.gif`;

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row bg-slate-950 rounded-3xl overflow-hidden border border-slate-800">
                <div class="md:w-1/3 p-8 flex flex-col items-center" style="background: ${color}33">
                    <button id="close-modal" class="absolute top-4 left-4 text-white">✕ Cerrar</button>
                    <img src="${animated}" class="w-40 h-40 mt-10" onerror="this.src='${poke.sprites.other['home'].front_default}'">
                    <h2 class="text-3xl font-black text-white mt-4 uppercase">${poke.name}</h2>
                    <div class="flex gap-2 mt-2">
                        ${poke.types.map(t => `<span class="px-2 py-1 rounded text-[10px] text-white" style="background:${TYPE_COLORS[t.type.name]}">${t.type.name.toUpperCase()}</span>`).join('')}
                    </div>
                </div>
                <div class="md:w-2/3 p-6 overflow-y-auto max-h-[70vh] bg-slate-900 text-slate-300">
                    <h4 class="text-blue-400 font-bold mb-4 uppercase">Movimientos por MT / Crianza</h4>
                    <div class="grid grid-cols-2 gap-2">
                        ${movesByMethod['machine'].slice(0, 10).map(m => `<div class="bg-slate-800 p-2 rounded text-xs capitalize">${m.name.replace(/-/g, ' ')} (MT)</div>`).join('')}
                        ${movesByMethod['egg'].slice(0, 10).map(m => `<div class="bg-slate-800 p-2 rounded text-xs capitalize text-purple-400">${m.name.replace(/-/g, ' ')} (Huevo)</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    } catch (e) { console.error(e); }
}

// --- OBSERVADOR (INFINITE SCROLL) ---
const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !isSearching) fetchPokemons();
}, { rootMargin: '200px' });

observer.observe(sentinel);

// Hacer global para el HTML
window.showDetails = showDetails;

// Arrancar la app
startApp();

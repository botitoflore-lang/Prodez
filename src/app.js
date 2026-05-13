// --- 1. CONFIGURACIÓN DE COLORES ---
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

// --- 2. MOTOR DE CARGA INICIAL Y SCROLL ---
async function fetchPokemons() {
    if (isSearching) return;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await res.json();
        const details = await Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
        renderCards(details);
        offset += limit;
    } catch (err) { console.error("Error cargando lista:", err); }
}

function renderCards(pokemons) {
    pokemons.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer';
        const img = pokemon.sprites.other['home'].front_default || pokemon.sprites.other['official-artwork'].front_default;
        
        card.innerHTML = `
            <div class="relative group">
                <img src="${img}" class="w-full z-10 relative opacity-0" onload="this.classList.add('loaded')">
                <div class="absolute inset-0 bg-white/5 blur-2xl rounded-full"></div>
            </div>
            <p class="text-[10px] font-mono text-slate-500 mt-2">#${pokemon.id.toString().padStart(3, '0')}</p>
            <h3 class="text-lg font-bold capitalize">${pokemon.name}</h3>
            <div class="flex gap-2 mt-3">
                ${pokemon.types.map(t => `<span class="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase" style="background:${TYPE_COLORS[t.type.name]}">${t.type.name}</span>`).join('')}
            </div>
        `;
        card.onclick = () => showDetails(pokemon.id);
        container.appendChild(card);
    });
}

// --- 3. RELACIONES DE DAÑO (DEBILIDADES/FORTALEZAS) ---
async function getTypeRelations(types) {
    const relations = { weakness: new Set(), strength: new Set() };
    const data = await Promise.all(types.map(t => fetch(t.type.url).then(r => r.json())));
    
    data.forEach(d => {
        d.damage_relations.double_damage_from.forEach(t => relations.weakness.add(t.name));
        d.damage_relations.double_damage_to.forEach(t => relations.strength.add(t.name));
    });
    return relations;
}

// --- 4. MODAL DE DETALLES ULTRA ---
async function showDetails(idOrName) {
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div class="p-20 text-center animate-pulse text-red-500 font-bold">CONECTANDO CON EL PC DE BILL...</div>`;

    try {
        const poke = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`).then(r => r.json());
        const species = await fetch(poke.species.url).then(r => r.json());
        const relations = await getTypeRelations(poke.types);
        
        // Habilidades con sus textos
        const abilityDetails = await Promise.all(poke.abilities.map(a => fetch(a.ability.url).then(r => r.json())));

        const color = TYPE_COLORS[poke.types[0].type.name] || '#777';
        const animated = `https://play.pokemonshowdown.com/sprites/ani/${poke.name.toLowerCase()}.gif`;

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row max-h-[95vh]">
                <button id="close-modal" class="absolute top-4 right-4 z-50 bg-black/50 text-white w-10 h-10 rounded-full">✕</button>
                
                <!-- Columna Visual (Animación) -->
                <div class="md:w-2/5 p-8 flex flex-col items-center justify-center relative shadow-inner" style="background: radial-gradient(circle, ${color}66 0%, #020617 100%)">
                    <img src="${animated}" class="model-3d w-40 z-10" onerror="this.src='${poke.sprites.other['home'].front_default}'">
                    <h2 class="text-4xl font-black uppercase mt-10 tracking-tighter">${poke.name.replace('-', ' ')}</h2>
                    
                    <div class="mt-4 flex flex-wrap justify-center gap-2">
                        <p class="w-full text-[9px] text-slate-500 text-center uppercase">Formas / Variedades</p>
                        ${species.varieties.map(v => `
                            <button onclick="showDetails('${v.pokemon.name}')" 
                                    class="text-[9px] px-2 py-1 rounded border border-slate-700 ${v.pokemon.name === poke.name ? 'bg-red-600 border-red-600' : 'bg-slate-800'}">
                                ${v.pokemon.name.replace(poke.name, '').replace('-', '') || 'Normal'}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Columna Información (Dashboard) -->
                <div class="md:w-3/5 p-6 bg-slate-900 overflow-y-auto custom-scrollbar">
                    <!-- Eficacia de Combate -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <h4 class="text-[9px] text-green-400 font-bold uppercase mb-2">Súper Efectivo (x2)</h4>
                            <div class="flex flex-wrap gap-1">
                                ${Array.from(relations.strength).map(t => `<span class="w-4 h-4 rounded-full" style="background:${TYPE_COLORS[t]}" data-tooltip="Efectivo contra ${t}"></span>`).join('')}
                            </div>
                        </div>
                        <div class="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <h4 class="text-[9px] text-red-400 font-bold uppercase mb-2">Debilidades (x2)</h4>
                            <div class="flex flex-wrap gap-1">
                                ${Array.from(relations.weakness).map(t => `<span class="w-4 h-4 rounded-full" style="background:${TYPE_COLORS[t]}" data-tooltip="Débil contra ${t}"></span>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Habilidades -->
                    <div class="mb-6">
                        <h4 class="text-[10px] text-slate-500 font-bold mb-2 uppercase">Habilidades</h4>
                        <div class="flex gap-2">
                            ${poke.abilities.map((a, i) => {
                                const desc = abilityDetails[i].flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text || "Sin descripción.";
                                return `<span class="bg-slate-800 px-3 py-1 rounded text-xs border border-slate-700" data-tooltip="${desc.replace(/"/g, '&quot;')}">${a.ability.name.replace('-', ' ')}</span>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Movimientos -->
                    <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                        <h4 class="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-widest">Ataques Principales</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar" id="moves-box">
                            <!-- Se cargan vía helper -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Carga de movimientos detallada (separada para no bloquear el modal)
        loadDetailedMoves(poke.moves.slice(0, 15));
        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');

    } catch (e) { console.error("Error modal:", e); }
}

async function loadDetailedMoves(moves) {
    const box = document.getElementById('moves-box');
    const data = await Promise.all(moves.map(m => fetch(m.move.url).then(r => r.json())));
    
    box.innerHTML = data.map(m => {
        const desc = m.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text || "";
        const tip = `Poder: ${m.power || '--'} | Prec: ${m.accuracy || '--'}% | ${desc}`;
        return `
            <div class="flex justify-between items-center bg-slate-800/40 p-2 rounded-lg border border-slate-800" data-tooltip="${tip.replace(/"/g, '&quot;')}">
                <span class="text-[10px] capitalize font-bold text-slate-300">${m.name.replace(/-/g, ' ')}</span>
                <span class="text-[8px] font-black uppercase px-2 py-0.5 rounded" style="color:${TYPE_COLORS[m.type.name]}">${m.type.name}</span>
            </div>
        `;
    }).join('');
}

// --- 5. BUSCADOR Y OBSERVADOR (CORE) ---
const debounce = (fn, delay) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

const handleSearch = debounce(async (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { isSearching = false; container.innerHTML = ""; offset = 0; fetchPokemons(); return; }
    isSearching = true;
    container.innerHTML = `<div class="col-span-full text-center py-20">Buscando en la hierba alta...</div>`;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`);
        const data = await res.json();
        container.innerHTML = "";
        renderCards([data]);
    } catch { container.innerHTML = `<div class="col-span-full text-center text-slate-500">No se encontró ese Pokémon.</div>`; }
}, 500);

document.getElementById('search-input').addEventListener('input', handleSearch);

const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !isSearching) fetchPokemons();
}, { rootMargin: '400px' });

observer.observe(sentinel);

// Hacer la función global para el onclick
window.showDetails = showDetails;

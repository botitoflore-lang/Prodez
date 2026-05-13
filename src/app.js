// --- CONFIGURACIÓN GLOBAL ---
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

// --- 1. LÓGICA DE CARGA E INFINITE SCROLL ---
async function fetchPokemons() {
    if (isSearching) return;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await res.json();
        
        // Cargamos detalles básicos en paralelo para las miniaturas
        const details = await Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
        renderCards(details);
        offset += limit;
    } catch (err) {
        console.error("Error al cargar Pokémon:", err);
    }
}

function renderCards(pokemons) {
    pokemons.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer';
        
        // Priorizamos la imagen de HOME para el efecto 3D
        const imgUrl = pokemon.sprites.other['home'].front_default || pokemon.sprites.other['official-artwork'].front_default;
        
        card.innerHTML = `
            <div class="relative group">
                <img src="${imgUrl}" alt="${pokemon.name}" class="w-full z-10 relative" onload="this.classList.add('loaded')">
                <div class="absolute inset-0 bg-white/5 blur-2xl rounded-full group-hover:bg-red-500/10 transition-colors"></div>
            </div>
            <p class="text-[10px] font-mono text-slate-500 mt-2">#${pokemon.id.toString().padStart(3, '0')}</p>
            <h3 class="text-lg font-bold capitalize tracking-tight">${pokemon.name}</h3>
            <div class="flex gap-2 mt-3">
                ${pokemon.types.map(t => `<span class="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase" style="background:${TYPE_COLORS[t.type.name] || TYPE_COLORS.default}">${t.type.name}</span>`).join('')}
            </div>
        `;
        card.onclick = () => showDetails(pokemon.id);
        container.appendChild(card);
    });
}

// --- 2. SISTEMA DE DETALLES PROFESIONAL ---
async function showDetails(id) {
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div class="p-20 text-center animate-pulse text-red-500 font-bold">ACCEDIENDO A LA BASE DE DATOS...</div>`;

    try {
        const [poke, species] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()),
            fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(r => r.json())
        ]);

        const [evoData, typeRelations] = await Promise.all([
            fetch(species.evolution_chain.url).then(r => r.json()),
            getTypeEffectiveness(poke.types)
        ]);

        const color = TYPE_COLORS[poke.types[0].type.name] || TYPE_COLORS.default;
        const desc = species.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text.replace(/\f/g, ' ') || "Sin registros disponibles.";
        const img3D = poke.sprites.other['home'].front_default || poke.sprites.other['official-artwork'].front_default;

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row h-full max-h-[90vh]">
                <button id="close-modal" class="absolute top-4 right-4 z-50 bg-black/40 hover:bg-red-600 w-10 h-10 rounded-full transition-all text-white">✕</button>
                
                <div class="md:w-2/5 p-8 flex flex-col items-center justify-center relative overflow-hidden" style="background: linear-gradient(180deg, ${color}66 0%, #0f172a 100%)">
                    <img src="${img3D}" class="w-64 z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform duration-500">
                    <div class="mt-6 text-center z-10">
                        <h2 class="text-4xl font-black uppercase tracking-tighter">${poke.name}</h2>
                        <div class="flex gap-2 justify-center mt-2">
                            ${poke.types.map(t => `<span class="px-3 py-1 rounded-md text-[10px] font-bold uppercase shadow-lg" style="background:${TYPE_COLORS[t.type.name]}">${t.type.name}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="md:w-3/5 p-6 bg-slate-900 overflow-y-auto custom-scrollbar">
                    <section class="mb-6">
                        <h4 class="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest">Entrada de Datos</h4>
                        <p class="text-slate-300 text-sm italic leading-relaxed">"${desc}"</p>
                    </section>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                            <h4 class="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest">Habilidades</h4>
                            <div class="flex flex-wrap gap-2">
                                ${poke.abilities.map(a => `<span class="text-[11px] bg-slate-700 px-2 py-1 rounded capitalize ${a.is_hidden ? 'text-red-400' : ''}">${a.ability.name.replace('-', ' ')}</span>`).join('')}
                            </div>
                        </div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-xs">
                            <h4 class="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest">Debilidades</h4>
                            <div class="flex flex-wrap gap-1">
                                ${Array.from(typeRelations.weakness).map(t => `<div class="w-4 h-4 rounded-full" style="background:${TYPE_COLORS[t]}" title="${t}"></div>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-800/30 rounded-2xl p-4 border border-slate-800">
                        <div class="flex border-b border-slate-700 mb-4 gap-4 overflow-x-auto">
                            <button onclick="switchMoveTab('level-up')" class="move-tab-btn pb-2 text-[10px] font-bold uppercase border-b-2 border-red-500 text-red-500">Nivel</button>
                            <button onclick="switchMoveTab('machine')" class="move-tab-btn pb-2 text-[10px] font-bold uppercase border-b-2 border-transparent text-slate-500">MT</button>
                            <button onclick="switchMoveTab('egg')" class="move-tab-btn pb-2 text-[10px] font-bold uppercase border-b-2 border-transparent text-slate-500">Huevo</button>
                        </div>
                        <div id="moves-container" class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            ${renderMoves(poke.moves, 'level-up')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        window.currentPokemonMoves = poke.moves;
        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    } catch (e) { console.error(e); }
}

// --- 3. FUNCIONES AUXILIARES ---
async function getTypeEffectiveness(types) {
    const relations = { weakness: new Set() };
    const data = await Promise.all(types.map(t => fetch(t.type.url).then(r => r.json())));
    data.forEach(d => d.damage_relations.double_damage_from.forEach(t => relations.weakness.add(t.name)));
    return relations;
}

function renderMoves(moves, method) {
    const filtered = moves.filter(m => m.version_group_details[0].move_learn_method.name === method);
    return filtered.length ? filtered.slice(0, 20).map(m => `
        <div class="flex justify-between bg-slate-900/50 p-2 rounded border border-slate-800 text-[10px]">
            <span class="capitalize">${m.move.name.replace(/-/g, ' ')}</span>
            <span class="text-red-500">${m.version_group_details[0].level_learned_at || '—'}</span>
        </div>
    `).join('') : '<p class="text-[10px] text-slate-600 p-4">No disponible</p>';
}

window.switchMoveTab = (method) => {
    document.querySelectorAll('.move-tab-btn').forEach(btn => {
        const active = btn.getAttribute('onclick').includes(method);
        btn.classList.toggle('text-red-500', active);
        btn.classList.toggle('border-red-500', active);
        btn.classList.toggle('text-slate-500', !active);
        btn.classList.toggle('border-transparent', !active);
    });
    document.getElementById('moves-container').innerHTML = renderMoves(window.currentPokemonMoves, method);
};

// --- 4. BÚSQUEDA Y OBSERVADOR ---
const debounce = (fn, delay) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

const handleSearch = debounce(async (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { isSearching = false; container.innerHTML = ""; offset = 0; fetchPokemons(); return; }
    isSearching = true;
    container.innerHTML = `<div class="col-span-full text-center py-10">Buscando...</div>`;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`);
        const data = await res.json();
        container.innerHTML = "";
        renderCards([data]);
    } catch { container.innerHTML = `<div class="col-span-full text-center">No encontrado</div>`; }
}, 500);

document.getElementById('search-input').addEventListener('input', handleSearch);

const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !isSearching) fetchPokemons();
}, { rootMargin: '400px' });

observer.observe(sentinel);

// Exportación necesaria para el HTML
window.showDetails = showDetails;

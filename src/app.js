// --- CONFIGURACIÓN Y CONSTANTES ---
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

// --- UTILIDADES ---
const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

// --- LÓGICA DE API Y RENDERIZADO ---
async function fetchPokemons() {
    if (isSearching) return;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await res.json();
        
        const details = await Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
        renderCards(details);
        offset += limit;
    } catch (err) { console.error("Error batch:", err); }
}

function renderCards(pokemons) {
    pokemons.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer';
        card.innerHTML = `
            <div class="relative group">
                <img src="${pokemon.sprites.other['official-artwork'].front_default}" 
                     alt="${pokemon.name}" class="w-full z-10 relative" onload="this.classList.add('loaded')">
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

// --- SISTEMA DE DETALLES (MODAL) ---
async function showDetails(id) {
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div class="p-20 text-center animate-pulse">Analizando ADN Pokémon...</div>`;

    try {
        const [poke, species] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()),
            fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(r => r.json())
        ]);

        const evoRes = await fetch(species.evolution_chain.url);
        const evoData = await evoRes.json();

        const color = TYPE_COLORS[poke.types[0].type.name] || TYPE_COLORS.default;
        const desc = species.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text.replace(/\f/g, ' ') || "Sin registros.";

        modalContent.innerHTML = `
            <div class="relative">
                <button id="close-modal" class="absolute top-5 right-5 z-50 bg-black/50 w-10 h-10 rounded-full hover:bg-red-600 transition-colors">✕</button>
                
                <div class="md:flex">
                    <!-- Columna Izquierda: Visual -->
                    <div class="md:w-1/2 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800" style="background: linear-gradient(135deg, ${color}33 0%, #0f172a 100%)">
                        <img src="${poke.sprites.other['official-artwork'].front_default}" class="w-64 drop-shadow-[0_0_30px_${color}66] loaded">
                        <h2 class="text-4xl font-black uppercase mt-4 tracking-tighter">${poke.name}</h2>
                        <div class="flex gap-2 mt-2">
                            ${poke.types.map(t => `<span class="px-4 py-1 rounded-lg text-xs font-bold shadow-lg" style="background:${TYPE_COLORS[t.type.name]}">${t.type.name.toUpperCase()}</span>`).join('')}
                        </div>
                    </div>

                    <!-- Columna Derecha: Datos -->
                    <div class="md:w-1/2 p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <section class="mb-6">
                            <h4 class="text-red-500 font-bold text-xs tracking-widest mb-2 uppercase">Entrada de Pokédex</h4>
                            <p class="text-slate-300 text-sm italic leading-relaxed">"${desc}"</p>
                        </section>

                        <section class="mb-6">
                            <h4 class="text-slate-500 font-bold text-xs tracking-widest mb-3 uppercase">Estadísticas Base</h4>
                            ${poke.stats.map(s => `
                                <div class="mb-2">
                                    <div class="flex justify-between text-[10px] mb-1 uppercase font-bold">
                                        <span>${s.stat.name}</span>
                                        <span>${s.base_stat}</span>
                                    </div>
                                    <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-red-500 transition-all duration-1000" style="width: ${(s.base_stat/255)*100}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </section>

                        <section>
                            <h4 class="text-slate-500 font-bold text-xs tracking-widest mb-3 uppercase">Movimientos (Nivel)</h4>
                            <div class="grid grid-cols-2 gap-2">
                                ${poke.moves.filter(m => m.version_group_details[0].move_learn_method.name === 'level-up').slice(0, 10).map(m => `
                                    <div class="bg-slate-800 p-2 rounded text-[10px] flex justify-between border border-slate-700">
                                        <span class="capitalize">${m.move.name.replace('-', ' ')}</span>
                                        <span class="text-red-400">lv. ${m.version_group_details[0].level_learned_at}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    } catch (e) { modalContent.innerHTML = "Error crítico al obtener datos."; }
}

// --- BUSCADOR Y OBSERVER ---
const handleSearch = debounce(async (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        isSearching = false; container.innerHTML = ""; offset = 0; fetchPokemons(); return;
    }
    isSearching = true;
    container.innerHTML = `<div class="col-span-full py-20 text-center">Buscando en la base de datos...</div>`;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        const data = await res.json();
        container.innerHTML = "";
        renderCards([data]);
    } catch { container.innerHTML = `<div class="col-span-full py-20 text-center text-slate-500">No se encontró ningún Pokémon con ese nombre o ID.</div>`; }
}, 500);

document.getElementById('search-input').addEventListener('input', handleSearch);

const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !isSearching) fetchPokemons();
}, { rootMargin: '400px' });

observer.observe(sentinel);

// Exportar a window para que el HTML pueda ver la función si fuera necesario
window.showDetails = showDetails;

// --- CONFIGURACIÓN DE COLORES (Asegúrate de tenerla) ---
const TYPE_COLORS = {
    fire: '#F08030', water: '#6890F0', grass: '#78C850', electric: '#F8D030',
    ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820', rock: '#B8A038',
    ghost: '#705898', dragon: '#7038F8', steel: '#B8B8D0', fairy: '#EE99AC', default: '#71717a'
};

async function showDetails(idOrName) {
    const modal = document.getElementById('detail-modal');
    const modalContent = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    
    try {
        const poke = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`).then(r => r.json());
        
        // Clasificamos movimientos por método de aprendizaje
        const movesByMethod = { 'level-up': [], 'machine': [], 'egg': [] };
        poke.moves.forEach(m => {
            const method = m.version_group_details[0].move_learn_method.name;
            if (movesByMethod[method]) movesByMethod[method].push(m.move);
        });

        // URL del modelo 3D animado
        const img3D = `https://play.pokemonshowdown.com/sprites/ani/${poke.name.toLowerCase()}.gif`;
        const imgFallback = poke.sprites.other['official-artwork'].front_default;

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row bg-slate-950 rounded-3xl overflow-hidden border border-slate-800">
                <!-- Visual del Pokémon -->
                <div class="md:w-1/3 p-8 flex flex-col items-center bg-slate-900">
                    <img src="${img3D}" class="model-3d w-40 h-40 object-contain" onerror="this.src='${imgFallback}'">
                    <h2 class="text-3xl font-bold text-white mt-4 uppercase">${poke.name}</h2>
                    <div class="flex gap-2 mt-2">
                        ${poke.types.map(t => `<span class="px-3 py-1 rounded-full text-[10px] text-white font-bold uppercase" style="background:${TYPE_COLORS[t.type.name]}">${t.type.name}</span>`).join('')}
                    </div>
                </div>

                <!-- Info y Movimientos (MT, Huevo, Nivel) -->
                <div class="md:w-2/3 p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                    ${renderMoveGroup('Subiendo de Nivel', movesByMethod['level-up'], 'text-green-400')}
                    ${renderMoveGroup('MT / Máquinas Técnicas', movesByMethod['machine'], 'text-blue-400')}
                    ${renderMoveGroup('Crianza / Mov. Huevo', movesByMethod['egg'], 'text-purple-400')}
                </div>
            </div>
        `;
    } catch (e) { console.error("Error en Pokedex:", e); }
}

function renderMoveGroup(title, moves, colorClass) {
    if (moves.length === 0) return '';
    return `
        <div class="mb-6">
            <h4 class="text-xs font-bold ${colorClass} uppercase mb-3 border-b border-slate-800 pb-1">${title}</h4>
            <div class="grid grid-cols-2 gap-2">
                ${moves.slice(0, 8).map(m => `
                    <div class="bg-slate-800/50 p-2 rounded border border-slate-700 text-[11px] text-slate-300 capitalize">
                        ${m.name.replace(/-/g, ' ')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderMoveSection(title, moves, colorClass) {
    if (moves.length === 0) return '';
    return `
        <div>
            <h5 class="text-[10px] font-bold ${colorClass} uppercase mb-2 ml-1">${title}</h5>
            <div class="grid grid-cols-2 gap-2">
                ${moves.slice(0, 10).map(m => `
                    <div class="bg-slate-800/40 p-2 rounded-lg border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition shadow-sm">
                        <span class="text-xs text-slate-200 capitalize">${m.name.replace('-', ' ')}</span>
                        <span class="text-[8px] text-slate-500 font-mono italic">INFO</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Globalizar para el HTML
window.showDetails = showDetails;

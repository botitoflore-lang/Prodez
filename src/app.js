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
    modalContent.innerHTML = `<div class="p-20 text-center animate-bounce text-white">CARGANDO DATOS DE LA POKÉDEX...</div>`;

    try {
        const poke = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`).then(r => r.json());
        const species = await fetch(poke.species.url).then(r => r.json());
        const color = TYPE_COLORS[poke.types[0].type.name];

        // Clasificar movimientos por método
        const movesByMethod = {
            'level-up': [],
            'machine': [],
            'egg': []
        };

        poke.moves.forEach(m => {
            const method = m.version_group_details[0].move_learn_method.name;
            if (movesByMethod[method]) {
                movesByMethod[method].push(m.move);
            }
        });

        // Imagen: Intentamos el 3D de Showdown, si no, el arte oficial
        const img3D = `https://play.pokemonshowdown.com/sprites/ani/${poke.name.toLowerCase()}.gif`;
        const imgBackup = poke.sprites.other['official-artwork'].front_default;

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden bg-slate-950 rounded-3xl border border-slate-800">
                <!-- COLUMNA IZQUIERDA: VISUAL -->
                <div class="md:w-1/3 p-8 flex flex-col items-center justify-center relative border-r border-slate-800" 
                     style="background: radial-gradient(circle at center, ${color}33 0%, transparent 70%)">
                    
                    <button id="close-modal" class="absolute top-4 left-4 text-slate-400 hover:text-white text-2xl">✕</button>
                    
                    <img src="${img3D}" class="model-3d w-48 h-48 object-contain mb-6" onerror="this.src='${imgBackup}'">
                    
                    <h2 class="text-4xl font-black uppercase text-white tracking-tighter text-center">${poke.name}</h2>
                    <div class="flex gap-2 mt-2">
                        ${poke.types.map(t => `<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase text-white" style="background:${TYPE_COLORS[t.type.name]}">${t.type.name}</span>`).join('')}
                    </div>

                    <div class="mt-8 w-full">
                        <p class="text-[10px] text-slate-500 uppercase font-bold mb-2 text-center">Variantes</p>
                        <div class="flex flex-wrap justify-center gap-2">
                            ${species.varieties.slice(0, 4).map(v => `
                                <button onclick="showDetails('${v.pokemon.name}')" class="px-2 py-1 rounded bg-slate-800 text-[9px] text-slate-300 border border-slate-700 hover:bg-red-600 transition">
                                    ${v.pokemon.name.replace(poke.name, '').replace('-', '') || 'Normal'}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA: INFO Y MOVIMIENTOS -->
                <div class="md:w-2/3 p-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
                    
                    <!-- Habilidades con Tooltip fixed -->
                    <div class="mb-8">
                        <h4 class="text-xs font-bold text-slate-500 uppercase mb-3">Habilidades</h4>
                        <div class="flex gap-3">
                            ${poke.abilities.map(a => `
                                <div class="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white capitalize">
                                    ${a.ability.name.replace('-', ' ')}
                                    ${a.is_hidden ? '<span class="text-[8px] text-blue-400 ml-2">(Oculta)</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Pestañas de Movimientos -->
                    <div>
                        <h4 class="text-xs font-bold text-slate-500 uppercase mb-3">Lista de Movimientos</h4>
                        
                        <div class="space-y-6">
                            ${renderMoveSection('Por Nivel', movesByMethod['level-up'], 'text-green-400')}
                            ${renderMoveSection('MT / MO', movesByMethod['machine'], 'text-blue-400')}
                            ${renderMoveSection('Por Crianza (Huevo)', movesByMethod['egg'], 'text-purple-400')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = `<div class="p-20 text-red-500">Error al cargar datos del Pokémon.</div>`;
    }
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

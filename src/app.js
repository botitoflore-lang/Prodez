// --- CONFIGURACIÓN DE COLORES Y TIPOS ---
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

// --- LÓGICA DE CÁLCULO DE DEBILIDADES (TYPE CHART) ---
async function getTypeEffectiveness(types) {
    const damageRelations = {
        weakness: new Set(),
        resistance: new Set(),
        immunity: new Set()
    };

    const typeData = await Promise.all(types.map(t => fetch(t.type.url).then(r => r.json())));
    
    typeData.forEach(data => {
        data.damage_relations.double_damage_from.forEach(t => damageRelations.weakness.add(t.name));
        data.damage_relations.half_damage_from.forEach(t => damageRelations.resistance.add(t.name));
        data.damage_relations.no_damage_from.forEach(t => damageRelations.immunity.add(t.name));
    });

    // Limpiar duplicados (si es débil y resistente a la vez, es neutro)
    damageRelations.weakness.forEach(w => {
        if (damageRelations.resistance.has(w)) {
            damageRelations.weakness.delete(w);
            damageRelations.resistance.delete(w);
        }
    });

    return damageRelations;
}

// --- RENDERIZADO DE DETALLES PROFESIONAL ---
async function showDetails(id) {
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div class="p-20 text-center animate-pulse text-red-500 font-bold">SINCRONIZANDO CON LA RED MUNDIAL...</div>`;

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
        const desc = species.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text.replace(/\f/g, ' ') || "Sin registros.";

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row h-full max-h-[90vh]">
                <button id="close-modal" class="absolute top-4 right-4 z-50 bg-black/40 hover:bg-red-600 w-10 h-10 rounded-full transition-all text-white">✕</button>
                
                <!-- Lado Izquierdo: Visual (Modelo 3D Style) -->
                <div class="md:w-2/5 p-8 flex flex-col items-center justify-center relative overflow-hidden" style="background: linear-gradient(180deg, ${color}66 0%, #0f172a 100%)">
                    <img src="${poke.sprites.other['home'].front_default}" 
                         class="w-64 z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform duration-500" 
                         alt="${poke.name}">
                    <div class="mt-6 text-center z-10">
                        <h2 class="text-4xl font-black uppercase tracking-tighter">${poke.name}</h2>
                        <div class="flex gap-2 justify-center mt-2">
                            ${poke.types.map(t => `<span class="px-3 py-1 rounded-md text-[10px] font-bold uppercase shadow-lg" style="background:${TYPE_COLORS[t.type.name]}">${t.type.name}</span>`).join('')}
                        </div>
                    </div>
                    <!-- Decoración de fondo -->
                    <span class="absolute -bottom-10 -left-10 text-[120px] font-black opacity-5 select-none uppercase">${poke.types[0].type.name}</span>
                </div>

                <!-- Lado Derecho: Dashboard de Datos -->
                <div class="md:w-3/5 p-6 bg-slate-900 overflow-y-auto custom-scrollbar">
                    
                    <!-- Sección: Atributos y Habilidades -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                            <h4 class="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest">Habilidades</h4>
                            <div class="flex flex-wrap gap-2">
                                ${poke.abilities.map(a => `<span class="text-xs bg-slate-700 px-2 py-1 rounded capitalize ${a.is_hidden ? 'text-red-400 border border-red-900/30' : ''}">${a.ability.name.replace('-', ' ')}</span>`).join('')}
                            </div>
                        </div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                            <h4 class="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest">Dimensiones</h4>
                            <div class="flex justify-between text-xs">
                                <span>Altura: <b>${poke.height/10}m</b></span>
                                <span>Peso: <b>${poke.weight/10}kg</b></span>
                            </div>
                        </div>
                    </div>

                    <!-- Sección: Tabla de Tipos (Efectividad) -->
                    <div class="mb-6">
                        <h4 class="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-widest">Relaciones de Daño</h4>
                        <div class="flex flex-wrap gap-4">
                            <div>
                                <p class="text-[9px] text-red-400 mb-1 uppercase">Debilidades (x2)</p>
                                <div class="flex flex-wrap gap-1">
                                    ${Array.from(typeRelations.weakness).map(t => `<div class="w-3 h-3 rounded-full" style="background:${TYPE_COLORS[t]}" title="${t}"></div>`).join('')}
                                </div>
                            </div>
                            <div>
                                <p class="text-[9px] text-green-400 mb-1 uppercase">Resistencias (x0.5)</p>
                                <div class="flex flex-wrap gap-1">
                                    ${Array.from(typeRelations.resistance).map(t => `<div class="w-3 h-3 rounded-full" style="background:${TYPE_COLORS[t]}" title="${t}"></div>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabs de Movimientos -->
                    <div class="bg-slate-800/30 rounded-2xl p-4 border border-slate-800">
                        <div class="flex border-b border-slate-700 mb-4 overflow-x-auto gap-4">
                            <button onclick="switchMoveTab('level-up')" class="move-tab-btn pb-2 text-[10px] font-bold uppercase border-b-2 border-red-500 text-red-500">Nivel</button>
                            <button onclick="switchMoveTab('machine')" class="move-tab-btn pb-2 text-[10px] font-bold uppercase border-b-2 border-transparent text-slate-500">MT/MO</button>
                            <button onclick="switchMoveTab('egg')" class="move-tab-btn pb-2 text-[10px] font-bold uppercase border-b-2 border-transparent text-slate-500">Huevo</button>
                            <button onclick="switchMoveTab('tutor')" class="move-tab-btn pb-2 text-[10px] font-bold uppercase border-b-2 border-transparent text-slate-500">Tutor</button>
                        </div>
                        <div id="moves-container" class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            ${renderMoves(poke.moves, 'level-up')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inyectar datos en el objeto global para el switch de pestañas
        window.currentPokemonMoves = poke.moves;
        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');

    } catch (e) {
        console.error(e);
        modalContent.innerHTML = `<p class="p-10 text-center">Error al cargar la información.</p>`;
    }
}

// --- HELPERS DE UI ---
function renderMoves(moves, method) {
    const filtered = moves.filter(m => m.version_group_details[0].move_learn_method.name === method);
    if (filtered.length === 0) return `<p class="col-span-full text-[10px] text-slate-600 text-center py-4 italic">No se aprenden movimientos por este método.</p>`;
    
    return filtered.sort((a,b) => a.version_group_details[0].level_learned_at - b.version_group_details[0].level_learned_at).map(m => `
        <div class="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
            <span class="text-[11px] capitalize text-slate-300 font-medium">${m.move.name.replace(/-/g, ' ')}</span>
            <span class="text-[9px] font-bold text-red-500">${m.version_group_details[0].level_learned_at > 0 ? 'Lv.' + m.version_group_details[0].level_learned_at : '—'}</span>
        </div>
    `).join('');
}

window.switchMoveTab = (method) => {
    // Actualizar UI de botones
    document.querySelectorAll('.move-tab-btn').forEach(btn => {
        const isTarget = btn.getAttribute('onclick').includes(method);
        btn.classList.toggle('text-red-500', isTarget);
        btn.classList.toggle('border-red-500', isTarget);
        btn.classList.toggle('text-slate-500', !isTarget);
        btn.classList.toggle('border-transparent', !isTarget);
    });
    // Renderizar
    document.getElementById('moves-container').innerHTML = renderMoves(window.currentPokemonMoves, method);
};

// [Mantener lógica de fetchPokemons, debounce, IntersectionObserver del código anterior]

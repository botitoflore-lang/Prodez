import { TYPE_COLORS } from './utils.js';

const modal = document.getElementById('detail-modal');
const modalContent = document.getElementById('modal-content');

export async function showDetails(id) {
    // 1. Mostrar estado de carga en el modal
    modal.classList.remove('hidden');
    modalContent.innerHTML = `
        <div class="p-20 flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <p class="mt-4 text-slate-400">Consultando datos del Profesor Oak...</p>
        </div>
    `;

    try {
        // 2. Peticiones paralelas para optimizar tiempo de respuesta
        const [pokemon, species] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(res => res.json()),
            fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(res => res.json())
        ]);

        // 3. Obtener cadena evolutiva (requiere un fetch extra desde species)
        const evolutionData = await fetch(species.evolution_chain.url).then(res => res.json());

        renderModalUI(pokemon, species, evolutionData);
    } catch (error) {
        modalContent.innerHTML = `<p class="p-10 text-center text-red-500">Error al cargar detalles. Reintenta más tarde.</p>`;
    }
}

function renderModalUI(pokemon, species, evolution) {
    const mainType = pokemon.types[0].type.name;
    const color = TYPE_COLORS[mainType] || '#777';
    
    // Texto de descripción en español
    const description = species.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text || "Sin descripción disponible.";

    modalContent.innerHTML = `
        <!-- Cabecera Dinámica -->
        <div class="relative p-6 text-center" style="background-color: ${color}22">
            <button onclick="document.getElementById('detail-modal').classList.add('hidden')" 
                    class="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all">✕</button>
            
            <img src="${pokemon.sprites.other['official-artwork'].front_default}" 
                 class="w-48 h-48 mx-auto drop-shadow-2xl" alt="${pokemon.name}">
            
            <h2 class="text-3xl font-black uppercase mt-4">${pokemon.name}</h2>
            <div class="flex justify-center gap-2 mt-2">
                ${pokemon.types.map(t => `
                    <span class="px-4 py-1 rounded-full text-xs font-bold text-white" 
                          style="background-color: ${TYPE_COLORS[t.type.name]}">
                        ${t.type.name.toUpperCase()}
                    </span>
                `).join('')}
            </div>
        </div>

        <!-- Cuerpo con Tabs -->
        <div class="p-6 bg-slate-800">
            <div class="mb-6">
                <h3 class="text-red-500 font-bold mb-2">DESCRIPCIÓN</h3>
                <p class="text-slate-300 text-sm leading-relaxed">${description.replace(/\f/g, ' ')}</p>
            </div>

            <!-- Tabla de Tipos (Debilidades simplificadas) -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-slate-700/50 p-3 rounded-lg">
                    <h4 class="text-xs text-slate-400 font-bold mb-2 uppercase">Estadísticas</h4>
                    ${pokemon.stats.map(s => `
                        <div class="flex items-center gap-2 text-[10px] mb-1">
                            <span class="w-8 uppercase">${s.stat.name.replace('special-', 'sp')}</span>
                            <div class="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div class="h-full bg-red-500" style="width: ${(s.base_stat / 255) * 100}%"></div>
                            </div>
                            <span class="w-6 text-right">${s.base_stat}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="bg-slate-700/50 p-3 rounded-lg">
                    <h4 class="text-xs text-slate-400 font-bold mb-2 uppercase">Línea Evolutiva</h4>
                    <div id="evo-chain" class="text-xs text-slate-300">
                        ${formatEvolutionChain(evolution.chain)}
                    </div>
                </div>
            </div>

            <!-- Movimientos con Filtro -->
            <div>
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-red-500 font-bold">MOVIMIENTOS</h3>
                    <select id="move-filter" class="bg-slate-900 text-[10px] p-1 rounded border border-slate-700">
                        <option value="level-up">Por Nivel</option>
                        <option value="machine">MT/MO</option>
                        <option value="egg">Huevo</option>
                    </select>
                </div>
                <div id="moves-list" class="grid grid-cols-2 md:grid-cols-3 gap-2 h-40 overflow-y-auto pr-2 custom-scrollbar">
                    ${renderMoves(pokemon.moves, 'level-up')}
                </div>
            </div>
        </div>
    `;

    // Evento para el filtro de movimientos
    document.getElementById('move-filter').addEventListener('change', (e) => {
        document.getElementById('moves-list').innerHTML = renderMoves(pokemon.moves, e.target.value);
    });
}

// Helper para procesar la cadena evolutiva recursivamente
function formatEvolutionChain(chain) {
    let html = `<div class="flex flex-col gap-1 items-start">`;
    let current = chain;
    
    while (current) {
        html += `<span class="capitalize">→ ${current.species.name} 
                 ${current.evolution_details[0] ? `<span class="text-[10px] text-slate-500">(Nivel ${current.evolution_details[0].min_level || '?'})</span>` : ''}
                 </span>`;
        current = current.evolves_to[0];
    }
    html += `</div>`;
    return html;
}

// Helper para filtrar y renderizar movimientos
function renderMoves(moves, method) {
    const filtered = moves.filter(m => 
        m.version_group_details[0].move_learn_method.name === method
    );

    return filtered.length > 0 
        ? filtered.map(m => `
            <div class="bg-slate-900/50 p-2 rounded border border-slate-700 text-[11px] flex justify-between">
                <span class="capitalize">${m.move.name.replace('-', ' ')}</span>
                <span class="text-red-400">Lvl ${m.version_group_details[0].level_learned_at}</span>
            </div>
          `).join('')
        : `<p class="col-span-full text-slate-500 text-center text-xs py-4">No hay movimientos por este método.</p>`;
}

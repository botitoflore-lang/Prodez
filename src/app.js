// Exportación necesaria para el HTML
window.showDetails = showDetails;const TYPE_COLORS = { fire: '#F08030', water: '#6890F0', grass: '#78C850', electric: '#F8D030',
    ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820', rock: '#B8A038',
    ghost: '#705898', dragon: '#7038F8', steel: '#B8B8D0', fairy: '#EE99AC', default: '#71717a' };

// --- 1. MOTOR DE RELACIONES DE DAÑO ---
async function getTypeData(types) {
    const relations = { weakness: [], strength: [], immunity: [] };
    const typePromises = types.map(t => fetch(t.type.url).then(r => r.json()));
    const results = await Promise.all(typePromises);

    results.forEach(d => {
        d.damage_relations.double_damage_from.forEach(t => relations.weakness.push(t.name));
        d.damage_relations.double_damage_to.forEach(t => relations.strength.push(t.name));
        d.damage_relations.no_damage_from.forEach(t => relations.immunity.push(t.name));
    });
    return relations;
}

// --- 2. SISTEMA DE DETALLES ULTRA ---
async function showDetails(idOrName) {
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div class="p-20 text-center text-red-500 animate-pulse font-bold">CARGANDO NÚCLEO DE DATOS...</div>`;

    try {
        const poke = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`).then(r => r.json());
        const species = await fetch(poke.species.url).then(r => r.json());
        const relations = await getTypeData(poke.types);

        // Obtener descripciones de habilidades
        const abilityDetails = await Promise.all(poke.abilities.map(a => 
            fetch(a.ability.url).then(r => r.json())
        ));

        const color = TYPE_COLORS[poke.types[0].type.name] || '#777';
        // URL de Modelo Animado (Back-up a Official Artwork)
        const animatedModel = `https://play.pokemonshowdown.com/sprites/ani/${poke.name.toLowerCase()}.gif`;

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row h-full max-h-[95vh]">
                <button id="close-modal" class="absolute top-4 right-4 z-50 bg-black/60 text-white w-10 h-10 rounded-full">✕</button>
                
                <!-- VISUAL 3D ANIMADO -->
                <div class="md:w-2/5 p-8 flex flex-col items-center justify-center relative shadow-inner" style="background: radial-gradient(circle, ${color}88 0%, #020617 100%)">
                    <img src="${animatedModel}" class="model-3d w-48 z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                         onerror="this.src='${poke.sprites.other['official-artwork'].front_default}'">
                    
                    <h2 class="text-4xl font-black uppercase mt-10 tracking-tighter">${poke.name.replace('-', ' ')}</h2>
                    
                    <!-- SELECTOR DE FORMAS ALTERNATIVAS -->
                    <div class="mt-4 flex flex-wrap justify-center gap-2">
                        <p class="w-full text-[10px] text-slate-500 text-center uppercase mb-1">Formas disponibles</p>
                        ${species.varieties.map(v => `
                            <button onclick="showDetails('${v.pokemon.name}')" 
                                    class="text-[9px] px-2 py-1 rounded border border-slate-700 hover:bg-red-600 transition-colors ${v.pokemon.name === poke.name ? 'bg-red-600' : 'bg-slate-800'}">
                                ${v.pokemon.name.replace(poke.name, '').replace('-', '') || 'Normal'}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- DASHBOARD DE INFORMACIÓN -->
                <div class="md:w-3/5 p-6 bg-slate-900 overflow-y-auto custom-scrollbar">
                    
                    <!-- TABLA DE EFECTIVIDAD -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <h4 class="text-[9px] text-red-400 font-bold uppercase mb-2">Efectivo contra (x2)</h4>
                            <div class="flex flex-wrap gap-1">
                                ${[...new Set(relations.strength)].map(t => `<span class="w-4 h-4 rounded-full" style="background:${TYPE_COLORS[t]}" data-tooltip="Fuerte contra ${t}"></span>`).join('')}
                            </div>
                        </div>
                        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <h4 class="text-[9px] text-blue-400 font-bold uppercase mb-2">Débil contra (x2)</h4>
                            <div class="flex flex-wrap gap-1">
                                ${[...new Set(relations.weakness)].map(t => `<span class="w-4 h-4 rounded-full" style="background:${TYPE_COLORS[t]}" data-tooltip="Débil ante ${t}"></span>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- HABILIDADES CON TOOLTIP -->
                    <div class="mb-6">
                        <h4 class="text-[10px] text-slate-500 font-bold mb-2 uppercase">Habilidades (Pasa el mouse)</h4>
                        <div class="flex gap-2">
                            ${poke.abilities.map((a, i) => {
                                const effect = abilityDetails[i].flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text || "Efecto desconocido";
                                return `<span class="bg-slate-800 px-3 py-1 rounded text-xs border border-slate-700 hover:border-red-500 transition-colors" data-tooltip="${effect}">${a.ability.name.replace('-', ' ')}</span>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- ATAQUES (CON INFO DE DAÑO) -->
                    <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                        <h4 class="text-[10px] text-slate-500 font-bold mb-3 uppercase">Movimientos Destacados</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                            ${await renderDetailedMoves(poke.moves.slice(0, 20))}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    } catch (e) { console.error(e); }
}

// Renderiza movimientos con Tooltip de potencia/precisión
async function renderDetailedMoves(moves) {
    const moveData = await Promise.all(moves.map(m => fetch(m.move.url).then(r => r.json())));
    
    return moveData.map(m => {
        const tooltip = `Poder: ${m.power || '--'} | Prec: ${m.accuracy || '--'}% | PP: ${m.pp} - ${m.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text || ''}`;
        return `
            <div class="flex justify-between items-center bg-slate-800/40 p-2 rounded-lg text-[10px] border border-slate-700/50 hover:bg-slate-800 transition-colors" data-tooltip="${tooltip}">
                <span class="capitalize font-bold text-slate-300">${m.name.replace(/-/g, ' ')}</span>
                <span class="px-2 py-0.5 rounded text-[8px] uppercase font-black" style="background:${TYPE_COLORS[m.type.name]}33; color:${TYPE_COLORS[m.type.name]}">${m.type.name}</span>
            </div>
        `;
    }).join('');
}

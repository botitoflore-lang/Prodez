const TYPE_COLORS = {
    fire: '#F08030', water: '#6890F0', grass: '#78C850', electric: '#F8D030',
    ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820', rock: '#B8A038',
    ghost: '#705898', dragon: '#7038F8', steel: '#B8B8D0', fairy: '#EE99AC', default: '#71717a'
};

let offset = 0;
const limit = 30;
let isSearching = false;

const container = document.getElementById('pokemon-container');
const sentinel = document.getElementById('sentinel');
const modal = document.getElementById('detail-modal');
const modalContent = document.getElementById('modal-content');
const searchInput = document.getElementById('search-input');

// --- 1. CARGA DE LA LISTA PRINCIPAL ---
async function fetchPokemons() {
    if (isSearching) return;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await res.json();
        const details = await Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
        renderCards(details);
        offset += limit;
    } catch (err) { console.error("Error al cargar la lista:", err); }
}

function renderCards(pokemons) {
    pokemons.forEach(poke => {
        const card = document.createElement('div');
        card.className = 'bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-500 hover:bg-slate-800 transition-all flex flex-col items-center group';
        
        const img = poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default;
        const mainTypeColor = TYPE_COLORS[poke.types[0].type.name] || TYPE_COLORS.default;

        card.innerHTML = `
            <div class="relative w-full aspect-square flex items-center justify-center mb-3">
                <div class="absolute inset-0 opacity-20 rounded-full blur-xl group-hover:opacity-40 transition-opacity" style="background-color: ${mainTypeColor}"></div>
                <img src="${img}" class="w-3/4 z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
            </div>
            <p class="text-[10px] text-slate-500 font-mono">#${poke.id.toString().padStart(3, '0')}</p>
            <h3 class="font-bold capitalize text-sm mb-2 text-slate-200">${poke.name.replace(/-/g, ' ')}</h3>
            <div class="flex gap-1">
                ${poke.types.map(t => `<div class="w-3 h-3 rounded-full" style="background:${TYPE_COLORS[t.type.name]}" title="${t.type.name}"></div>`).join('')}
            </div>
        `;
        card.onclick = () => showDetails(poke.id);
        container.appendChild(card);
    });
}

// --- 2. GESTOR DE IMÁGENES (FALLBACKS) ---
// Intenta: 1. Showdown -> 2. Carpeta /assets/ -> 3. Arte Oficial
window.handleImgFallback = function(img, pokeName, officialArtUrl) {
    if (!img.dataset.triedAssets) {
        img.dataset.triedAssets = "true";
        img.src = `assets/${pokeName}.gif`; // Busca en tu carpeta local
    } else {
        img.src = officialArtUrl; // Fallback final
        img.classList.remove('model-3d'); // Quitamos la animación si es una imagen estática
    }
};

// --- 3. MODAL DE DETALLES ---
async function showDetails(idOrName) {
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div class="flex h-full items-center justify-center text-xl text-slate-400 animate-pulse">Analizando datos del Pokémon...</div>`;

    try {
        const poke = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`).then(r => r.json());
        const mainColor = TYPE_COLORS[poke.types[0].type.name] || TYPE_COLORS.default;
        const officialArt = poke.sprites.other['official-artwork'].front_default;
        
        // Efectividades (Debilidades y Fortalezas)
        const relations = { weak: new Set(), strong: new Set() };
        const typeData = await Promise.all(poke.types.map(t => fetch(t.type.url).then(r => r.json())));
        typeData.forEach(d => {
            d.damage_relations.double_damage_from.forEach(t => relations.weak.add(t.name));
            d.damage_relations.double_damage_to.forEach(t => relations.strong.add(t.name));
        });

        // Separar Movimientos
        const moves = { level: [], tm: [], egg: [] };
        poke.moves.forEach(m => {
            const method = m.version_group_details[0]?.move_learn_method?.name;
            if (method === 'level-up') moves.level.push(m.move.name);
            else if (method === 'machine') moves.tm.push(m.move.name);
            else if (method === 'egg') moves.egg.push(m.move.name);
        });

        modalContent.innerHTML = `
            <div class="flex flex-col lg:flex-row h-full max-h-[90vh] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 relative">
                
                <button id="close-modal" class="absolute top-4 left-4 z-50 bg-black/40 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>

                <!-- Panel Visual -->
                <div class="lg:w-1/3 p-8 flex flex-col items-center justify-center relative" style="background: radial-gradient(circle at center, ${mainColor}22 0%, transparent 80%)">
                    <img src="https://play.pokemonshowdown.com/sprites/ani/${poke.name}.gif" 
                         class="model-3d w-48 h-48 object-contain z-10" 
                         onerror="handleImgFallback(this, '${poke.name}', '${officialArt}')">
                    
                    <h2 class="text-4xl font-black uppercase tracking-tighter mt-8 text-white text-center">${poke.name.replace(/-/g, ' ')}</h2>
                    <p class="text-slate-500 font-mono mb-4">#${poke.id.toString().padStart(3, '0')}</p>
                    
                    <div class="flex gap-2 mb-8">
                        ${poke.types.map(t => `<span class="px-4 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-md" style="background-color: ${TYPE_COLORS[t.type.name]}">${t.type.name}</span>`).join('')}
                    </div>

                    <!-- Efectividades -->
                    <div class="w-full space-y-4">
                        ${renderTypesBlock('Súper Efectivo Contra', relations.strong)}
                        ${renderTypesBlock('Débil Contra (x2)', relations.weak)}
                    </div>
                </div>

                <!-- Panel de Datos -->
                <div class="lg:w-2/3 bg-slate-900/80 p-6 flex flex-col overflow-hidden">
                    <h3 class="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Registro de Movimientos</h3>
                    
                    <div class="overflow-y-auto custom-scrollbar pr-2 space-y-6 flex-1">
                        ${renderMoveSection('Aprendizaje por Nivel', moves.level, 'text-green-400', 'bg-green-400/10 border-green-900')}
                        ${renderMoveSection('Máquinas Técnicas (MT)', moves.tm, 'text-blue-400', 'bg-blue-400/10 border-blue-900')}
                        ${renderMoveSection('Movimientos Huevo (Crianza)', moves.egg, 'text-purple-400', 'bg-purple-400/10 border-purple-900')}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    } catch (e) { 
        console.error("Error al cargar detalles:", e);
        modalContent.innerHTML = `<div class="text-center p-10"><p class="text-red-500 mb-4">Error al cargar datos.</p><button id="close-modal" class="px-4 py-2 bg-slate-800 rounded">Cerrar</button></div>`;
        document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
    }
}

// Funciones de apoyo para crear el HTML interno
function renderTypesBlock(title, typeSet) {
    if (typeSet.size === 0) return '';
    return `
        <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 w-full text-center">
            <p class="text-[9px] text-slate-400 font-bold uppercase mb-2">${title}</p>
            <div class="flex flex-wrap justify-center gap-1">
                ${Array.from(typeSet).map(t => `<div class="w-4 h-4 rounded-full shadow" style="background:${TYPE_COLORS[t] || TYPE_COLORS.default}" title="${t}"></div>`).join('')}
            </div>
        </div>
    `;
}

function renderMoveSection(title, moveList, titleColor, boxStyle) {
    if (moveList.length === 0) return '';
    return `
        <div>
            <h4 class="text-[11px] font-bold ${titleColor} uppercase mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full currentColor inline-block" style="background-color: currentColor"></span> ${title}
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                ${moveList.slice(0, 15).map(m => `
                    <div class="px-3 py-2 rounded-lg border ${boxStyle} text-[11px] text-slate-300 capitalize truncate-text hover:bg-slate-800 transition-colors cursor-default" title="${m.replace(/-/g, ' ')}">
                        ${m.replace(/-/g, ' ')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// --- 4. BÚSQUEDA Y SCROLL ---
let debounceTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) { 
            isSearching = false; 
            container.innerHTML = ""; 
            offset = 0; 
            fetchPokemons(); 
            return; 
        }
        
        isSearching = true;
        container.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500">Buscando...</div>`;
        try {
            const data = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`).then(r => r.json());
            container.innerHTML = "";
            renderCards([data]);
        } catch { 
            container.innerHTML = `<div class="col-span-full text-center py-10 text-red-400">No se encontró ningún Pokémon con ese nombre.</div>`; 
        }
    }, 500);
});

const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !isSearching) fetchPokemons();
}, { rootMargin: '300px' });

observer.observe(sentinel);

// Iniciar
fetchPokemons();

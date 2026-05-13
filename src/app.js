import { debounce } from './js/utils.js';

let offset = 0;
const limit = 20;
let isSearching = false;

const container = document.getElementById('pokemon-container');
const sentinel = document.getElementById('sentinel');

// 1. Fetch de datos con manejo de errores
async function fetchPokemonBatch() {
    if (isSearching) return;
    
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await response.json();
        
        // Ejecutamos peticiones en paralelo para las imágenes/tipos de cada card
        const detailPromises = data.results.map(p => fetch(p.url).then(res => res.json()));
        const pokemons = await Promise.all(detailPromises);
        
        renderCards(pokemons);
        offset += limit;
    } catch (err) {
        console.error("Error al cargar Pokémon:", err);
    }
}

// 2. Renderizado Eficiente
function renderCards(pokemons) {
    const fragment = document.createDocumentFragment();
    
    pokemons.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card bg-slate-800 rounded-xl p-4 cursor-pointer border border-slate-700';
        card.innerHTML = `
            <img src="${pokemon.sprites.other['official-artwork'].front_default}" 
                 loading="lazy" 
                 alt="${pokemon.name}"
                 class="w-full aspect-square object-contain mb-2"
                 onload="this.classList.add('loaded')">
            <span class="text-xs text-slate-400 font-mono">#${pokemon.id.toString().padStart(3, '0')}</span>
            <h3 class="capitalize font-bold">${pokemon.name}</h3>
            <div class="flex gap-1 mt-2">
                ${pokemon.types.map(t => `<span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-700">${t.type.name}</span>`).join('')}
            </div>
        `;
        card.onclick = () => showDetails(pokemon.id);
        fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
}

// 3. Infinite Scroll con Intersection Observer
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) fetchPokemonBatch();
}, { rootMargin: '200px' });

observer.observe(sentinel);

// 4. Búsqueda con Debounce
const handleSearch = debounce(async (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        isSearching = false;
        container.innerHTML = '';
        offset = 0;
        fetchPokemonBatch();
        return;
    }

    isSearching = true;
    container.innerHTML = '<p class="col-span-full text-center">Buscando...</p>';
    
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (!res.ok) throw new Error();
        const pokemon = await res.json();
        container.innerHTML = '';
        renderCards([pokemon]);
    } catch {
        container.innerHTML = '<p class="col-span-full text-center text-red-400">No se encontró el Pokémon.</p>';
    }
}, 400);

document.getElementById('search-input').addEventListener('input', handleSearch);

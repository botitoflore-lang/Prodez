import React, { useState, useEffect } from 'react';

const Pokedex = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [selectedPoke, setSelectedPoke] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Carga inicial (Ej: Kanto)
  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  const fetchDetails = async (url, name) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      // Lógica de Fallback para imágenes locales
      const model3d = data.sprites.other.showdown.front_default || `/assets/${name}.gif`;
      setSelectedPoke({ ...data, model3d });
    } catch (err) {
      console.error("Error cargando Pokémon");
    }
    setLoading(false);
  };

  return (
    <div className="pokedex-container">
      <header>
        <input 
          type="text" 
          placeholder="Buscar Pokémon..." 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </header>

      <div className="grid">
        {pokemonList
          .filter(p => p.name.includes(search.toLowerCase()))
          .map((p, index) => (
            <div key={p.name} className="card" onClick={() => fetchDetails(p.url, p.name)}>
              <img 
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${index + 1}.png`} 
                alt={p.name}
                onError={(e) => e.target.src = `/assets/${p.name}.gif`}
              />
              <h3>{p.name}</h3>
            </div>
          ))}
      </div>

      {selectedPoke && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={() => setSelectedPoke(null)}>X</button>
            <h2>{selectedPoke.name.toUpperCase()}</h2>
            <img className="model-3d" src={selectedPoke.model3d} alt="3D View" />
            
            <div className="info">
              <h3>Habilidades</h3>
              {selectedPoke.abilities.map(a => (
                <div key={a.ability.name} className="ability-tag">
                  {a.ability.name}
                  <span className="tooltip">Cargando descripción...</span>
                </div>
              ))}
              
              <h3>Tipos</h3>
              {selectedPoke.types.map(t => <span key={t.type.name}>{t.type.name} </span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pokedex;

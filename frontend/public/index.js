import { useEffect, useState } from 'react';

export default function FileGallery() {
  const [files, setFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  useEffect(() => {
    fetch('/api/playlists') // Endpoint para buscar playlists
      .then(response => response.json())
      .then(data => setPlaylists(data))
      .catch(error => console.error('Erro ao buscar playlists:', error));
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetch(`/api/list-files/${selectedFolder}`)
        .then(response => response.json())
        .then(data => setFiles(data))
        .catch(error => console.error('Erro ao listar arquivos:', error));
    }
  }, [selectedFolder]);

  const handlePlaylistChange = (e) => {
    setSelectedPlaylist(e.target.value);
    // Aqui você pode adicionar lógica para buscar as mídias da playlist selecionada
    fetch(`/api/playlists/${e.target.value}/media`) // Endpoint para buscar mídias da playlist
      .then(response => response.json())
      .then(data => {
        // Atualize os arquivos com as mídias da playlist
        setFiles(data);
      })
      .catch(error => console.error('Erro ao buscar mídias da playlist:', error));
  };

  return (
    <div>
      <h1>Galeria de Arquivos</h1>
      <select onChange={(e) => setSelectedFolder(e.target.value)}>
        <option value="">Selecione uma pasta</option>
        <option value="folder1">Pasta 1</option>
        <option value="folder2">Pasta 2</option>
      </select>

      <select onChange={handlePlaylistChange}>
        <option value="">Selecione uma playlist</option>
        {playlists.map((playlist) => (
          <option key={playlist._id} value={playlist._id}>
            {playlist.title}
          </option>
        ))}
      </select>

      <div>
        {files.map((url, index) => (
          <div key={index}>
            <a href={url} target="_blank">Ver Arquivo</a>
          </div>
        ))}
      </div>
    </div>
  );
}

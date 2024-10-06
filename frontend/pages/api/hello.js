import { useEffect, useState } from 'react';

export default function FileGallery() {
  const [files, setFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');

  useEffect(() => {
    if (selectedFolder) {
      fetch(`/api/list-files/${selectedFolder}`)
        .then(response => response.json())
        .then(data => setFiles(data));
    }
  }, [selectedFolder]);

  return (
    <div>
      <h1>Galeria de Arquivos</h1>
      <select onChange={(e) => setSelectedFolder(e.target.value)}>
        <option value="">Selecione uma pasta</option>
        <option value="folder1">Pasta 1</option>
        <option value="folder2">Pasta 2</option>
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

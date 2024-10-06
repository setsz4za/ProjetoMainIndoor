// Função para listar todas as pastas
const listFolders = async () => {
    try {
        const response = await fetch('http://localhost:3000/folders');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const folderSelect = document.getElementById('folder-select');
        folderSelect.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.innerText = 'Selecione uma pasta';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        folderSelect.appendChild(defaultOption);

        if (Array.isArray(data.folders) && data.folders.length > 0) {
            data.folders.forEach((folderName) => {
                const option = document.createElement('option');
                option.value = folderName;
                option.innerText = folderName;
                folderSelect.appendChild(option);
            });
        } else {
            alert("Nenhuma pasta encontrada.");
        }
    } catch (error) {
        alert(`Erro ao carregar a lista de pastas: ${error.message}`);
    }
};

// Função para listar e exibir arquivos da pasta selecionada
const listFiles = async (folderPath) => {
    try {
        const response = await fetch(`http://localhost:3000/files?folderPath=${folderPath}`);
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const fileContainer = document.getElementById('file-container');
        fileContainer.innerHTML = '';

        if (data.files && data.files.length > 0) {
            data.files.forEach((file) => {
                displayFile(file.name, file.url);
            });
        } else {
            fileContainer.innerHTML = '<p>Nenhum arquivo encontrado nesta pasta.</p>';
        }
    } catch (error) {
        alert(`Erro ao listar arquivos: ${error.message}`);
    }
};

// Função para exibir o arquivo no HTML
const displayFile = (fileName, url) => {
    const fileContainer = document.createElement('div');

    if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = fileName;
        fileContainer.appendChild(img);
    } else if (fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        fileContainer.appendChild(video);
    } else if (fileName.endsWith('.txt')) {
        const link = document.createElement('a');
        link.href = url;
        link.innerText = fileName;
        link.className = 'text-file';
        link.target = '_blank';

        const popup = document.createElement('div');
        popup.className = 'popup';
        loadTextFile(url, popup); // Carregar conteúdo do arquivo de texto
        fileContainer.appendChild(link);
        fileContainer.appendChild(popup);
    }

    document.getElementById('file-container').appendChild(fileContainer);
};

// Função para carregar conteúdo do arquivo de texto
const loadTextFile = async (url, popup) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
        }
        const text = await response.text();
        popup.innerText = text;
    } catch (error) {
        console.error("Erro ao carregar o arquivo de texto: ", error);
        popup.innerText = `Erro ao carregar o arquivo de texto: ${error.message}`;
    }
};

// Função para upload de arquivo
const uploadFile = async () => {
    const fileInput = document.getElementById('file-input');
    const folderSelect = document.getElementById('folder-select');
    const selectedFolder = folderSelect.value;

    if (!selectedFolder) {
        alert('Por favor, selecione uma pasta antes de fazer o upload.');
        return;
    }

    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, selecione um arquivo para fazer o upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', selectedFolder);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro ao fazer upload: ${response.status} ${response.statusText}`);
        }

        alert('Upload realizado com sucesso!');
        listFiles(selectedFolder); // Atualizar a lista de arquivos após o upload
    } catch (error) {
        alert(`Erro ao fazer upload: ${error.message}`);
    }
};

// Event Listeners
document.getElementById('folder-select').addEventListener('change', (event) => {
    const folderPath = event.target.value;
    listFiles(folderPath);
});

document.getElementById('upload-btn').addEventListener('click', uploadFile);
document.getElementById('create-playlist-btn').addEventListener('click', createPlaylist);
document.getElementById('go-to-playlist-btn').addEventListener('click', () => {
    window.location.href = 'view-playlist.html'; // Navegar para a página de playlists
});

// Inicialização
listFolders();

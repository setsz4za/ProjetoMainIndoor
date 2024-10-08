const express = require('express');
const cors = require('cors'); // Para evitar problemas com CORS
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Habilita CORS
app.use(bodyParser.json()); // Faz o parsing de requisições JSON

// Simulação de banco de dados temporário
let playlists = []; // Um array temporário para armazenar as playlists

// Rota raiz (apenas para verificar se o servidor está rodando)
app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

// Rota para criar uma nova playlist
app.post('/playlists', (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'O título da playlist é obrigatório.' });
    }

    // Cria uma nova playlist e adiciona ao array temporário
    const newPlaylist = {
      id: playlists.length + 1,
      title,
      description: description || 'Sem descrição',
      createdAt: new Date(),
    };
    
    playlists.push(newPlaylist); // Adiciona a nova playlist ao array
    
    res.status(201).json({ message: 'Playlist criada com sucesso', playlist: newPlaylist });
  } catch (error) {
    console.error('Erro ao criar a playlist:', error);
    res.status(500).json({ message: 'Erro ao criar a playlist' });
  }
});

// Rota para listar todas as playlists (opcional, mas útil para depuração)
app.get('/playlists', (req, res) => {
  res.status(200).json(playlists);
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

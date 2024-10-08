// Importações de pacotes necessários
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializar o aplicativo Express
const app = express();

// Middleware para permitir CORS (cross-origin resource sharing)
app.use(cors());

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Conectar ao MongoDB utilizando a URL do MongoDB Atlas do arquivo .env
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado ao MongoDB Atlas'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Definição do modelo de Mídia no MongoDB
const mediaSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'image' ou 'video'
  url: { type: String, required: true },  // URL da mídia
  filename: { type: String }              // Nome do arquivo, caso seja um upload
});

const Media = mongoose.model('Media', mediaSchema);

// Definição do modelo de Playlist no MongoDB
const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome da playlist
  media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }]  // Referências às mídias da playlist
});

const Playlist = mongoose.model('Playlist', playlistSchema);

// Rota para adicionar uma mídia (imagem ou vídeo)
app.post('/media', async (req, res) => {
  try {
    const { type, url, filename } = req.body;

    // Criar nova mídia no banco de dados
    const newMedia = new Media({ type, url, filename });
    await newMedia.save();

    res.status(201).json(newMedia);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar mídia' });
  }
});

// Rota para criar uma nova playlist
app.post('/playlists', async (req, res) => {
  try {
    const { name, mediaIds } = req.body;

    // Criar nova playlist com as mídias associadas
    const newPlaylist = new Playlist({
      name,
      media: mediaIds  // Array de IDs das mídias
    });

    await newPlaylist.save();
    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar playlist' });
  }
});

// Rota para listar todas as playlists
app.get('/playlists', async (req, res) => {
  try {
    // Buscar todas as playlists e popular as mídias associadas
    const playlists = await Playlist.find().populate('media');
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar playlists' });
  }
});

// Definir a porta do servidor (5000 ou a porta definida no arquivo .env)
const PORT = process.env.PORT || 5000;

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

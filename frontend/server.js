const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors()); // Habilita o CORS
app.use(express.json());

// Conectando ao MongoDB (verifique o arquivo .env para a string de conexão)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas
const playlistRoutes = require('./routes/playlist');
app.use('/api', playlistRoutes);

// Iniciando o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

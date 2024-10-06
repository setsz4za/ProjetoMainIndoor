const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const serviceAccount = require('./firebaseConfig.json'); // Substitua pelo caminho correto
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do multer para lidar com uploads
const upload = multer({ storage: multer.memoryStorage() });

// Inicializar o Firebase Admin SDK
initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'projetopi4-d8195.appspot.com',
});

const bucket = getStorage().bucket();

// Função para obter URLs de todas as imagens do Firebase Storage
async function getAllFileUrls() {
    try {
        const [files] = await bucket.getFiles();
        const fileUrls = await Promise.all(files.map(async (file) => {
            const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
            return { name: file.name, url };
        }));
        return fileUrls;
    } catch (error) {
        console.error('Erro ao obter as URLs das imagens:', error);
        throw new Error('Erro ao obter as URLs das imagens');
    }
}

// Função para listar pastas na raiz do Firebase Storage
async function listFolders() {
    try {
        const [files, , apiResponse] = await bucket.getFiles({
            delimiter: '/', // Definir o delimitador para obter apenas diretórios
            maxResults: 1000,
        });

        const prefixes = apiResponse.prefixes || [];
        return prefixes; // Retorna as pastas
    } catch (error) {
        console.error("Erro ao listar pastas:", error.message);
        throw new Error("Erro ao listar pastas");
    }
}

// Testar conexão com o bucket
app.get('/test-bucket', async (req, res) => {
    try {
        const [files] = await bucket.getFiles();
        const fileNames = files.map(file => file.name);
        console.log('Arquivos no bucket:', fileNames);
        res.json({ files: fileNames });
    } catch (error) {
        console.error("Erro ao acessar o bucket:", error.message);
        res.status(500).send(`Erro ao acessar o bucket: ${error.message}`);
    }
});


// Endpoint para listar pastas
app.get('/folders', async (req, res) => {
    try {
        const folders = await listFolders();
        res.json({ folders });
    } catch (error) {
        console.error('Erro ao listar pastas:', error.message);
        res.status(500).send('Erro ao listar pastas.');
    }
});

// Listar arquivos em uma pasta
app.get('/files', async (req, res) => {
    const { folderPath } = req.query;
    try {
        const [files] = await bucket.getFiles({ prefix: folderPath });
        const fileUrls = await Promise.all(files.map(async (file) => {
            const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
            return { name: file.name, url };
        }));
        res.json({ files: fileUrls });
    } catch (error) {
        console.error("Erro ao listar arquivos:", error);
        res.status(500).send("Erro ao listar arquivos.");
    }
});

// Upload de arquivo e listar todas as URLs após o upload
app.post('/upload', upload.single('file'), async (req, res) => {
    const { file } = req;
    const { folderPath } = req.body;

    if (!file || !folderPath) {
        return res.status(400).send('Arquivo e pasta são necessários.');
    }

    const blob = bucket.file(`${folderPath}/${Date.now()}_${file.originalname}`);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });

    blobStream.on('error', (err) => {
        console.error('Erro ao fazer upload: ', err);
        res.status(500).send('Erro ao fazer upload.');
    });

    blobStream.on('finish', async () => {
        // Obter a URL do arquivo recém-enviado
        const [url] = await blob.getSignedUrl({ action: 'read', expires: '03-01-2500' });

        // Inserir o arquivo no banco de dados usando Prisma
        try {
            await prisma.uploads.create({
                data: {
                    NomeArquivo: file.originalname,
                    URL: url,
                    Pasta: folderPath, // Salvar a pasta onde o arquivo foi feito o upload
                },
            });
            console.log("Arquivo salvo no banco de dados:", url);

            // Obter URLs de todas as imagens no Firebase Storage (incluindo a recém-enviada)
            const allFileUrls = await getAllFileUrls();

            // Retornar a URL do arquivo recém-enviado e todas as outras URLs no bucket
            res.json({
                message: 'Upload realizado com sucesso!',
                uploadedFileUrl: url,
                allFiles: allFileUrls,
            });
        } catch (error) {
            console.error("Erro ao salvar o arquivo no banco de dados:", error);
            res.status(500).send("Erro ao salvar o arquivo no banco de dados.");
        }
    });

    blobStream.end(file.buffer);
});


// Criar uma nova playlist
app.post('/playlists', async (req, res) => {
    const { name, mediaUrls } = req.body;

    if (!name || !mediaUrls || mediaUrls.length === 0) {
        return res.status(400).send('Nome da playlist e URLs das mídias são necessários.');
    }

    try {
        // Criar a playlist no banco de dados
        const playlist = await prisma.playlist.create({
            data: {
                name,
                media: {
                    create: mediaUrls.map(url => ({ url })),
                },
            },
            include: {
                media: true,  // Inclui as mídias relacionadas à playlist
            },
        });

        res.json({ message: 'Playlist criada com sucesso!', playlist });
    } catch (error) {
        console.error('Erro ao criar a playlist:', error);
        res.status(500).send('Erro ao criar a playlist.');
    }
});

// Obter todas as playlists
app.get('/playlists', async (req, res) => {
    try {
        const playlists = await prisma.playlist.findMany({
            include: {
                media: true,  // Incluir mídias relacionadas
            },
        });
        res.json({ playlists });
    } catch (error) {
        console.error('Erro ao obter as playlists:', error);
        res.status(500).send('Erro ao obter as playlists.');
    }
});

// Obter uma playlist por ID
app.get('/playlists/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: Number(id) },
            include: {
                media: true,
            },
        });

        if (!playlist) {
            return res.status(404).send('Playlist não encontrada.');
        }

        res.json({ playlist });
    } catch (error) {
        console.error('Erro ao obter a playlist:', error);
        res.status(500).send('Erro ao obter a playlist.');
    }
});

async function getFileUrlsInFolder(folderPath) {
    try {
        const [files] = await bucket.getFiles({ prefix: folderPath });
        const fileUrls = await Promise.all(files.map(async (file) => {
            const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
            return { name: file.name, url };
        }));
        return fileUrls;
    } catch (error) {
        console.error(`Erro ao obter URLs dos arquivos na pasta ${folderPath}:`, error.message);
        throw new Error(`Erro ao obter URLs dos arquivos na pasta ${folderPath}`);
    }
}

// Função para salvar mídias no banco de dados
async function salvarMidiasNoBanco(pasta, nomeArquivo, url) {
    try {
        await prisma.midias.create({
            data: {
                NomeArquivo: nomeArquivo,
                URL_playlist: url, // Supondo que URL_playlist seja a URL do arquivo
                Pasta: pasta,      // Nome da pasta onde o arquivo está localizado
            },
        });
        console.log(`Mídia ${nomeArquivo} da pasta ${pasta} salva no banco de dados.`);
    } catch (error) {
        console.error(`Erro ao salvar a mídia ${nomeArquivo} no banco de dados:`, error.message);
    }
}

// Função para listar todas as mídias de todas as pastas e armazenar no banco de dados
app.get('/save-all-media-to-db', async (req, res) => {
    try {
        const folders = await listFolders(); // Obter todas as pastas

        for (const folder of folders) {
            const mediaFiles = await getFileUrlsInFolder(folder); // Obter todos os arquivos na pasta

            for (const media of mediaFiles) {
                const nomeArquivo = media.name.split('/').pop(); // Extrair o nome do arquivo do caminho completo
                await salvarMidiasNoBanco(folder, nomeArquivo, media.url); // Salvar a mídia no banco de dados
            }
        }

        res.json({ message: 'Todas as mídias foram salvas no banco de dados com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar mídias no banco de dados:', error.message);
        res.status(500).send('Erro ao salvar mídias no banco de dados.');
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

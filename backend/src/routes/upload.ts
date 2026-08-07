import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Em vez de salvar no disco direto, salvamos na memória primeiro
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    // Aceita apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

router.use(authenticateToken);

// Rota para upload
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }
    
    // Gera um nome de arquivo único com extensão otimizada (webp)
    const filename = `${uuidv4()}.webp`;
    const uploadsDir = path.join(__dirname, '../../uploads');
    const outputPath = path.join(uploadsDir, filename);

    // Garante que o diretório exista
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Otimiza a imagem usando o sharp
    await sharp(req.file.buffer)
      .resize(600, 600, { 
        fit: 'inside',      // Redimensiona mantendo a proporção (máx 600x600)
        withoutEnlargement: true 
      })
      .webp({ quality: 80 }) // Converte para webp com 80% de qualidade
      .toFile(outputPath);
    
    // Constrói a URL pública da imagem
    const protocol = req.protocol;
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/uploads/${filename}`;
    
    res.json({ imageUrl: publicUrl });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

export default router;

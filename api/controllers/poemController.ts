import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, CreatePoemRequest, Poem, MeterCheckResult, AudioUploadResponse } from '../../shared/types.js';
import { createPoem, getPoemById, getUserPoems, updatePoem, deletePoem, updatePoemAudio, sharePoem, incrementViews } from '../repositories/poemRepository.js';
import { checkMeter } from '../services/meterService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads/audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `poem-${uniqueSuffix}.mp3`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'audio/mpeg' && 
        file.mimetype !== 'audio/mp3' && 
        file.mimetype !== 'audio/x-mpeg-3' &&
        file.mimetype !== 'audio/mpeg3') {
      return cb(new Error(`仅支持MP3格式音频，当前文件类型：${file.mimetype}`));
    }
    if (!file.originalname.toLowerCase().endsWith('.mp3')) {
      return cb(new Error(`文件扩展名必须是.mp3，当前文件：${file.originalname}`));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export function checkPoemMeter(req: AuthRequest, res: Response<ApiResponse<MeterCheckResult>>) {
  try {
    const { content, genre } = req.body;

    if (!content || !genre) {
      return res.status(400).json({
        success: false,
        errors: ['请提供诗歌内容和体裁'],
      });
    }

    const result = checkMeter(content, genre);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['格律校验失败'],
    });
  }
}

export function createPoemHandler(req: AuthRequest, res: Response<ApiResponse<Poem>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['未登录'],
      });
    }

    const { title, content, genre, categoryId, tonePattern, rhymePattern }: CreatePoemRequest = req.body;
    const errors: string[] = [];

    if (!title || title.trim().length === 0) {
      errors.push('标题不能为空');
    }
    if (!content || content.trim().length === 0) {
      errors.push('正文不能为空');
    }
    if (!genre) {
      errors.push('请选择诗歌体裁');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const poem = createPoem(req.user.id, {
      title: title.trim(),
      content: content.trim(),
      genre,
      categoryId,
      tonePattern,
      rhymePattern,
    });

    res.status(201).json({
      success: true,
      data: poem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['创建作品失败'],
    });
  }
}

export function getMyPoems(req: AuthRequest, res: Response<ApiResponse<Poem[]>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['未登录'],
      });
    }

    const { genre, page, limit } = req.query;
    const poems = getUserPoems(req.user.id, {
      genre: genre as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: poems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取作品列表失败'],
    });
  }
}

export function getPoemDetail(req: AuthRequest, res: Response<ApiResponse<Poem>>) {
  try {
    const { id } = req.params;
    const poem = getPoemById(parseInt(id), true);

    if (!poem) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在'],
      });
    }

    if (req.user && poem.userId !== req.user.id && poem.isShared && poem.isApproved) {
      incrementViews(parseInt(id));
    }

    if (!req.user || (poem.userId !== req.user.id && !(poem.isShared && poem.isApproved))) {
      return res.status(403).json({
        success: false,
        errors: ['无权访问该作品'],
      });
    }

    res.json({
      success: true,
      data: poem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['获取作品详情失败'],
    });
  }
}

export function updatePoemHandler(req: AuthRequest, res: Response<ApiResponse<Poem>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['未登录'],
      });
    }

    const { id } = req.params;
    const poem = getPoemById(parseInt(id));

    if (!poem) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在'],
      });
    }

    if (poem.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        errors: ['无权修改该作品'],
      });
    }

    const updated = updatePoem(parseInt(id), req.body);

    res.json({
      success: true,
      data: updated!,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['更新作品失败'],
    });
  }
}

export function deletePoemHandler(req: AuthRequest, res: Response<ApiResponse<null>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['未登录'],
      });
    }

    const { id } = req.params;
    const poem = getPoemById(parseInt(id));

    if (!poem) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在'],
      });
    }

    if (poem.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        errors: ['无权删除该作品'],
      });
    }

    const deleted = deletePoem(parseInt(id));
    if (!deleted) {
      return res.status(500).json({
        success: false,
        errors: ['删除失败'],
      });
    }

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['删除作品失败'],
    });
  }
}

export function sharePoemHandler(req: AuthRequest, res: Response<ApiResponse<Poem>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['未登录'],
      });
    }

    const { id } = req.params;
    const poem = getPoemById(parseInt(id));

    if (!poem) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在'],
      });
    }

    if (poem.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        errors: ['无权分享该作品'],
      });
    }

    const shared = sharePoem(parseInt(id));

    res.json({
      success: true,
      data: shared!,
      message: '已提交分享，等待管理员审核',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['分享作品失败'],
    });
  }
}

function checkMP3FileHeader(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { start: 0, end: 1024 });
    let data = Buffer.alloc(0);

    stream.on('data', (chunk) => {
      data = Buffer.concat([data, chunk as Buffer]);
    });

    stream.on('end', () => {
      if (data.length < 3) {
        resolve(false);
        return;
      }

      const id3Header = data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33;
      const frameSync = data[0] === 0xFF && (data[1] & 0xE0) === 0xE0;

      if (id3Header || frameSync) {
        resolve(true);
        return;
      }

      let found = false;
      const maxCheck = Math.min(1024, data.length - 2);
      for (let i = 0; i < maxCheck; i++) {
        if (data[i] === 0xFF && (data[i + 1] & 0xE0) === 0xE0) {
          const version = (data[i + 1] & 0x18) >> 3;
          const layer = (data[i + 1] & 0x06) >> 1;
          if (version !== 1 && layer === 1) {
            found = true;
            break;
          }
        }
      }
      resolve(found);
    });

    stream.on('error', () => {
      resolve(false);
    });
  });
}

export async function uploadAudioHandler(req: AuthRequest, res: Response<ApiResponse<AudioUploadResponse>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['未登录'],
      });
    }

    const { id } = req.params;
    const poem = getPoemById(parseInt(id));

    if (!poem) {
      return res.status(404).json({
        success: false,
        errors: ['作品不存在或已被删除'],
      });
    }

    if (poem.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        errors: ['无权上传该作品的音频'],
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        errors: ['请上传音频文件'],
      });
    }

    const isRealMP3 = await checkMP3FileHeader(req.file.path);
    if (!isRealMP3) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        errors: ['该文件不是真正的MP3格式，请确保音频编码正确，推荐使用格式工厂等工具转换后再上传'],
      });
    }

    const { duration, waveform } = req.body;
    const waveformData = waveform ? JSON.parse(waveform) : generateWaveformData();

    const audioUrl = `/uploads/audio/${req.file.filename}`;
    const updated = updatePoemAudio(parseInt(id), audioUrl, parseInt(duration) || 0, waveformData);

    if (!updated) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        errors: ['保存音频信息失败，请稍后重试'],
      });
    }

    res.json({
      success: true,
      data: {
        audioUrl,
        audioDuration: parseInt(duration) || 0,
        waveformData,
      },
      message: '音频上传成功',
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
    }
    if (error.message.includes('仅支持MP3')) {
      return res.status(400).json({
        success: false,
        errors: [error.message],
      });
    }
    if (error.message.includes('File too large')) {
      return res.status(400).json({
        success: false,
        errors: ['音频文件大小不能超过10MB，请压缩后再上传'],
      });
    }
    res.status(500).json({
      success: false,
      errors: [error.message || '音频上传失败，请稍后重试'],
    });
  }
}

function generateWaveformData(): number[] {
  const data: number[] = [];
  for (let i = 0; i < 100; i++) {
    data.push(Math.random() * 0.8 + 0.2);
  }
  return data;
}

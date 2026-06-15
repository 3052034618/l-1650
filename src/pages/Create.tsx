import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Share2, AlertCircle, CheckCircle, Feather, Upload } from 'lucide-react';
import { api } from '../utils/api';
import { MeterCheckResult, Category } from '../../shared/types.js';
import MeterChecker from '../components/MeterChecker';
import AudioRecorder from '../components/AudioRecorder';
import { cn } from '../lib/utils';

export default function Create() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [genre, setGenre] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [meterResult, setMeterResult] = useState<MeterCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string; genre?: string; audio?: string }>({});
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [audioUploaded, setAudioUploaded] = useState(false);
  const [createdPoemId, setCreatedPoemId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await api.categories.getAll();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    };
    fetchCategories();
  }, []);

  const checkMeter = useCallback(async () => {
    if (!content.trim() || !genre) {
      setMeterResult(null);
      return;
    }

    setChecking(true);
    try {
      const res = await api.poems.check(content, genre);
      if (res.success && res.data) {
        setMeterResult(res.data);
      }
    } catch (error) {
      console.error('Failed to check meter:', error);
    } finally {
      setChecking(false);
    }
  }, [content, genre]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkMeter();
    }, 500);
    return () => clearTimeout(timer);
  }, [content, genre, checkMeter]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) {
      newErrors.title = '请输入诗歌标题';
    }
    if (!content.trim()) {
      newErrors.content = '请输入诗歌正文';
    }
    if (!genre) {
      newErrors.genre = '请选择诗歌体裁';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAudioUpload = (file: File, duration: number, waveformData: number[]) => {
    setAudioFile(file);
    setAudioDuration(duration);
    setWaveform(waveformData);
    setErrors(prev => ({ ...prev, audio: undefined }));
  };

  const checkRealMP3 = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer || arrayBuffer.byteLength < 3) {
          resolve(false);
          return;
        }

        const dataView = new DataView(arrayBuffer);
        
        const id3Header = (dataView.getUint8(0) === 0x49 && 
                          dataView.getUint8(1) === 0x44 && 
                          dataView.getUint8(2) === 0x33);
        
        const frameSync = (dataView.getUint8(0) === 0xFF && 
                          (dataView.getUint8(1) & 0xE0) === 0xE0);

        if (!id3Header && !frameSync) {
          let found = false;
          const maxCheck = Math.min(1024, arrayBuffer.byteLength - 2);
          for (let i = 0; i < maxCheck; i++) {
            if (dataView.getUint8(i) === 0xFF && (dataView.getUint8(i + 1) & 0xE0) === 0xE0) {
              const version = (dataView.getUint8(i + 1) & 0x18) >> 3;
              const layer = (dataView.getUint8(i + 1) & 0x06) >> 1;
              if (version !== 1 && layer === 1) {
                found = true;
                break;
              }
            }
          }
          resolve(found);
        } else {
          resolve(true);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 1024));
    });
  };

  const validateAudio = async (): Promise<boolean> => {
    if (!audioFile) return true;

    const fileSizeMB = audioFile.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      setErrors(prev => ({ ...prev, audio: `音频文件大小不能超过10MB，当前${fileSizeMB.toFixed(2)}MB` }));
      return false;
    }

    if (fileSizeMB < 0.01) {
      setErrors(prev => ({ ...prev, audio: '音频文件过小，可能无效' }));
      return false;
    }

    const isValidExtension = audioFile.name.toLowerCase().endsWith('.mp3');
    if (!isValidExtension) {
      setErrors(prev => ({ ...prev, audio: `文件扩展名必须是 .mp3，当前文件：${audioFile.name}` }));
      return false;
    }

    const isValidMimeType = 
      audioFile.type === 'audio/mp3' || 
      audioFile.type === 'audio/mpeg' || 
      audioFile.type === 'audio/x-mpeg-3' ||
      audioFile.type === 'audio/mpeg3';
    
    if (!isValidMimeType) {
      setErrors(prev => ({ ...prev, audio: `文件MIME类型不正确，当前类型：${audioFile.type || '未知'}，需要 audio/mp3 或 audio/mpeg` }));
      return false;
    }

    const isRealMP3 = await checkRealMP3(audioFile);
    if (!isRealMP3) {
      setErrors(prev => ({ ...prev, audio: '该文件不是真正的MP3格式，请确保音频编码正确，推荐使用格式工厂等工具转换' }));
      return false;
    }

    if (audioDuration === 0) {
      setErrors(prev => ({ ...prev, audio: '音频时长无效，请重新录制或上传有效的MP3文件' }));
      return false;
    }

    if (waveform.length === 0) {
      setErrors(prev => ({ ...prev, audio: '波形数据无效，请重新录制或上传' }));
      return false;
    }

    return true;
  };

  const uploadAudio = async (poemId: number): Promise<boolean> => {
    if (!audioFile) return true;

    const isValid = await validateAudio();
    if (!isValid) return false;

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('duration', String(audioDuration));
    formData.append('waveform', JSON.stringify(waveform));

    try {
      const res = await api.poems.uploadAudio(poemId, formData);
      if (res.success) {
        setAudioUploaded(true);
        return true;
      } else {
        setErrors(prev => ({ 
          ...prev, 
          audio: res.errors?.[0] || '音频上传失败，请稍后重试。如果问题持续，请尝试压缩音频文件或更换其他MP3文件' 
        }));
        return false;
      }
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        audio: err.message || '网络错误，音频上传失败，请检查网络连接后重试' 
      }));
      return false;
    }
  };

  const handleSave = async (share: boolean = false) => {
    setErrors({});

    if (!validate()) return;
    
    if (audioFile) {
      const audioValid = await validateAudio();
      if (!audioValid) return;
    }

    setSaving(true);
    let createdPoemIdToRollback: number | null = null;
    try {
      const category = categories.find(c => c.name === genre);
      const res = await api.poems.create({
        title: title.trim(),
        content: content.trim(),
        genre,
        categoryId: category?.id,
      });

      if (!res.success || !res.data) {
        setErrors(prev => ({ ...prev, content: res.errors?.[0] || '保存作品失败，请稍后重试' }));
        return;
      }

      const poemId = res.data.id;
      createdPoemIdToRollback = poemId;
      setCreatedPoemId(poemId);

      if (audioFile) {
        const audioUploaded = await uploadAudio(poemId);
        if (!audioUploaded) {
          await api.poems.delete(poemId);
          createdPoemIdToRollback = null;
          return;
        }
      }

      if (share) {
        const shareRes = await api.poems.share(poemId);
        if (!shareRes.success) {
          setErrors(prev => ({ ...prev, content: shareRes.errors?.[0] || '发布失败，但作品已保存为草稿' }));
        }
      }

      navigate(`/works/${poemId}`);
    } catch (error: any) {
      if (createdPoemIdToRollback) {
        try { await api.poems.delete(createdPoemIdToRollback); } catch (e) {}
      }
      setErrors(prev => ({ ...prev, content: error.message || '网络错误，请稍后重试' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center">
              <Feather className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-serif">创作新诗</h1>
              <p className="text-gray-400">挥洒灵感，记录诗意瞬间</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-3 bg-[#f5f0e1]/10 border border-[#f5f0e1]/30 rounded-lg text-white font-medium flex items-center gap-2 hover:bg-[#f5f0e1]/20 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              保存草稿
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg text-white font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#e94560]/30 transition-all disabled:opacity-50"
            >
              <Share2 className="w-5 h-5" />
              发布到社区
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <label className="block text-white font-medium mb-3">诗歌标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="请输入诗歌标题..."
                className={cn(
                  'w-full px-4 py-3 bg-[#0f0f1a] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all',
                  errors.title ? 'border-red-500' : 'border-[#f5f0e1]/20'
                )}
              />
              {errors.title && (
                <p className="mt-2 text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-white font-medium">诗歌正文</label>
                <span className="text-sm text-gray-500">{content.length} 字</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setErrors(prev => ({ ...prev, content: undefined }));
                }}
                placeholder="请输入诗歌正文，每行一句..."
                rows={12}
                className={cn(
                  'w-full px-4 py-3 bg-[#0f0f1a] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] transition-all resize-none font-serif text-lg leading-loose',
                  errors.content ? 'border-red-500' : 'border-[#f5f0e1]/20'
                )}
              />
              {errors.content && (
                <p className="mt-2 text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.content}
                </p>
              )}
            </div>

            {checking && (
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
                <span>正在检测格律...</span>
              </div>
            )}

            <MeterChecker result={meterResult} content={content} />

            <AudioRecorder onUpload={handleAudioUpload} />
            {errors.audio && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.audio}
              </p>
            )}
            {audioFile && (
              <div className="flex items-center gap-3 p-4 bg-[#4a7c59]/10 border border-[#4a7c59]/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#4a7c59]" />
                <div>
                  <p className="text-white font-medium">音频已准备就绪</p>
                  <p className="text-sm text-gray-400">
                    {audioFile.name} · {Math.floor(audioDuration / 60)}分{audioDuration % 60}秒 · {(audioFile.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <label className="block text-white font-medium mb-4">选择体裁</label>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setGenre(cat.name);
                      setErrors(prev => ({ ...prev, genre: undefined }));
                    }}
                    className={cn(
                      'w-full p-4 rounded-lg text-left transition-all border',
                      genre === cat.name
                        ? 'bg-gradient-to-r from-[#e94560]/20 to-transparent border-[#e94560] text-white'
                        : 'bg-[#0f0f1a] border-[#f5f0e1]/20 text-gray-300 hover:border-[#e94560]/50'
                    )}
                  >
                    <div className="font-medium mb-1">{cat.name}</div>
                    <div className="text-xs text-gray-500">{cat.description}</div>
                  </button>
                ))}
              </div>
              {errors.genre && (
                <p className="mt-3 text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.genre}
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#4a7c59]" />
                音频说明
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#e94560]">•</span>
                  <span>仅限 MP3 格式音频</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e94560]">•</span>
                  <span>单文件大小不超过 10MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e94560]">•</span>
                  <span>最长录制 5 分钟</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e94560]">•</span>
                  <span>系统自动生成波形图</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10">
              <h3 className="text-white font-medium mb-4">创作提示</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>1. 近体诗需严格遵守平仄押韵规则</p>
                <p>2. 绝句4句，律诗8句，每句字数固定</p>
                <p>3. 偶数句需押韵，首句可押可不押</p>
                <p>4. 律诗中间两联需对仗</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

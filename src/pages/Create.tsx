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

  const uploadAudio = async (poemId: number) => {
    if (!audioFile) return;

    const fileSizeMB = audioFile.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      setErrors(prev => ({ ...prev, audio: '音频文件大小不能超过10MB' }));
      return;
    }

    if (audioFile.type !== 'audio/mp3' && audioFile.type !== 'audio/mpeg' && !audioFile.name.endsWith('.mp3')) {
      setErrors(prev => ({ ...prev, audio: '仅限MP3格式音频' }));
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('duration', String(audioDuration));
    formData.append('waveform', JSON.stringify(waveform));

    const res = await api.poems.uploadAudio(poemId, formData);
    if (res.success) {
      setAudioUploaded(true);
    } else {
      setErrors(prev => ({ ...prev, audio: res.errors?.[0] || '音频上传失败' }));
    }
  };

  const handleSave = async (share: boolean = false) => {
    if (!validate()) return;

    setSaving(true);
    try {
      const category = categories.find(c => c.name === genre);
      const res = await api.poems.create({
        title: title.trim(),
        content: content.trim(),
        genre,
        categoryId: category?.id,
      });

      if (res.success && res.data) {
        const poemId = res.data.id;
        setCreatedPoemId(poemId);

        if (audioFile) {
          await uploadAudio(poemId);
        }

        if (share) {
          await api.poems.share(poemId);
        }

        navigate(`/works/${poemId}`);
      } else {
        setErrors(prev => ({ ...prev, content: res.errors?.[0] || '保存失败' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, content: '网络错误，请稍后重试' }));
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

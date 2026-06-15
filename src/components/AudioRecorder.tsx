import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Volume2, FileAudio, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioRecorderProps {
  onUpload: (file: File, duration: number, waveform: number[]) => void;
  maxDuration?: number;
  maxSizeMB?: number;
}

export default function AudioRecorder({ onUpload, maxDuration = 300, maxSizeMB = 10 }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [fileInputMode, setFileInputMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const validateMP3File = async (file: File): Promise<string | null> => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `文件大小不能超过${maxSizeMB}MB，当前${fileSizeMB.toFixed(2)}MB`;
    }

    if (fileSizeMB < 0.01) {
      return '音频文件过小，可能无效';
    }

    const isValidExtension = file.name.toLowerCase().endsWith('.mp3');
    if (!isValidExtension) {
      return `文件扩展名必须是 .mp3，当前文件：${file.name}`;
    }

    const isValidMimeType = 
      file.type === 'audio/mp3' || 
      file.type === 'audio/mpeg' || 
      file.type === 'audio/x-mpeg-3' ||
      file.type === 'audio/mpeg3';
    
    if (!isValidMimeType) {
      return `文件MIME类型不正确，当前类型：${file.type || '未知'}，需要 audio/mp3 或 audio/mpeg`;
    }

    const isRealMP3 = await checkMP3Header(file);
    if (!isRealMP3) {
      return '该文件不是真正的MP3格式，请确保音频编码正确';
    }

    return null;
  };

  const checkMP3Header = async (file: File): Promise<boolean> => {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateWaveformData = useCallback((audioBuffer: AudioBuffer): number[] => {
    const data: number[] = [];
    const channelData = audioBuffer.getChannelData(0);
    const samples = 100;
    const blockSize = Math.floor(channelData.length / samples);

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      data.push(sum / blockSize);
    }

    const max = Math.max(...data);
    return data.map(d => d / max);
  }, []);

  const getSupportedMp3MimeType = (): string | null => {
    const types = ['audio/mp3', 'audio/mpeg', 'audio/mpeg3', 'audio/x-mpeg-3'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      const mp3MimeType = getSupportedMp3MimeType();
      if (!mp3MimeType) {
        setError('您的浏览器不支持直接录制MP3格式，请使用"上传MP3"按钮选择已有的MP3文件，或使用Chrome/Edge浏览器');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: mp3MimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mp3Blob = new Blob(audioChunksRef.current, { type: mp3MimeType });
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await mp3Blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const waveformData = generateWaveformData(audioBuffer);
        const url = URL.createObjectURL(mp3Blob);
        
        setRecordedBlob(mp3Blob);
        setAudioUrl(url);
        setWaveform(waveformData);
        setDuration(Math.floor(audioBuffer.duration));

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setWaveform([]);

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      const updateWaveform = () => {
        if (analyser && isRecording) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const newWaveform: number[] = [];
          for (let i = 0; i < 30; i++) {
            newWaveform.push(dataArray[Math.floor(i * dataArray.length / 30)] / 255);
          }
          setWaveform(newWaveform);
        }
        animationRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

    } catch (err) {
      setError('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlay = () => {
    if (!audioElementRef.current) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const processAudioFile = async (file: File) => {
    setValidating(true);
    try {
      const validationError = await validateMP3File(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const waveformData = generateWaveformData(audioBuffer);
      const url = URL.createObjectURL(file);

      setRecordedBlob(file);
      setAudioUrl(url);
      setWaveform(waveformData);
      setDuration(Math.floor(audioBuffer.duration));
    } catch (err) {
      setError('无法解析音频文件，请确保是有效的MP3文件');
    } finally {
      setValidating(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioFile(file);
    e.target.value = '';
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setAudioUrl(null);
    setWaveform([]);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    setFileInputMode(false);
  };

  const handleUpload = async () => {
    if (!recordedBlob || duration === 0) return;

    const fileSizeMB = recordedBlob.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`音频文件大小不能超过${maxSizeMB}MB，当前${fileSizeMB.toFixed(2)}MB`);
      return;
    }

    setValidating(true);
    try {
      const file = new File([recordedBlob], `recording_${Date.now()}.mp3`, { type: 'audio/mp3' });
      const validationError = await validateMP3File(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onUpload(file, duration, waveform);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#f5f0e1]/5 to-[#f5f0e1]/10 rounded-2xl p-6 border border-[#f5f0e1]/10">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-6 mb-6">
        {!recordedBlob ? (
          <div className="flex items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-[#e94560] to-[#ff6b6b] hover:shadow-lg hover:shadow-[#e94560]/30 hover:scale-105'
              )}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-[#f5f0e1]/10 border-2 border-dashed border-[#f5f0e1]/30 flex flex-col items-center justify-center hover:bg-[#f5f0e1]/20 hover:border-[#4a7c59]/50 transition-all"
            >
              <FileAudio className="w-7 h-7 text-[#4a7c59] mb-1" />
              <span className="text-xs text-gray-400">上传MP3</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,audio/mpeg,audio/mp3"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" />
              )}
            </button>
            <button
              onClick={resetRecording}
              className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        )}

        <div className="flex-1">
          <div className="text-3xl font-mono text-white mb-2">
            {formatTime(duration)}
          </div>
          <div className="text-sm text-gray-400">
            {isRecording ? '正在录音...' : recordedBlob ? '音频已准备就绪' : '点击录制或上传MP3文件'}
          </div>
          {recordedBlob && (
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              大小: {(recordedBlob.size / 1024 / 1024).toFixed(2)}MB
            </div>
          )}
        </div>

        {recordedBlob && (
          <button
            onClick={handleUpload}
            disabled={validating || isRecording}
            className={cn(
              'px-6 py-3 bg-gradient-to-r from-[#4a7c59] to-[#2d5a3d] rounded-lg text-white font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#4a7c59]/30 transition-all',
              (validating || isRecording) ? 'opacity-50 cursor-not-allowed' : ''
            )}
          >
            {validating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                校验中...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                确认上传
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 h-16 bg-[#0f0f1a] rounded-lg p-3 overflow-hidden">
        {waveform.length === 0 ? (
          <div className="flex items-center gap-1 w-full">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-[#4a7c59]/30 rounded-full"
                style={{ height: '20%' }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 w-full h-full">
            {waveform.map((value, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-full transition-all duration-100',
                  isRecording ? 'bg-[#e94560]' : 'bg-[#4a7c59]'
                )}
                style={{
                  height: `${Math.max(10, value * 100)}%`,
                  opacity: audioUrl && currentTime > (i / waveform.length) * duration ? 0.5 : 1,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          className="hidden"
        />
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>最长录制 {Math.floor(maxDuration / 60)} 分钟</span>
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3" />
          仅限 MP3 格式，最大 {maxSizeMB}MB
        </span>
      </div>
    </div>
  );
}

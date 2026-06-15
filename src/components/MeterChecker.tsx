import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { MeterCheckResult } from '../../shared/types.js';
import { cn } from '../lib/utils';

interface MeterCheckerProps {
  result: MeterCheckResult | null;
  content: string;
}

export default function MeterChecker({ result, content }: MeterCheckerProps) {
  const lines = useMemo(() => content.split(/[\n\r]+/).filter(l => l.trim()), [content]);

  if (!result) {
    return (
      <div className="bg-gradient-to-br from-[#f5f0e1]/5 to-[#f5f0e1]/10 rounded-2xl p-6 border border-[#f5f0e1]/10">
        <div className="flex items-center gap-3 text-gray-400">
          <Info className="w-5 h-5" />
          <p>选择体裁后自动检测格律平仄</p>
        </div>
      </div>
    );
  }

  const { isValid, charResults, rhymeResults, suggestions } = result;
  const toneErrors = charResults.filter(r => !r.isCorrect).length;
  const rhymeErrors = rhymeResults.filter(r => !r.isCorrect).length;

  return (
    <div className="bg-gradient-to-br from-[#f5f0e1]/5 to-[#f5f0e1]/10 rounded-2xl p-6 border border-[#f5f0e1]/10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isValid ? (
            <CheckCircle2 className="w-6 h-6 text-[#4a7c59]" />
          ) : (
            <XCircle className="w-6 h-6 text-[#e94560]" />
          )}
          <div>
            <h3 className={cn(
              'font-bold text-lg',
              isValid ? 'text-[#4a7c59]' : 'text-[#e94560]'
            )}>
              {isValid ? '格律合规' : '格律检测结果'}
            </h3>
            <p className="text-sm text-gray-400">
              {toneErrors > 0 && `${toneErrors}处平仄不符 `}
              {rhymeErrors > 0 && `${rhymeErrors}处押韵不符`}
              {toneErrors === 0 && rhymeErrors === 0 && '完美符合格律要求'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-300">平仄标注</h4>
        <div className="space-y-3">
          {lines.map((line, lineIndex) => (
            <div key={lineIndex} className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-8 mt-1">{lineIndex + 1}</span>
              <div className="flex-1 flex flex-wrap gap-1">
                {line.split('').map((char, charIndex) => {
                  const globalPos = lines.slice(0, lineIndex).join('').length + lineIndex + charIndex;
                  const charResult = charResults[globalPos];
                  
                  if (!charResult) {
                    return (
                      <span
                        key={charIndex}
                        className="inline-flex flex-col items-center px-1 py-0.5 rounded"
                      >
                        <span className="text-white text-lg font-serif">{char}</span>
                        <span className="text-[10px] text-gray-600">-</span>
                      </span>
                    );
                  }

                  const { expectedTone, actualTone, isCorrect, suggestion } = charResult;

                  return (
                    <div
                      key={charIndex}
                      className={cn(
                        'inline-flex flex-col items-center px-1 py-0.5 rounded relative group cursor-pointer',
                        isCorrect ? 'bg-transparent' : 'bg-[#e94560]/20 animate-pulse'
                      )}
                    >
                      <span className={cn(
                        'text-lg font-serif',
                        isCorrect ? 'text-white' : 'text-[#e94560]'
                      )}>
                        {char}
                      </span>
                      <span className={cn(
                        'text-[10px] font-medium',
                        actualTone === '平' ? 'text-[#4a7c59]' : actualTone === '仄' ? 'text-[#e94560]' : 'text-gray-600'
                      )}>
                        {actualTone}
                      </span>
                      {!isCorrect && expectedTone !== '中' && (
                        <span className="text-[10px] text-gray-500">
                          应{expectedTone}
                        </span>
                      )}
                      
                      {!isCorrect && suggestion && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a2e] border border-[#e94560]/30 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          {suggestion}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {rhymeResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">押韵检测</h4>
          <div className="grid grid-cols-2 gap-3">
            {rhymeResults.map((rhyme, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  rhyme.isCorrect ? 'bg-[#4a7c59]/10 border border-[#4a7c59]/30' : 'bg-[#e94560]/10 border border-[#e94560]/30'
                )}
              >
                {rhyme.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-[#4a7c59] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#e94560] flex-shrink-0" />
                )}
                <div>
                  <div className="text-white">
                    第{rhyme.lineIndex + 1}句韵脚：
                    <span className="font-bold font-serif text-xl mx-1">{rhyme.char}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {rhyme.isCorrect
                      ? `押"${rhyme.expectedRhyme}"韵 ✓`
                      : `应押"${rhyme.expectedRhyme}"韵，实为"${rhyme.actualRhyme}"`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">修改建议</h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-[#e94560] mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-[#f5f0e1]/10 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#4a7c59]"></span>
          <span>平声</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#e94560]"></span>
          <span>仄声</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-600"></span>
          <span>未知</span>
        </div>
      </div>
    </div>
  );
}

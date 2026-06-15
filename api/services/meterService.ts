import { MeterCheckResult } from '../../shared/types.js';

const pingZeDict: Record<string, '平' | '仄'> = {
  '一': '平', '二': '仄', '三': '平', '四': '仄',
  '春': '平', '风': '平', '花': '平', '月': '仄',
  '山': '平', '水': '仄', '云': '平', '雨': '仄',
  '天': '平', '地': '仄', '人': '平', '日': '仄',
  '江': '平', '河': '平', '海': '仄', '湖': '平',
  '明': '平', '暗': '仄', '清': '平', '浊': '仄',
  '高': '平', '低': '仄', '远': '仄', '近': '仄',
  '红': '平', '白': '仄', '青': '平', '绿': '仄',
  '来': '平', '去': '仄', '归': '平', '往': '仄',
  '开': '平', '落': '仄', '起': '仄', '沉': '平',
  '心': '平', '情': '平', '意': '仄', '思': '平',
  '梦': '仄', '愁': '平', '欢': '平', '恨': '仄',
  '长': '平', '短': '仄', '深': '平', '浅': '仄',
  '多': '平', '寡': '仄', '空': '平', '满': '仄',
  '轻': '平', '重': '仄', '密': '仄', '疏': '平',
  '飞': '平', '流': '平', '飘': '平', '渡': '仄',
  '声': '平', '影': '仄', '光': '平', '色': '仄',
  '香': '平', '味': '仄', '寒': '平', '暖': '仄',
  '年': '平', '岁': '仄', '时': '平', '事': '仄',
  '家': '平', '国': '仄', '乡': '平', '客': '仄',
  '君': '平', '友': '仄', '亲': '平', '故': '仄',
  '中': '平', '外': '仄', '前': '平', '后': '仄',
  '东': '平', '西': '平', '南': '平', '北': '仄',
  '上': '仄', '下': '仄', '左': '仄', '右': '仄',
  '里': '仄', '间': '平', '边': '平', '处': '仄',
  '无': '平', '有': '仄', '是': '仄', '非': '平',
  '不': '仄', '难': '平', '易': '仄', '好': '仄',
  '如': '平', '似': '仄', '若': '仄', '像': '仄',
  '为': '平', '作': '仄', '看': '仄', '闻': '平',
  '知': '平', '道': '仄', '言': '平', '语': '仄',
  '诗': '平', '词': '平', '赋': '仄', '曲': '仄',
  '吟': '平', '咏': '仄', '唱': '仄', '和': '平',
  '书': '平', '画': '仄', '琴': '平', '棋': '平',
  '酒': '仄', '茶': '平', '墨': '仄', '砚': '仄',
  '林': '平', '竹': '仄', '松': '平', '柏': '仄',
  '梅': '平', '兰': '平', '菊': '仄', '荷': '平',
  '鸟': '仄', '莺': '平', '燕': '仄', '蝶': '仄',
  '蝉': '平', '蛙': '平', '鱼': '平', '雁': '仄',
  '楼': '平', '台': '平', '阁': '仄', '榭': '仄',
  '桥': '平', '亭': '平', '塔': '仄', '殿': '仄',
  '夜': '仄', '宵': '平', '朝': '平', '暮': '仄',
  '今': '平', '古': '仄', '昔': '仄', '早': '仄',
  '生': '平', '老': '仄', '少': '仄', '幼': '仄',
  '身': '平', '体': '仄', '形': '平', '态': '仄',
  '新': '平', '旧': '仄', '陈': '平', '腐': '仄',
  '千': '平', '万': '仄', '百': '仄', '十': '平',
  '半': '仄', '全': '平', '缺': '平', '残': '平',
  '大': '仄', '小': '仄', '微': '平', '巨': '仄',
  '闲': '平', '忙': '平', '静': '仄', '动': '仄',
  '幽': '平', '雅': '仄', '俗': '仄', '淡': '仄',
  '真': '平', '假': '仄', '善': '仄', '美': '仄',
};

const rhymeGroups: Record<string, string[]> = {
  '东': ['东', '同', '风', '中', '空', '公', '功', '红', '通', '蓬', '蒙', '聪', '丛', '翁'],
  '冬': ['冬', '钟', '龙', '容', '松', '峰', '逢', '蜂', '封', '胸', '踪', '浓', '重', '从'],
  '江': ['江', '窗', '双', '邦', '降', '庞', '撞', '腔'],
  '支': ['支', '时', '诗', '知', '之', '池', '迟', '期', '旗', '奇', '宜', '仪', '儿', '离', '施'],
  '微': ['微', '飞', '衣', '依', '机', '归', '非', '违', '威', '辉', '围', '稀', '饥'],
  '鱼': ['鱼', '书', '居', '初', '车', '渠', '疏', '蔬', '虚', '余', '如', '储', '舒', '闾'],
  '虞': ['虞', '无', '珠', '朱', '殊', '儒', '姝', '株', '夫', '扶', '芙', '符', '图', '徒'],
  '齐': ['齐', '西', '溪', '低', '题', '啼', '提', '蹄', '梯', '鸡', '迷', '泥', '犁', '黎', '妻'],
  '佳': ['佳', '街', '鞋', '怀', '淮', '柴', '皆', '谐', '偕', '阶', '排', '埋', '霾'],
  '灰': ['灰', '开', '来', '梅', '杯', '才', '财', '哀', '埃', '台', '苔', '猜', '裁', '哉'],
  '真': ['真', '人', '身', '尘', '春', '新', '因', '辛', '邻', '亲', '津', '珍', '陈', '晨', '臣'],
  '文': ['文', '云', '群', '君', '闻', '门', '纷', '芬', '氛', '纹', '蚊', '匀', '坟', '勋'],
  '元': ['元', '言', '原', '源', '园', '猿', '远', '番', '翻', '烦', '繁', '藩', '辕', '垣'],
  '寒': ['寒', '安', '难', '官', '观', '冠', '宽', '团', '酸', '端', '欢', '漫', '澜'],
  '删': ['删', '关', '山', '间', '闲', '环', '攀', '斑', '艰', '奸', '颜', '还', '湾'],
  '先': ['先', '天', '年', '前', '千', '烟', '莲', '怜', '联', '然', '传', '边', '仙', '鲜', '肩'],
  '萧': ['萧', '苗', '腰', '飘', '朝', '潮', '摇', '桥', '条', '调', '娇', '宵', '消', '樵'],
  '肴': ['肴', '交', '郊', '梢', '巢', '抛', '包', '胞', '苞', '咆', '庖', '哮', '敲'],
  '豪': ['豪', '高', '毛', '号', '劳', '牢', '桃', '陶', '曹', '遭', '槽', '骚', '糕', '篙'],
  '歌': ['歌', '河', '多', '何', '过', '磨', '波', '坡', '呵', '轲', '峨', '娥', '鹅', '蛾'],
  '麻': ['麻', '花', '霞', '家', '茶', '华', '沙', '牙', '芽', '蛇', '差', '夸', '巴', '疤', '葭'],
  '阳': ['阳', '光', '香', '长', '望', '忘', '忙', '芳', '房', '黄', '王', '堂', '旁', '藏', '装'],
  '庚': ['庚', '明', '清', '声', '成', '城', '情', '晴', '精', '京', '惊', '生', '英', '平'],
  '青': ['青', '经', '形', '庭', '亭', '丁', '星', '宁', '零', '灵', '冥', '铭', '屏', '龄', '刑'],
  '蒸': ['蒸', '升', '兴', '胜', '承', '乘', '陵', '凌', '冰', '鹰', '曾', '层', '凭', '绳', '仍'],
  '尤': ['尤', '流', '秋', '楼', '忧', '幽', '休', '丘', '州', '洲', '柔', '愁', '筹', '畴', '酬'],
  '侵': ['侵', '心', '林', '深', '寻', '吟', '今', '琴', '金', '音', '阴', '霖', '簪', '斟', '沉'],
  '覃': ['覃', '潭', '南', '谈', '甘', '蓝', '岚', '蚕', '堪', '探', '涵', '函', '缄', '衔', '岩'],
  '咸': ['咸', '帆', '衫', '岩', '严', '凡', '函', '衔', '谗', '缄', '芟', '监', '喃'],
};

const genrePatterns: Record<string, { lines: number; charsPerLine: number; pattern: string[] }> = {
  '五言绝句': {
    lines: 4,
    charsPerLine: 5,
    pattern: ['仄仄平平仄', '平平仄仄平', '平平平仄仄', '仄仄仄平平'],
  },
  '七言绝句': {
    lines: 4,
    charsPerLine: 7,
    pattern: ['平平仄仄仄平平', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平'],
  },
  '五言律诗': {
    lines: 8,
    charsPerLine: 5,
    pattern: ['仄仄平平仄', '平平仄仄平', '平平平仄仄', '仄仄仄平平', '仄仄平平仄', '平平仄仄平', '平平平仄仄', '仄仄仄平平'],
  },
  '七言律诗': {
    lines: 8,
    charsPerLine: 7,
    pattern: ['平平仄仄仄平平', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平', '平平仄仄平平仄', '仄仄平平仄仄平', '仄仄平平平仄仄', '平平仄仄仄平平'],
  },
};

function getTone(char: string): '平' | '仄' | '未知' {
  return pingZeDict[char] || '未知';
}

function getRhymeGroup(char: string): string {
  for (const [group, chars] of Object.entries(rhymeGroups)) {
    if (chars.includes(char)) {
      return group;
    }
  }
  return char;
}

export function checkMeter(content: string, genre: string): MeterCheckResult {
  const lines = content.split(/[\n\r]+/).filter(l => l.trim());
  const pattern = genrePatterns[genre];
  
  const charResults: MeterCheckResult['charResults'] = [];
  const rhymeResults: MeterCheckResult['rhymeResults'] = [];
  const suggestions: string[] = [];
  
  let isValid = true;

  if (!pattern) {
    return {
      isValid: true,
      charResults: [],
      rhymeResults: [],
      suggestions: ['该体裁无严格格律要求，自由创作即可'],
    };
  }

  if (lines.length !== pattern.lines) {
    isValid = false;
    suggestions.push(`该体裁要求${pattern.lines}句，当前${lines.length}句`);
  }

  let position = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    const expectedPattern = pattern.pattern[lineIndex] || '';
    
    if (line.length !== pattern.charsPerLine) {
      isValid = false;
      suggestions.push(`第${lineIndex + 1}句应${pattern.charsPerLine}字，当前${line.length}字`);
    }

    for (let charIndex = 0; charIndex < Math.max(line.length, expectedPattern.length); charIndex++) {
      const char = line[charIndex] || '';
      const expectedTone = expectedPattern[charIndex] as '平' | '仄' | '中' || '中';
      const actualTone = getTone(char);
      const isCorrect = expectedTone === '中' || actualTone === expectedTone || actualTone === '未知';
      
      if (!isCorrect) isValid = false;
      
      charResults.push({
        char,
        position: position + charIndex,
        expectedTone,
        actualTone,
        isCorrect,
        suggestion: !isCorrect ? `建议使用${expectedTone}声字` : undefined,
      });
    }
    
    position += line.length + 1;
  }

  const rhymePositions = [1, 3];
  let expectedRhyme = '';
  
  for (const lineIndex of rhymePositions) {
    if (lines[lineIndex]) {
      const lastChar = lines[lineIndex].trim().slice(-1);
      const rhymeGroup = getRhymeGroup(lastChar);
      
      if (!expectedRhyme) {
        expectedRhyme = rhymeGroup;
      }
      
      const isCorrect = rhymeGroup === expectedRhyme || rhymeGroup === lastChar;
      if (!isCorrect) isValid = false;
      
      rhymeResults.push({
        lineIndex,
        char: lastChar,
        expectedRhyme,
        actualRhyme: rhymeGroup,
        isCorrect,
        suggestion: !isCorrect ? `建议押"${expectedRhyme}"韵` : undefined,
      });
    }
  }

  if (charResults.filter(r => !r.isCorrect).length > 0) {
    suggestions.push(`共有${charResults.filter(r => !r.isCorrect).length}处平仄需要调整`);
  }
  
  if (rhymeResults.filter(r => !r.isCorrect).length > 0) {
    suggestions.push(`押韵需要调整`);
  }

  return {
    isValid,
    charResults,
    rhymeResults,
    suggestions,
  };
}

export function getGenrePattern(genre: string): { lines: number; charsPerLine: number; pattern: string[] } | null {
  return genrePatterns[genre] || null;
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Heart,
  Activity,
  Thermometer,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  Download,
  RotateCcw,
  Info,
  ChevronRight,
  Clock,
  Sliders,
} from 'lucide-react';

// ============================================================================
// 定数・マスターデータ定義
// ============================================================================
const STORAGE_KEY = 'rhythm_note_records_v3';

const STAGES = {
  menstrual: {
    id: 'menstrual',
    name: '生理期',
    shortName: '生理期',
    tempPhase: '低温期（移行）',
    color: '#F48FB1',
    bgHex: '#FCE4EC',
    borderHex: '#F8BBD0',
    textHex: '#AD1457',
    badgeBg: 'bg-[#FCE4EC]',
    badgeText: 'text-[#AD1457]',
    summary: '出血とともに体温が下がり、体を休めるデトックスの時期',
    mechanism:
      'プロゲステロンとエストロゲンの両方が低下し、基礎体温も低温期へと下がります。血流低下や貧血の影響で、腹痛・だるさ・眠気が出やすい自然な時期です。',
    advice: '温かくして無理をせず、鉄分や温かい飲み物を意識してゆっくり過ごしましょう。',
  },
  follicular: {
    id: 'follicular',
    name: '卵胞期',
    shortName: '卵胞期',
    tempPhase: '低温期（安定）',
    color: '#4DB6AC',
    bgHex: '#E0F2F1',
    borderHex: '#B2DFDB',
    textHex: '#00695C',
    badgeBg: 'bg-[#E0F2F1]',
    badgeText: 'text-[#00695C]',
    summary: '心身ともに安定しやすく、前向きに動けるキラキラ期',
    mechanism:
      '卵胞ホルモン（エストロゲン）の分泌が増え、自律神経やメンタルが整いやすい時期です。基礎体温は低めで安定し、集中力や肌の調子も上がりやすくなります。',
    advice: '新しい予定や運動、やりたかったことにチャレンジするのにぴったりのタイミングです。',
  },
  ovulation: {
    id: 'ovulation',
    name: '排卵期',
    shortName: '排卵期',
    tempPhase: '低温→高温へ移行',
    color: '#FFB74D',
    bgHex: '#FFF8E1',
    borderHex: '#FFE082',
    textHex: '#E65100',
    badgeBg: 'bg-[#FFF8E1]',
    badgeText: 'text-[#E65100]',
    summary: 'ホルモンが急激に切り替わり、体温が上昇し始める転換期',
    mechanism:
      'エストロゲンがピークを迎えたあと急減し、排卵を境に黄体ホルモンが増え始めます。体温がガクッと下がってから高温期へ上がるため、軽い腹痛や眠気を感じることがあります。',
    advice: '体の切り替えサインが出やすい数日間です。水分補給と早めの休息を心がけましょう。',
  },
  luteal: {
    id: 'luteal',
    name: '黄体期',
    shortName: '黄体期',
    tempPhase: '高温期',
    color: '#9575CD',
    bgHex: '#F3E5F5',
    borderHex: '#D1C4E9',
    textHex: '#4A148C',
    badgeBg: 'bg-[#F3E5F5]',
    badgeText: 'text-[#4A148C]',
    summary: '高温期が続き、PMS（イライラ・眠気・むくみ）が出やすい時期',
    mechanism:
      '黄体ホルモン（プロゲステロン）が多く分泌され、基礎体温が約0.3〜0.5℃高い「高温期」になります。水分を溜め込みやすく、理由のないイライラ・気分の落ち込み・強い眠気・食欲増進などが起きやすいメカニズムです。',
    advice: '気分の波は性格ではなくホルモンの自然な働きです。「今は高温期だから仕方ない」と自分を労わりましょう。',
  },
};

const MOOD_OPTIONS = [
  { value: 1, emoji: '😣', label: 'つらい・イライラ' },
  { value: 2, emoji: '😔', label: '少し低め・もやもや' },
  { value: 3, emoji: '😌', label: 'ふつう・おだやか' },
  { value: 4, emoji: '🙂', label: '良い感じ・前向き' },
  { value: 5, emoji: '🥰', label: 'とても快適・ハッピー' },
];

const ENERGY_OPTIONS = [
  { value: 1, label: '1：ぐったり' },
  { value: 2, label: '2：やや疲れ気味' },
  { value: 3, label: '3：ふつう' },
  { value: 4, label: '4：元気' },
  { value: 5, label: '5：エネルギー満タン' },
];

const CONDITION_TAGS = [
  'イライラ気味',
  '気分の落ち込み',
  '強い眠気',
  '腹痛・下腹部痛',
  '頭痛・重だるさ',
  'むくみ',
  '食欲増加・甘いもの欲',
  '肌荒れ',
  '仕事・家事疲れ',
  '睡眠不足感',
  '快調・スッキリ',
];

const SELF_CARE_TAGS = [
  '湯船に浸かった',
  '早めに就寝した',
  'ストレッチ・ヨガ',
  'ウォーキング・運動',
  'カフェイン控えめ',
  '温かい飲み物',
  '好きな音楽・趣味',
  '鉄分・栄養意識',
];

// ============================================================================
// ユーティリティ関数
// ============================================================================
function formatDateStr(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayStr() {
  return formatDateStr(new Date());
}

function diffDays(dateStrA, dateStrB) {
  const a = new Date(`${dateStrA}T00:00:00`);
  const b = new Date(`${dateStrB}T00:00:00`);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function formatShortDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

// ============================================================================
// 初期サンプルデータ生成（35日分・2周期分）
// ============================================================================
function createInitialSampleRecords() {
  const today = new Date();
  const rawPattern = [
    // 前周期（34日前〜7日前：28日周期）
    { offset: -34, temp: 36.32, mood: 2, energy: 2, sleep: 7.5, periodStart: true, cond: ['腹痛・下腹部痛', '強い眠気'], care: ['湯船に浸かった', '温かい飲み物'], memo: '生理1日目。無理せず早めに休んだ。' },
    { offset: -33, temp: 36.25, mood: 2, energy: 2, sleep: 8.0, periodStart: false, cond: ['腹痛・下腹部痛', '頭痛・重だるさ'], care: ['早めに就寝した', '鉄分・栄養意識'], memo: '2日目で少し重だるい。' },
    { offset: -32, temp: 36.22, mood: 3, energy: 3, sleep: 7.0, periodStart: false, cond: ['強い眠気'], care: ['温かい飲み物'], memo: '少しずつ落ち着いてきた。' },
    { offset: -31, temp: 36.28, mood: 3, energy: 3, sleep: 7.0, periodStart: false, cond: [], care: ['ストレッチ・ヨガ'], memo: '' },
    { offset: -30, temp: 36.24, mood: 4, energy: 4, sleep: 7.5, periodStart: false, cond: ['快調・スッキリ'], care: ['ウォーキング・運動'], memo: '生理終わりかけでスッキリ！' },
    { offset: -29, temp: 36.20, mood: 4, energy: 4, sleep: 7.0, periodStart: false, cond: ['快調・スッキリ'], care: ['ストレッチ・ヨガ', '好きな音楽・趣味'], memo: '' },
    { offset: -28, temp: 36.18, mood: 5, energy: 5, sleep: 7.5, periodStart: false, cond: ['快調・スッキリ'], care: ['ウォーキング・運動', '湯船に浸かった'], memo: '朝から頭が冴えて仕事が捗った。' },
    { offset: -27, temp: 36.21, mood: 4, energy: 4, sleep: 7.0, periodStart: false, cond: ['快調・スッキリ'], care: ['好きな音楽・趣味'], memo: '' },
    { offset: -26, temp: 36.19, mood: 2, energy: 2, sleep: 5.0, periodStart: false, cond: ['イライラ気味', '仕事・家事疲れ', '睡眠不足感'], care: [], memo: '卵胞期なのに寝不足と残業でイライラしてしまった。' },
    { offset: -25, temp: 36.23, mood: 4, energy: 4, sleep: 8.0, periodStart: false, cond: ['快調・スッキリ'], care: ['早めに就寝した', '湯船に浸かった'], memo: 'しっかり寝たらすぐ回復！' },
    { offset: -24, temp: 36.17, mood: 5, energy: 5, sleep: 7.5, periodStart: false, cond: ['快調・スッキリ'], care: ['ウォーキング・運動'], memo: '' },
    { offset: -23, temp: 36.15, mood: 4, energy: 4, sleep: 7.0, periodStart: false, cond: [], care: ['ストレッチ・ヨガ'], memo: '' },
    { offset: -22, temp: 36.08, mood: 3, energy: 3, sleep: 6.5, periodStart: false, cond: ['強い眠気'], care: ['温かい飲み物'], memo: '体温がガクッと下がった日。' },
    { offset: -21, temp: 36.38, mood: 4, energy: 3, sleep: 7.0, periodStart: false, cond: [], care: ['湯船に浸かった'], memo: '体温が上がり始めた。' },
    { offset: -20, temp: 36.56, mood: 4, energy: 4, sleep: 7.5, periodStart: false, cond: ['快調・スッキリ'], care: ['ストレッチ・ヨガ'], memo: '高温期入り。' },
    { offset: -19, temp: 36.64, mood: 4, energy: 3, sleep: 7.0, periodStart: false, cond: [], care: ['カフェイン控えめ'], memo: '' },
    { offset: -18, temp: 36.68, mood: 3, energy: 3, sleep: 7.0, periodStart: false, cond: ['むくみ'], care: ['湯船に浸かった'], memo: '' },
    { offset: -17, temp: 36.71, mood: 3, energy: 3, sleep: 6.5, periodStart: false, cond: ['強い眠気'], care: ['早めに就寝した'], memo: '' },
    { offset: -16, temp: 36.66, mood: 3, energy: 3, sleep: 7.0, periodStart: false, cond: [], care: ['好きな音楽・趣味'], memo: '' },
    { offset: -15, temp: 36.73, mood: 3, energy: 2, sleep: 6.5, periodStart: false, cond: ['むくみ', '食欲増加・甘いもの欲'], care: ['カフェイン控えめ'], memo: 'チョコが食べたくなる時期。' },
    { offset: -14, temp: 36.75, mood: 2, energy: 2, sleep: 6.5, periodStart: false, cond: ['イライラ気味', '強い眠気'], care: ['湯船に浸かった'], memo: '生理5日前くらいから少しソワソワ。' },
    { offset: -13, temp: 36.70, mood: 2, energy: 2, sleep: 6.0, periodStart: false, cond: ['イライラ気味', 'むくみ'], care: ['ストレッチ・ヨガ'], memo: '高温期後半でちょっとしたことでイラッとする。' },
    { offset: -12, temp: 36.74, mood: 1, energy: 2, sleep: 6.0, periodStart: false, cond: ['イライラ気味', '気分の落ち込み', '肌荒れ'], care: ['早めに就寝した'], memo: 'PMSピーク。ホルモンのせいと割り切って早めに寝る。' },
    { offset: -11, temp: 36.69, mood: 2, energy: 2, sleep: 7.5, periodStart: false, cond: ['気分の落ち込み', '強い眠気'], care: ['温かい飲み物', '好きな音楽・趣味'], memo: '' },
    { offset: -10, temp: 36.62, mood: 2, energy: 2, sleep: 7.0, periodStart: false, cond: ['頭痛・重だるさ', 'むくみ'], care: ['湯船に浸かった'], memo: '' },
    { offset: -9, temp: 36.45, mood: 3, energy: 3, sleep: 7.5, periodStart: false, cond: [], care: ['早めに就寝した'], memo: '体温が下がり始めた。もうすぐ生理かも。' },
    // 今周期（8日前〜今日）
    { offset: -8, temp: 36.29, mood: 2, energy: 2, sleep: 7.5, periodStart: true, cond: ['腹痛・下腹部痛', '強い眠気'], care: ['湯船に浸かった', '温かい飲み物'], memo: '今周期の生理スタート！予測通り。' },
    { offset: -7, temp: 36.24, mood: 2, energy: 2, sleep: 8.0, periodStart: false, cond: ['腹痛・下腹部痛'], care: ['早めに就寝した', '鉄分・栄養意識'], memo: '' },
    { offset: -6, temp: 36.21, mood: 3, energy: 3, sleep: 7.0, periodStart: false, cond: [], care: ['温かい飲み物'], memo: '' },
    { offset: -5, temp: 36.25, mood: 4, energy: 4, sleep: 7.5, periodStart: false, cond: ['快調・スッキリ'], care: ['ストレッチ・ヨガ'], memo: '' },
    { offset: -4, temp: 36.19, mood: 4, energy: 4, sleep: 7.0, periodStart: false, cond: ['快調・スッキリ'], care: ['ウォーキング・運動'], memo: '卵胞期に入って調子が良い！' },
    { offset: -3, temp: 36.16, mood: 5, energy: 5, sleep: 7.5, periodStart: false, cond: ['快調・スッキリ'], care: ['湯船に浸かった', '好きな音楽・趣味'], memo: '' },
    { offset: -2, temp: 36.20, mood: 2, energy: 3, sleep: 5.5, periodStart: false, cond: ['イライラ気味', '睡眠不足感'], care: [], memo: '夜ふかしして睡眠5.5時間。卵胞期なのにイライラ気味。' },
    { offset: -1, temp: 36.18, mood: 4, energy: 4, sleep: 7.5, periodStart: false, cond: ['快調・スッキリ'], care: ['早めに就寝した', 'ストレッチ・ヨガ'], memo: '7.5時間寝たら気分もすっきり回復！' },
    { offset: 0, temp: 36.22, mood: 4, energy: 4, sleep: 7.0, periodStart: false, cond: ['快調・スッキリ'], care: ['温かい飲み物'], memo: '' },
  ];

  return rawPattern.map((item) => {
    const d = new Date(today);
    d.setDate(today.getDate() + item.offset);
    const dateStr = formatDateStr(d);
    const isToday = item.offset === 0;
    return {
      id: dateStr,
      date: dateStr,
      temperature: item.temp,
      mood: isToday ? null : item.mood,
      energy: isToday ? null : item.energy,
      sleep: item.sleep,
      morningSaved: true,
      eveningSaved: !isToday,
      isPeriodStart: item.periodStart,
      manualStageOverride: false,
      stage: 'follicular',
      conditionTags: isToday ? [] : item.cond,
      selfCareTags: isToday ? [] : item.care,
      memo: isToday ? '' : item.memo,
    };
  });
}

// ============================================================================
// 自動フェーズ・周期分析エンジン
// ============================================================================
function analyzeRecords(records) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // 1. 生理開始日の抽出 & 平均周期計算
  const periodStarts = sorted.filter((r) => r.isPeriodStart).map((r) => r.date);
  const cycleLengths = [];
  for (let i = 1; i < periodStarts.length; i++) {
    const len = diffDays(periodStarts[i - 1], periodStarts[i]);
    if (len >= 18 && len <= 45) {
      cycleLengths.push(len);
    }
  }
  const avgCycleLength =
    cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((acc, v) => acc + v, 0) / cycleLengths.length)
      : 28;

  // 2. 低温期の基準体温を算出（生理開始〜10日目の体温中央値/平均）
  const lowPhaseTemps = [];
  sorted.forEach((r) => {
    if (typeof r.temperature !== 'number') return;
    const prevStarts = periodStarts.filter((ps) => ps <= r.date);
    if (prevStarts.length > 0) {
      const lastStart = prevStarts[prevStarts.length - 1];
      const dayInCycle = diffDays(lastStart, r.date) + 1;
      if (dayInCycle >= 1 && dayInCycle <= 10) {
        lowPhaseTemps.push(r.temperature);
      }
    }
  });
  const baseLowTemp =
    lowPhaseTemps.length > 0
      ? lowPhaseTemps.reduce((a, b) => a + b, 0) / lowPhaseTemps.length
      : 36.25;
  const highTempThreshold = Number((baseLowTemp + 0.25).toFixed(2));

  // 3. 各レコードに自動判定フェーズ・周期日数・ギャップ分析を付与
  const enriched = sorted.map((r, idx) => {
    const prevStarts = periodStarts.filter((ps) => ps <= r.date);
    const nextStarts = periodStarts.filter((ps) => ps > r.date);

    let cycleDay = null;
    if (prevStarts.length > 0) {
      cycleDay = diffDays(prevStarts[prevStarts.length - 1], r.date) + 1;
    }

    let daysUntilNextPeriod = null;
    if (nextStarts.length > 0) {
      daysUntilNextPeriod = diffDays(r.date, nextStarts[0]);
    } else if (cycleDay !== null) {
      daysUntilNextPeriod = Math.max(0, avgCycleLength - cycleDay + 1);
    }

    // 自動判定ロジック
    const estimatedOvulationDay = Math.max(10, avgCycleLength - 14);
    let autoStage = 'follicular';

    if (r.isPeriodStart || (cycleDay !== null && cycleDay >= 1 && cycleDay <= 5)) {
      autoStage = 'menstrual';
    } else if (cycleDay !== null) {
      // 直近2〜3日で高温相に入っているかも加味
      const recentTemps = [
        sorted[idx - 1]?.temperature,
        r.temperature,
      ].filter((t) => typeof t === 'number');
      const isHighTempNow =
        typeof r.temperature === 'number' &&
        r.temperature >= highTempThreshold &&
        recentTemps.filter((t) => t >= highTempThreshold).length >= 1;

      if (Math.abs(cycleDay - estimatedOvulationDay) <= 1) {
        autoStage = 'ovulation';
      } else if (cycleDay > estimatedOvulationDay + 1 || (cycleDay >= 12 && isHighTempNow)) {
        autoStage = 'luteal';
      } else {
        autoStage = 'follicular';
      }
    } else if (typeof r.temperature === 'number') {
      autoStage = r.temperature >= highTempThreshold ? 'luteal' : 'follicular';
    }

    const effectiveStage = r.manualStageOverride && r.stage ? r.stage : autoStage;

    // ギャップ検出（本来安定しやすい卵胞期なのに、気分が低い or イライラ・疲れがある）
    const hasLowMoodOrIrritation =
      (typeof r.mood === 'number' && r.mood <= 2) ||
      (r.conditionTags || []).some((t) =>
        ['イライラ気味', '気分の落ち込み', '仕事・家事疲れ', '睡眠不足感'].includes(t)
      );

    const isGapDay = effectiveStage === 'follicular' && hasLowMoodOrIrritation;

    return {
      ...r,
      cycleDay,
      daysUntilNextPeriod,
      autoStage,
      effectiveStage,
      isGapDay,
    };
  });

  // 4. 傾向分析（マイパターン）の集計
  // ① 生理何日前からイライラ・落ち込みが始まりやすいか（カウントダウン別）
  const countdownMap = {};
  for (let d = 10; d >= 1; d--) {
    countdownMap[d] = { daysBefore: d, moods: [], negativeCount: 0, totalCount: 0 };
  }
  enriched.forEach((r) => {
    if (
      r.daysUntilNextPeriod !== null &&
      r.daysUntilNextPeriod >= 1 &&
      r.daysUntilNextPeriod <= 10 &&
      typeof r.mood === 'number'
    ) {
      const bucket = countdownMap[r.daysUntilNextPeriod];
      bucket.moods.push(r.mood);
      bucket.totalCount += 1;
      const isNeg =
        r.mood <= 2 ||
        (r.conditionTags || []).some((t) => ['イライラ気味', '気分の落ち込み'].includes(t));
      if (isNeg) bucket.negativeCount += 1;
    }
  });

  const countdownStats = Object.values(countdownMap)
    .sort((a, b) => b.daysBefore - a.daysBefore)
    .map((item) => ({
      daysBefore: item.daysBefore,
      avgMood:
        item.moods.length > 0
          ? Number((item.moods.reduce((a, b) => a + b, 0) / item.moods.length).toFixed(2))
          : null,
      negativeRate:
        item.totalCount > 0 ? Math.round((item.negativeCount / item.totalCount) * 100) : 0,
      count: item.totalCount,
    }));

  // 不調が始まりやすい目安日（10日前から順に見て、平均気分3.0未満または不調率50%以上が最初に出る日）
  const pmsStartCandidate = countdownStats.find(
    (s) => s.count > 0 && ((s.avgMood !== null && s.avgMood <= 2.8) || s.negativeRate >= 50)
  );

  // ② 睡眠時間と気分の相関 & ギャップ日の要因分析
  const sleepBuckets = [
    { label: '6時間未満', min: 0, max: 5.9, moods: [] },
    { label: '6.0〜7.0時間', min: 6.0, max: 7.0, moods: [] },
    { label: '7.5時間以上', min: 7.5, max: 24, moods: [] },
  ];
  enriched.forEach((r) => {
    if (typeof r.sleep === 'number' && typeof r.mood === 'number') {
      const b = sleepBuckets.find((sb) => r.sleep >= sb.min && r.sleep <= sb.max);
      if (b) b.moods.push(r.mood);
    }
  });
  const sleepStats = sleepBuckets.map((b) => ({
    label: b.label,
    avgMood:
      b.moods.length > 0
        ? Number((b.moods.reduce((acc, v) => acc + v, 0) / b.moods.length).toFixed(2))
        : null,
    count: b.moods.length,
  }));

  const gapDays = enriched.filter((r) => r.isGapDay);
  const gapFactorCounts = {};
  gapDays.forEach((r) => {
    if (typeof r.sleep === 'number' && r.sleep < 6.5) {
      gapFactorCounts['睡眠6.5時間未満'] = (gapFactorCounts['睡眠6.5時間未満'] || 0) + 1;
    }
    (r.conditionTags || []).forEach((tag) => {
      if (tag !== '快調・スッキリ') {
        gapFactorCounts[tag] = (gapFactorCounts[tag] || 0) + 1;
      }
    });
  });
  const topGapFactors = Object.entries(gapFactorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // ③ フェーズ別の平均気分・平均体温
  const stageStats = Object.keys(STAGES).map((stageKey) => {
    const items = enriched.filter((r) => r.effectiveStage === stageKey);
    const moodItems = items.filter((r) => typeof r.mood === 'number');
    const tempItems = items.filter((r) => typeof r.temperature === 'number');
    return {
      ...STAGES[stageKey],
      count: items.length,
      avgMood:
        moodItems.length > 0
          ? Number(
              (moodItems.reduce((acc, v) => acc + v.mood, 0) / moodItems.length).toFixed(2)
            )
          : null,
      avgTemp:
        tempItems.length > 0
          ? Number(
              (
                tempItems.reduce((acc, v) => acc + v.temperature, 0) / tempItems.length
              ).toFixed(2)
            )
          : null,
    };
  });

  const follicularAvgTemp = stageStats.find((s) => s.id === 'follicular')?.avgTemp;
  const lutealAvgTemp = stageStats.find((s) => s.id === 'luteal')?.avgTemp;
  const tempDiff =
    follicularAvgTemp && lutealAvgTemp
      ? Number((lutealAvgTemp - follicularAvgTemp).toFixed(2))
      : null;

  // ④ 気分が良い日（4以上）に実践しているセルフケアランキング
  const careCounts = {};
  enriched.forEach((r) => {
    if (typeof r.mood === 'number' && r.mood >= 4) {
      (r.selfCareTags || []).forEach((c) => {
        careCounts[c] = (careCounts[c] || 0) + 1;
      });
    }
  });
  const topSelfCares = Object.entries(careCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return {
    enriched,
    avgCycleLength,
    baseLowTemp: Number(baseLowTemp.toFixed(2)),
    highTempThreshold,
    countdownStats,
    pmsStartCandidate,
    sleepStats,
    gapDays,
    topGapFactors,
    stageStats,
    tempDiff,
    topSelfCares,
  };
}

// ============================================================================
// カスタムSVG複合バイオリズムグラフコンポーネント
// ============================================================================
function BiorythmBarometerChart({
  data,
  showTemp,
  showMood,
  showSleep,
  showEnergy,
  selectedDate,
  onSelectDate,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-purple-400 bg-purple-50/40 rounded-2xl border border-purple-100">
        表示するデータがありません。まずは今日の記録を追加してみましょう！
      </div>
    );
  }

  const width = Math.max(640, data.length * 42);
  const height = 270;
  const padLeft = 48;
  const padRight = 44;
  const padTop = 24;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // 体温軸（左軸）の範囲自動調整
  const validTemps = data.map((d) => d.temperature).filter((t) => typeof t === 'number');
  const minTemp =
    validTemps.length > 0
      ? Math.min(35.9, Math.floor((Math.min(...validTemps) - 0.1) * 10) / 10)
      : 35.9;
  const maxTemp =
    validTemps.length > 0
      ? Math.max(37.0, Math.ceil((Math.max(...validTemps) + 0.1) * 10) / 10)
      : 37.0;

  const getX = (index) => {
    if (data.length === 1) return padLeft + plotW / 2;
    return padLeft + (index / (data.length - 1)) * plotW;
  };

  const getTempY = (temp) => {
    const ratio = (temp - minTemp) / (maxTemp - minTemp || 1);
    return padTop + plotH - ratio * plotH;
  };

  // 右軸（気分 1〜5 / 元気度 1〜5 / 睡眠 2〜10h を 0〜1 に正規化）
  const getScoreY = (val, minV = 1, maxV = 5) => {
    const clamped = Math.max(minV, Math.min(maxV, val));
    const ratio = (clamped - minV) / (maxV - minV);
    return padTop + plotH - ratio * plotH;
  };

  const buildPolyline = (getter) => {
    const pts = [];
    data.forEach((d, i) => {
      const y = getter(d);
      if (y !== null && !isNaN(y)) {
        pts.push(`${getX(i).toFixed(1)},${y.toFixed(1)}`);
      }
    });
    return pts.join(' ');
  };

  const tempPoints = buildPolyline((d) =>
    typeof d.temperature === 'number' ? getTempY(d.temperature) : null
  );
  const moodPoints = buildPolyline((d) =>
    typeof d.mood === 'number' ? getScoreY(d.mood, 1, 5) : null
  );
  const energyPoints = buildPolyline((d) =>
    typeof d.energy === 'number' ? getScoreY(d.energy, 1, 5) : null
  );
  const sleepPoints = buildPolyline((d) =>
    typeof d.sleep === 'number' ? getScoreY(d.sleep, 3, 10) : null
  );

  const stepW = data.length > 1 ? plotW / (data.length - 1) : plotW;

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div style={{ minWidth: `${Math.min(width, 960)}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          {/* 背景：体のリズム（4フェーズ）の帯 */}
          {data.map((d, i) => {
            const stageObj = STAGES[d.effectiveStage] || STAGES.follicular;
            const cx = getX(i);
            const bandX = i === 0 ? padLeft : cx - stepW / 2;
            const bandW =
              data.length === 1
                ? plotW
                : i === 0 || i === data.length - 1
                ? stepW / 2
                : stepW;
            const isSelected = d.date === selectedDate;
            return (
              <g key={d.date}>
                <rect
                  x={bandX}
                  y={padTop}
                  width={bandW}
                  height={plotH}
                  fill={stageObj.bgHex}
                  opacity={isSelected ? 0.95 : 0.65}
                />
                {isSelected && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + plotH}
                    stroke="#7E57C2"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}
              </g>
            );
          })}

          {/* 横グリッド線 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padTop + plotH - ratio * plotH;
            const tempLabel = (minTemp + ratio * (maxTemp - minTemp)).toFixed(2);
            const scoreLabel = (1 + ratio * 4).toFixed(0);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="#E9D5FF"
                  strokeWidth="1"
                  strokeDasharray={idx === 0 ? undefined : '3 3'}
                />
                {/* 左軸：体温 */}
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#AD1457"
                  fontWeight="600"
                >
                  {tempLabel}°
                </text>
                {/* 右軸：気分・元気スコア */}
                <text
                  x={padLeft + plotW + 6}
                  y={y + 3}
                  textAnchor="start"
                  fontSize="10"
                  fill="#5E35B1"
                  fontWeight="600"
                >
                  {scoreLabel}
                </text>
              </g>
            );
          })}

          {/* 睡眠時間ライン */}
          {showSleep && sleepPoints && (
            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray="5 3"
              points={sleepPoints}
            />
          )}

          {/* 元気度ライン */}
          {showEnergy && energyPoints && (
            <polyline
              fill="none"
              stroke="#26A69A"
              strokeWidth="2"
              points={energyPoints}
            />
          )}

          {/* 気分スコアライン */}
          {showMood && moodPoints && (
            <polyline
              fill="none"
              stroke="#7E57C2"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={moodPoints}
            />
          )}

          {/* 基礎体温ライン */}
          {showTemp && tempPoints && (
            <polyline
              fill="none"
              stroke="#EC407A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={tempPoints}
            />
          )}

          {/* データポイント＆クリック領域 */}
          {data.map((d, i) => {
            const cx = getX(i);
            const isSelected = d.date === selectedDate;
            return (
              <g
                key={d.date}
                onClick={() => onSelectDate(d.date)}
                className="cursor-pointer group"
              >
                {/* 透明なタップ拡大領域 */}
                <rect
                  x={cx - stepW / 2}
                  y={padTop}
                  width={stepW}
                  height={plotH + padBottom}
                  fill="transparent"
                />

                {/* 生理開始日の印 */}
                {d.isPeriodStart && (
                  <g transform={`translate(${cx}, ${padTop - 10})`}>
                    <circle r="7" fill="#EC407A" />
                    <text
                      textAnchor="middle"
                      y="3"
                      fontSize="8"
                      fill="#FFFFFF"
                      fontWeight="bold"
                    >
                      生
                    </text>
                  </g>
                )}

                {/* ギャップ日の注意マーカー */}
                {d.isGapDay && !d.isPeriodStart && (
                  <g transform={`translate(${cx}, ${padTop - 10})`}>
                    <circle r="7" fill="#F59E0B" />
                    <text
                      textAnchor="middle"
                      y="3"
                      fontSize="9"
                      fill="#FFFFFF"
                      fontWeight="bold"
                    >
                      !
                    </text>
                  </g>
                )}

                {/* 睡眠点 */}
                {showSleep && typeof d.sleep === 'number' && (
                  <circle
                    cx={cx}
                    cy={getScoreY(d.sleep, 3, 10)}
                    r={isSelected ? 4.5 : 3}
                    fill="#38BDF8"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />
                )}

                {/* 元気度点 */}
                {showEnergy && typeof d.energy === 'number' && (
                  <circle
                    cx={cx}
                    cy={getScoreY(d.energy, 1, 5)}
                    r={isSelected ? 4.5 : 3}
                    fill="#26A69A"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />
                )}

                {/* 気分点 */}
                {showMood && typeof d.mood === 'number' && (
                  <circle
                    cx={cx}
                    cy={getScoreY(d.mood, 1, 5)}
                    r={isSelected ? 5.5 : 3.8}
                    fill="#7E57C2"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}

                {/* 基礎体温点 */}
                {showTemp && typeof d.temperature === 'number' && (
                  <circle
                    cx={cx}
                    cy={getTempY(d.temperature)}
                    r={isSelected ? 5.5 : 3.8}
                    fill="#EC407A"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}

                {/* X軸日付ラベル */}
                <text
                  x={cx}
                  y={padTop + plotH + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isSelected ? '#5E35B1' : '#64748B'}
                  fontWeight={isSelected ? '700' : '500'}
                >
                  {formatShortDate(d.date)}
                </text>
                {d.cycleDay && (
                  <text
                    x={cx}
                    y={padTop + plotH + 28}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#94A3B8"
                  >
                    {d.cycleDay}日目
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// メインアプリケーションコンポーネント
// ============================================================================
export default function App() {
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'insights'
  const [chartRange, setChartRange] = useState('30'); // '14' | '30' | 'all'
  const [showTemp, setShowTemp] = useState(true);
  const [showMood, setShowMood] = useState(true);
  const [showSleep, setShowSleep] = useState(true);
  const [showEnergy, setShowEnergy] = useState(false);

  const [selectedNavDate, setSelectedNavDate] = useState(getTodayStr());
  const [toastMessage, setToastMessage] = useState('');
  const [showDataMenu, setShowDataMenu] = useState(false);

  // 時間帯判定（17時以降は夜モード表示）
  const isEveningTime = useMemo(() => new Date().getHours() >= 17, []);

  // フォーム状態
  const [formDate, setFormDate] = useState(getTodayStr());
  const [isPeriodStart, setIsPeriodStart] = useState(false);
  const [temperature, setTemperature] = useState('36.35');
  const [sleep, setSleep] = useState(7.0);
  const [manualStageOverride, setManualStageOverride] = useState(false);
  const [manualStageValue, setManualStageValue] = useState('follicular');

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [conditionTags, setConditionTags] = useState([]);
  const [selfCareTags, setSelfCareTags] = useState([]);
  const [memo, setMemo] = useState('');

  const [morningSavedFlag, setMorningSavedFlag] = useState(false);
  const [eveningSavedFlag, setEveningSavedFlag] = useState(false);
  const [eveningSectionOpen, setEveningSectionOpen] = useState(isEveningTime);

  const formRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3600);
  };

  // 初期データ読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load records', e);
    }
    const sample = createInitialSampleRecords();
    setRecords(sample);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    } catch (e) {
      console.error('Failed to save initial sample', e);
    }
  }, []);

  const persistRecords = (nextRecords) => {
    const sorted = [...nextRecords].sort((a, b) => a.date.localeCompare(b.date));
    setRecords(sorted);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    } catch (e) {
      console.error('Storage error', e);
    }
  };

  // 日付変更時に既存レコードをフォームへ反映
  useEffect(() => {
    const existing = records.find((r) => r.date === formDate);
    if (existing) {
      setIsPeriodStart(Boolean(existing.isPeriodStart));
      setTemperature(
        typeof existing.temperature === 'number' ? existing.temperature.toFixed(2) : '36.35'
      );
      setSleep(typeof existing.sleep === 'number' ? existing.sleep : 7.0);
      setManualStageOverride(Boolean(existing.manualStageOverride));
      setManualStageValue(existing.stage || 'follicular');

      setMood(typeof existing.mood === 'number' ? existing.mood : 3);
      setEnergy(typeof existing.energy === 'number' ? existing.energy : 3);
      setConditionTags(existing.conditionTags || []);
      setSelfCareTags(existing.selfCareTags || []);
      setMemo(existing.memo || '');

      setMorningSavedFlag(Boolean(existing.morningSaved));
      setEveningSavedFlag(Boolean(existing.eveningSaved));
      if (existing.eveningSaved || isEveningTime) {
        setEveningSectionOpen(true);
      }
    } else {
      setIsPeriodStart(false);
      setTemperature('36.35');
      setSleep(7.0);
      setManualStageOverride(false);
      setManualStageValue('follicular');
      setMood(3);
      setEnergy(3);
      setConditionTags([]);
      setSelfCareTags([]);
      setMemo('');
      setMorningSavedFlag(false);
      setEveningSavedFlag(false);
      setEveningSectionOpen(isEveningTime);
    }
  }, [formDate, records, isEveningTime]);

  // 全体分析の実行
  const analysis = useMemo(() => analyzeRecords(records), [records]);

  // グラフ表示期間フィルタ
  const chartData = useMemo(() => {
    if (chartRange === 'all') return analysis.enriched;
    const days = Number(chartRange);
    return analysis.enriched.slice(-days);
  }, [analysis.enriched, chartRange]);

  // ナビ表示対象日のレコード
  const activeNavRecord = useMemo(() => {
    return (
      analysis.enriched.find((r) => r.date === selectedNavDate) ||
      analysis.enriched[analysis.enriched.length - 1] ||
      null
    );
  }, [analysis.enriched, selectedNavDate]);

  // 体温微調整
  const adjustTemp = (delta) => {
    const current = parseFloat(temperature);
    const base = isNaN(current) ? 36.35 : current;
    const next = Math.max(34.5, Math.min(41.0, base + delta));
    setTemperature(next.toFixed(2));
  };

  // タグトグル
  const toggleTag = (list, setList, tag) => {
    if (list.includes(tag)) {
      setList(list.filter((t) => t !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  // 【ステージ1】Morning（生理開始・基礎体温・昨夜の睡眠時間）を保存する処理
  const handleSaveMorning = () => {
    const parsedTemp = parseFloat(temperature);
    const validTemp =
      !isNaN(parsedTemp) && parsedTemp >= 34.0 && parsedTemp <= 42.0
        ? Number(parsedTemp.toFixed(2))
        : null;

    const existing = records.find((r) => r.date === formDate);
    const keepEvening = Boolean(existing?.eveningSaved);

    const entry = {
      id: formDate,
      date: formDate,
      temperature: validTemp,
      mood: keepEvening ? existing.mood : null,
      energy: keepEvening ? existing.energy : null,
      sleep: Number(sleep),
      morningSaved: true,
      eveningSaved: keepEvening,
      isPeriodStart: Boolean(isPeriodStart),
      manualStageOverride: Boolean(manualStageOverride),
      stage: manualStageValue,
      conditionTags: keepEvening ? existing.conditionTags || [] : [],
      selfCareTags: keepEvening ? existing.selfCareTags || [] : [],
      memo: keepEvening ? existing.memo || '' : '',
    };

    const next = [...records.filter((r) => r.date !== formDate), entry];
    persistRecords(next);
    setSelectedNavDate(formDate);
    setMorningSavedFlag(true);
    if (!keepEvening && !isEveningTime) {
      setEveningSectionOpen(false);
    }
    showToast(`${formDate} の Morning 記録を保存しました ☀️`);
  };

  // 【ステージ2】夜の振り返り（1日を通した気分・体調・セルフケア）を保存して完了する処理
  const handleSaveEvening = (e) => {
    e.preventDefault();
    const parsedTemp = parseFloat(temperature);
    const validTemp =
      !isNaN(parsedTemp) && parsedTemp >= 34.0 && parsedTemp <= 42.0
        ? Number(parsedTemp.toFixed(2))
        : null;

    const existing = records.find((r) => r.date === formDate);

    const entry = {
      id: formDate,
      date: formDate,
      temperature: validTemp,
      mood: Number(mood),
      energy: Number(energy),
      sleep: Number(sleep),
      morningSaved: Boolean(existing?.morningSaved || validTemp),
      eveningSaved: true,
      isPeriodStart: Boolean(isPeriodStart),
      manualStageOverride: Boolean(manualStageOverride),
      stage: manualStageValue,
      conditionTags,
      selfCareTags,
      memo: memo.trim(),
    };

    const next = [...records.filter((r) => r.date !== formDate), entry];
    persistRecords(next);
    setSelectedNavDate(formDate);
    setMorningSavedFlag(true);
    setEveningSavedFlag(true);
    setEveningSectionOpen(true);
    showToast(`${formDate} の「夜の振り返り」を保存しました 🌙`);
  };

  // 過去レコード削除
  const handleDeleteRecord = (dateStr) => {
    const next = records.filter((r) => r.date !== dateStr);
    persistRecords(next);
    showToast(`${dateStr} の記録を削除しました`);
  };

  // 編集呼び出し
  const handleEditRecord = (dateStr) => {
    setFormDate(dateStr);
    setSelectedNavDate(dateStr);
    setEveningSectionOpen(true);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // CSVエクスポート
  const handleExportCSV = () => {
    const header = [
      '日付',
      '周期日数',
      '体の時期',
      '生理開始日',
      '基礎体温',
      '睡眠時間',
      '気分(1-5)',
      '元気度(1-5)',
      '体調サイン',
      'セルフケア',
      'メモ',
    ];
    const rows = analysis.enriched.map((r) => [
      r.date,
      r.cycleDay || '',
      STAGES[r.effectiveStage]?.name || '',
      r.isPeriodStart ? 'はい' : '',
      r.temperature ?? '',
      r.sleep ?? '',
      r.mood ?? '',
      r.energy ?? '',
      `"${(r.conditionTags || []).join('・')}"`,
      `"${(r.selfCareTags || []).join('・')}"`,
      `"${(r.memo || '').replace(/"/g, '""')}"`,
    ]);
    const csv = '\uFEFF' + [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rhythm_note_${getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDataMenu(false);
    showToast('CSVファイルをダウンロードしました');
  };

  // サンプルデータ復元
  const handleRestoreSample = () => {
    const sample = createInitialSampleRecords();
    persistRecords(sample);
    setFormDate(getTodayStr());
    setSelectedNavDate(getTodayStr());
    setShowDataMenu(false);
    showToast('35日分のサンプルデータを復元しました');
  };

  const activeStageInfo = activeNavRecord
    ? STAGES[activeNavRecord.effectiveStage] || STAGES.follicular
    : STAGES.follicular;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-[#FDF7FA] to-[#F2ECFF] text-slate-800 pb-16">
      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-[#4A3B69] text-white px-4 py-3 rounded-2xl shadow-lg border border-purple-300/40 text-xs sm:text-sm font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#F8BBD0] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ====================================================================
          ヘッダー＆ナビゲーション
         ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-purple-100 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* アプリロゴ */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#9575CD] to-[#F48FB1] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#4A3B69]">
                Rhythm Note
              </h1>
              <p className="text-[11px] text-[#7E57C2] font-medium">
                体のリズムと気分のつながりを見つけるバイオリズムノート
              </p>
            </div>
          </div>

          {/* タブ切り替え＆メニュー */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#F3E8FF] p-1 rounded-2xl border border-purple-200/70">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'home'
                    ? 'bg-white text-[#5E35B1] shadow-2xs'
                    : 'text-[#7E57C2] hover:text-[#4A3B69]'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>ホーム・記録</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'insights'
                    ? 'bg-white text-[#5E35B1] shadow-2xs'
                    : 'text-[#7E57C2] hover:text-[#4A3B69]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>傾向分析</span>
              </button>
            </div>

            {/* データ管理ドロップダウン */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="p-2 rounded-xl bg-white border border-purple-200 text-[#5E35B1] hover:bg-purple-50 transition"
                title="データ管理"
              >
                <Sliders className="w-4 h-4" />
              </button>
              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-purple-100 py-2 z-40 text-xs">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2.5 text-left hover:bg-purple-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-[#7E57C2]" />
                    <span>記録データをCSVで保存</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreSample}
                    className="w-full px-4 py-2.5 text-left hover:bg-purple-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#EC407A]" />
                    <span>サンプルデータ(35日分)を復元</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          メインコンテンツ
         ==================================================================== */}
      <main className="max-w-5xl mx-auto px-4 pt-5 space-y-6">
        {activeTab === 'home' ? (
          <>
            {/* --------------------------------------------------------------
                1. 今日のメカニズム解説 ＆ 気づきナビカード
               -------------------------------------------------------------- */}
            <section
              className="rounded-3xl p-5 sm:p-6 bg-white/95 border-2 shadow-sm transition-all"
              style={{ borderColor: activeStageInfo.borderHex }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#F3E8FF] text-[#5E35B1] text-xs font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeNavRecord?.date || getTodayStr()}
                    {activeNavRecord?.cycleDay ? `（周期 ${activeNavRecord.cycleDay}日目）` : ''}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${activeStageInfo.badgeBg} ${activeStageInfo.badgeText}`}
                  >
                    {activeStageInfo.name}・{activeStageInfo.tempPhase}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ※平均周期 {analysis.avgCycleLength}日基準
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (formRef.current) {
                      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#7E57C2] to-[#EC407A] text-white text-xs font-bold shadow-xs hover:opacity-95 transition flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>今日の記録を入力する</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 身体のメカニズム解説 */}
                <div className="lg:col-span-2 space-y-2.5">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#4A3B69]">
                    {activeStageInfo.summary}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {activeStageInfo.mechanism}
                  </p>
                  <div className="p-3 rounded-2xl bg-[#FAF7FF] border border-purple-100 text-xs text-[#5E35B1] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#9575CD] shrink-0 mt-0.5" />
                    <span>
                      <strong>過ごし方のヒント：</strong>
                      {activeStageInfo.advice}
                    </span>
                  </div>
                </div>

                {/* リズムと気分のギャップ診断ボックス */}
                <div className="rounded-2xl p-4 bg-gradient-to-br from-[#F8F5FF] to-[#FCE4EC]/50 border border-purple-100 flex flex-col justify-between space-y-3">
                  {activeNavRecord?.isGapDay ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>リズムとのギャップを検出</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        本来は心身が安定しやすい<strong>「卵胞期」</strong>ですが、気分低下やイライラが記録されています。
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        ホルモンの波ではなく、<strong>睡眠不足（{activeNavRecord.sleep}h）や日常の疲れ・ストレス</strong>など別の要因が影響しているサインかもしれません。
                      </p>
                    </div>
                  ) : activeNavRecord?.effectiveStage === 'luteal' &&
                    typeof activeNavRecord.mood === 'number' &&
                    activeNavRecord.mood <= 2 ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3E5F5] text-[#6A1B9A] text-xs font-bold">
                        <Info className="w-3.5 h-3.5" />
                        <span>体のメカニズム通りの反応</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        今は<strong>黄体期（高温期）</strong>のため、黄体ホルモンの影響でイライラや落ち込みが出やすいタイミングです。
                      </p>
                      <p className="text-[11px] text-[#6A1B9A] font-medium">
                        「自分のせいではなく体の仕組みによるもの」と受け止めて、今日は予定を詰めすぎず過ごしましょう。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0F2F1] text-[#00695C] text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>体のリズムと調和中</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        現在の時期（{activeStageInfo.name}）のリズムに沿って過ごせています。朝と夜の記録を続けると、あなた専用の波がより鮮明に見えてきます。
                      </p>
                    </div>
                  )}

                  {/* 当日の数値ミニサマリー */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-purple-100 text-center">
                    <div className="bg-white/80 rounded-xl py-1.5 px-1">
                      <div className="text-[10px] text-slate-400">基礎体温</div>
                      <div className="text-xs font-extrabold text-[#C2185B]">
                        {typeof activeNavRecord?.temperature === 'number'
                          ? `${activeNavRecord.temperature.toFixed(2)}℃`
                          : '--'}
                      </div>
                    </div>
                    <div className="bg-white/80 rounded-xl py-1.5 px-1">
                      <div className="text-[10px] text-slate-400">睡眠</div>
                      <div className="text-xs font-extrabold text-[#0284C7]">
                        {typeof activeNavRecord?.sleep === 'number'
                          ? `${activeNavRecord.sleep.toFixed(1)}h`
                          : '--'}
                      </div>
                    </div>
                    <div className="bg-white/80 rounded-xl py-1.5 px-1">
                      <div className="text-[10px] text-slate-400">気分</div>
                      <div className="text-xs font-extrabold text-[#5E35B1]">
                        {typeof activeNavRecord?.mood === 'number'
                          ? `${activeNavRecord.mood} / 5`
                          : '夜に入力'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* --------------------------------------------------------------
                2. バイオリズム相関バロメーター（複合グラフ）
               -------------------------------------------------------------- */}
            <section className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#4A3B69] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#7E57C2]" />
                    <span>バイオリズム相関バロメーター</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    背景の「体の時期」と、基礎体温・気分・睡眠を重ねて因果関係をチェック（点をクリックでその日の解説を表示）
                  </p>
                </div>

                {/* 表示期間切り替え */}
                <div className="flex bg-[#F5F0FF] p-1 rounded-xl border border-purple-200/70 text-xs font-bold">
                  {[
                    { id: '14', label: '14日間' },
                    { id: '30', label: '30日間' },
                    { id: 'all', label: '全期間' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChartRange(item.id)}
                      className={`px-3 py-1 rounded-lg transition ${
                        chartRange === item.id
                          ? 'bg-[#7E57C2] text-white shadow-2xs'
                          : 'text-[#5E35B1] hover:bg-purple-100/60'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 凡例＆ライン表示トグル */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* ラインON/OFF */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowTemp(!showTemp)}
                    className={`px-3 py-1 rounded-full font-bold border transition flex items-center gap-1.5 ${
                      showTemp
                        ? 'bg-[#FCE4EC] border-[#F48FB1] text-[#AD1457]'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EC407A]" />
                    <span>基礎体温（左軸）</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMood(!showMood)}
                    className={`px-3 py-1 rounded-full font-bold border transition flex items-center gap-1.5 ${
                      showMood
                        ? 'bg-[#F3E8FF] border-[#CE93D8] text-[#5E35B1]'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7E57C2]" />
                    <span>気分スコア（右軸）</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSleep(!showSleep)}
                    className={`px-3 py-1 rounded-full font-bold border transition flex items-center gap-1.5 ${
                      showSleep
                        ? 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                    <span>睡眠時間</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEnergy(!showEnergy)}
                    className={`px-3 py-1 rounded-full font-bold border transition flex items-center gap-1.5 ${
                      showEnergy
                        ? 'bg-[#E0F2F1] border-[#80CBC4] text-[#00695C]'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#26A69A]" />
                    <span>元気度</span>
                  </button>
                </div>

                {/* 背景色の凡例 */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  {Object.values(STAGES).map((st) => (
                    <span key={st.id} className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-sm border"
                        style={{ backgroundColor: st.bgHex, borderColor: st.borderHex }}
                      />
                      <span>{st.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* SVG複合グラフ */}
              <BiorythmBarometerChart
                data={chartData}
                showTemp={showTemp}
                showMood={showMood}
                showSleep={showSleep}
                showEnergy={showEnergy}
                selectedDate={activeNavRecord?.date}
                onSelectDate={(d) => setSelectedNavDate(d)}
              />
            </section>

            {/* --------------------------------------------------------------
                3. 毎日の記録エリア（朝パート ＆ 夜パート 2段階構成）
               -------------------------------------------------------------- */}
            <section
              ref={formRef}
              className="rounded-3xl p-5 sm:p-7 bg-gradient-to-b from-[#F5EFFF] to-[#FDF7FA] border-2 border-[#C5B3E6] shadow-md space-y-5"
            >
              {/* 記録エリアヘッダー ＆ 日付選択 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-200/70">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#7E57C2] text-white text-[11px] font-bold mb-1">
                    INPUT AREA
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#4A3B69]">
                    毎日の記録ノート
                  </h2>
                </div>

                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-purple-200 shadow-2xs">
                  <Calendar className="w-4 h-4 text-[#7E57C2]" />
                  <label htmlFor="record-date" className="text-xs font-bold text-slate-600">
                    記録する日付：
                  </label>
                  <input
                    id="record-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="text-xs sm:text-sm font-bold text-[#4A3B69] focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* 時間帯に応じた優しいメッセージバナー */}
              <div className="rounded-2xl px-4 py-3 bg-white/90 border border-purple-200 text-xs sm:text-sm text-[#4A3B69] flex items-center gap-2.5">
                {isEveningTime ? (
                  <>
                    <Moon className="w-4 h-4 text-[#7E57C2] shrink-0" />
                    <span>
                      こんばんは🌙 1日おつかれさまでした。下の<strong>「🌙 夜の振り返り」</strong>で今日の気分や体調をゆっくり記録しましょう。
                    </span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    <span>おはようございます。朝の記録をつけましょう。</span>
                  </>
                )}
              </div>

              {/* ============================================================
                  STAGE 1：Morning（生理・基礎体温・睡眠時間）
                 ============================================================ */}
              <div className="rounded-3xl p-4 sm:p-6 bg-white border-2 border-[#F8BBD0] shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-pink-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-2xl bg-[#FFF8E1] border border-[#FDE68A] flex items-center justify-center">
                      <Sun className="w-4 h-4 text-[#F59E0B]" />
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold tracking-wide text-[#4A3B69]">
                        Morning
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        生理開始の確認・基礎体温・昨夜の睡眠時間
                      </p>
                    </div>
                  </div>
                  {morningSavedFlag && (
                    <span className="px-2.5 py-1 rounded-full bg-[#FCE4EC] text-[#AD1457] text-[11px] font-bold">
                      ☀️ 記録済み（{temperature}℃ / 睡眠 {Number(sleep).toFixed(1)}h）
                    </span>
                  )}
                </div>

                {/* 朝 STEP 1（必須確認）：生理が始まりましたか？ */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#EC407A] text-white text-xs font-bold">
                      STEP 1（必須確認）
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">
                      生理が始まりましたか？（生理開始日の記録）
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPeriodStart(false)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                        !isPeriodStart
                          ? 'bg-[#FAF7FF] border-[#7E57C2] shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          !isPeriodStart ? 'border-[#7E57C2]' : 'border-slate-300'
                        }`}
                      >
                        {!isPeriodStart && <div className="w-2.5 h-2.5 rounded-full bg-[#7E57C2]" />}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-800">
                          まだ・生理開始日ではない
                        </div>
                        <div className="text-[11px] text-slate-500">
                          通常の日や、すでに生理中（2日目以降）はこちら
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPeriodStart(true)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                        isPeriodStart
                          ? 'bg-[#FCE4EC] border-[#EC407A] shadow-2xs'
                          : 'bg-white border-pink-200/80 text-slate-600 hover:bg-pink-50/40'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isPeriodStart ? 'border-[#EC407A]' : 'border-pink-300'
                        }`}
                      >
                        {isPeriodStart && <div className="w-2.5 h-2.5 rounded-full bg-[#EC407A]" />}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-[#AD1457]">
                          🩸 今日から生理が始まった！（開始日）
                        </div>
                        <div className="text-[11px] text-[#C2185B]">
                          ここを選ぶと新しい周期1日目として自動計算されます
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 朝 STEP 2（入力）：今朝の基礎体温 */}
                <div className="space-y-2.5 pt-2 border-t border-purple-50">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#EC407A] text-white text-xs font-bold">
                      STEP 2（入力）
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-[#EC407A]" />
                      今朝の基礎体温
                    </h4>
                  </div>

                  <div className="bg-[#FFF5F8] rounded-2xl p-3.5 border border-pink-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="34.00"
                        max="42.00"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        className="w-28 px-3 py-2 rounded-xl bg-white border-2 border-pink-200 text-lg font-extrabold text-[#AD1457] text-center focus:outline-none focus:border-[#EC407A]"
                      />
                      <span className="text-sm font-bold text-[#AD1457]">℃</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustTemp(-0.05)}
                        className="px-2.5 py-2 rounded-lg bg-white border border-pink-200 text-[#C2185B] text-xs font-bold hover:bg-pink-50 transition"
                      >
                        -0.05
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustTemp(-0.01)}
                        className="px-3 py-2 rounded-lg bg-white border border-pink-200 text-[#C2185B] text-xs font-bold hover:bg-pink-50 transition"
                      >
                        -0.01
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustTemp(0.01)}
                        className="px-3 py-2 rounded-lg bg-white border border-pink-200 text-[#C2185B] text-xs font-bold hover:bg-pink-50 transition"
                      >
                        +0.01
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustTemp(0.05)}
                        className="px-2.5 py-2 rounded-lg bg-white border border-pink-200 text-[#C2185B] text-xs font-bold hover:bg-pink-50 transition"
                      >
                        +0.05
                      </button>
                    </div>
                  </div>
                </div>

                {/* 朝 STEP 3（入力）：昨夜の睡眠時間 */}
                <div className="space-y-2.5 pt-2 border-t border-purple-50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#7E57C2] text-white text-xs font-bold">
                        STEP 3（入力）
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-[#7E57C2]" />
                        昨夜の睡眠時間
                      </h4>
                    </div>
                    <span className="text-sm font-bold text-[#4A3B69] bg-[#F5F0FF] px-3 py-0.5 rounded-xl border border-purple-200">
                      {Number(sleep).toFixed(1)} 時間
                    </span>
                  </div>

                  <div className="bg-[#FAF7FF] rounded-2xl p-3.5 border border-purple-100 space-y-2.5">
                    <input
                      type="range"
                      min="2.0"
                      max="12.0"
                      step="0.5"
                      value={sleep}
                      onChange={(e) => setSleep(parseFloat(e.target.value))}
                      className="w-full accent-[#7E57C2] cursor-pointer"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      {[5.0, 6.0, 6.5, 7.0, 7.5, 8.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSleep(preset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                            Number(sleep) === preset
                              ? 'bg-[#7E57C2] border-[#5E35B1] text-white shadow-2xs'
                              : 'bg-white border-purple-200 text-[#5E35B1] hover:bg-purple-50'
                          }`}
                        >
                          {preset.toFixed(1)}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 朝 STEP 4（確認）：現在の時期（体のリズム）の判定方法 */}
                <div className="space-y-2.5 pt-2 border-t border-purple-50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#7E57C2] text-white text-xs font-bold">
                        STEP 4（確認）
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">
                        現在の時期（体のリズム）の判定方法
                      </h4>
                    </div>

                    <div className="flex bg-[#F3E8FF] p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setManualStageOverride(false)}
                        className={`px-3 py-1 rounded-lg transition ${
                          !manualStageOverride
                            ? 'bg-[#7E57C2] text-white shadow-2xs'
                            : 'text-[#5E35B1]'
                        }`}
                      >
                        自動判定（おすすめ）
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualStageOverride(true)}
                        className={`px-3 py-1 rounded-lg transition ${
                          manualStageOverride
                            ? 'bg-[#7E57C2] text-white shadow-2xs'
                            : 'text-[#5E35B1]'
                        }`}
                      >
                        手動で選ぶ
                      </button>
                    </div>
                  </div>

                  {!manualStageOverride ? (
                    <div className="rounded-2xl p-3.5 bg-[#F5F0FF] border border-purple-200 text-xs text-[#4A3B69] leading-relaxed">
                      💡 <strong>自動判定では、記録された「生理開始日」と「基礎体温の変化」から現在の時期を自動で判断します。</strong>
                      専門知識がなくてもこのままで大丈夫です！
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.values(STAGES).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setManualStageValue(st.id)}
                          className={`p-2.5 rounded-xl border-2 text-xs font-bold transition ${
                            manualStageValue === st.id
                              ? 'border-[#7E57C2] bg-[#F3E8FF] text-[#4A3B69]'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Morning 保存ボタン */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveMorning}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F48FB1] to-[#9575CD] text-white font-extrabold text-sm shadow-sm hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    <span>Morning の記録を保存する</span>
                  </button>
                </div>

                {/* Morning 保存後＆夜の振り返り未完了時に表示する優しい案内カード */}
                {morningSavedFlag && !eveningSavedFlag && (
                  <div className="rounded-2xl p-4 bg-gradient-to-r from-[#F3E8FF] to-[#FCE4EC]/70 border border-[#D8B4FE] text-xs sm:text-sm text-[#4A3B69] leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#7E57C2] shrink-0 mt-0.5" />
                      <span>
                        ✨ 記録が完了しました！1日を通した気分や体調の振り返りは、夜にゆっくり入力しましょう 🌙
                      </span>
                    </div>
                    {!eveningSectionOpen && (
                      <button
                        type="button"
                        onClick={() => setEveningSectionOpen(true)}
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-[#5E35B1] text-xs font-bold hover:bg-purple-50 transition"
                      >
                        今入力する
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ============================================================
                  STAGE 2：🌙 夜の振り返り（1日の終わりに）
                 ============================================================ */}
              <form
                onSubmit={handleSaveEvening}
                className="rounded-3xl p-4 sm:p-6 bg-white border-2 border-[#C5B3E6] shadow-xs space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-2xl bg-[#F3E8FF] border border-purple-200 flex items-center justify-center">
                      <Moon className="w-4 h-4 text-[#7E57C2]" />
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-[#4A3B69]">
                        🌙 今日はどんな一日でしたか？（夜の振り返り）
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        1日を通した気分やイライラ、体調のサインをゆっくり記録しましょう
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {eveningSavedFlag && (
                      <span className="px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#5E35B1] text-[11px] font-bold">
                        🌙 振り返り済み
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEveningSectionOpen(!eveningSectionOpen)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7FF] border border-purple-200 text-xs font-bold text-[#5E35B1] hover:bg-purple-50 transition flex items-center gap-1"
                    >
                      <span>{eveningSectionOpen ? '閉じる' : '開いて入力する'}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          eveningSectionOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {eveningSectionOpen && (
                  <div className="space-y-5">
                    {/* 今日の気分（5段階） */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-[#EC407A]" />
                          1日を通した気分（5段階）
                        </label>
                        <span className="text-xs font-bold text-[#7E57C2]">
                          {MOOD_OPTIONS.find((m) => m.value === mood)?.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {MOOD_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setMood(opt.value)}
                            className={`py-2.5 px-1 rounded-2xl border-2 flex flex-col items-center gap-1 transition ${
                              mood === opt.value
                                ? 'bg-[#F3E8FF] border-[#7E57C2] shadow-2xs scale-[1.02]'
                                : 'bg-white border-purple-100 hover:bg-purple-50/50'
                            }`}
                          >
                            <span className="text-xl sm:text-2xl">{opt.emoji}</span>
                            <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                              {opt.value}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 元気度・エネルギー（1〜5） */}
                    <div className="bg-[#F2FBF9] rounded-2xl p-3.5 border border-[#B2DFDB]">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#00695C] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          元気度・エネルギー（1〜5）
                        </label>
                        <span className="text-xs font-bold text-[#00897B]">
                          {ENERGY_OPTIONS.find((e) => e.value === energy)?.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {ENERGY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setEnergy(opt.value)}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              energy === opt.value
                                ? 'bg-[#26A69A] border-[#00897B] text-white shadow-2xs'
                                : 'bg-white border-[#B2DFDB] text-[#00695C] hover:bg-teal-50'
                            }`}
                          >
                            {opt.value}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 今日の体調・気分のサイン */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-800 block">
                        今日の体調・気分のサイン（複数選択OK）
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_TAGS.map((tag) => {
                          const active = conditionTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(conditionTags, setConditionTags, tag)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                                active
                                  ? 'bg-[#FCE4EC] border-[#EC407A] text-[#AD1457] shadow-2xs'
                                  : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50/60'
                              }`}
                            >
                              {active ? `✓ ${tag}` : tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 今日できたセルフケア */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-800 block">
                        今日できたセルフケア・習慣（好調の秘訣を分析します）
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SELF_CARE_TAGS.map((tag) => {
                          const active = selfCareTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(selfCareTags, setSelfCareTags, tag)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                                active
                                  ? 'bg-[#E0F2F1] border-[#26A69A] text-[#00695C] shadow-2xs'
                                  : 'bg-white border-purple-100 text-slate-600 hover:bg-teal-50/40'
                              }`}
                            >
                              {active ? `✓ ${tag}` : tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ひとことメモ */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-800 block">
                        ひとことメモ（出来事や気づきなど）
                      </label>
                      <textarea
                        rows={2}
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="例：少しイライラしたけど高温期だからと気づいて早めに湯船に入った"
                        className="w-full rounded-2xl border border-purple-200 bg-[#FAF7FF] px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#7E57C2]"
                      />
                    </div>

                    {/* 夜の振り返り保存ボタン */}
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7E57C2] to-[#5E35B1] text-white font-extrabold text-sm shadow-sm hover:opacity-95 transition flex items-center justify-center gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      <span>🌙 夜の振り返りを保存して1日の記録を完了する</span>
                    </button>
                  </div>
                )}
              </form>
            </section>

            {/* --------------------------------------------------------------
                4. これまでの記録一覧（履歴・編集・削除）
               -------------------------------------------------------------- */}
            <section className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-[#4A3B69]">
                  これまでの記録（直近10件）
                </h2>
                <span className="text-xs text-slate-400">全 {records.length} 件</span>
              </div>

              <div className="space-y-2.5">
                {[...analysis.enriched]
                  .reverse()
                  .slice(0, 10)
                  .map((r) => {
                    const st = STAGES[r.effectiveStage] || STAGES.follicular;
                    const moodObj = MOOD_OPTIONS.find((m) => m.value === r.mood);
                    return (
                      <div
                        key={r.date}
                        className="p-3.5 rounded-2xl bg-[#FAF7FF] border border-purple-100 flex flex-wrap items-center justify-between gap-3 hover:border-purple-300 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-extrabold text-[#4A3B69]">
                              {r.date}
                            </span>
                            {r.cycleDay && (
                              <span className="text-[11px] font-bold text-slate-500">
                                ({r.cycleDay}日目)
                              </span>
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${st.badgeBg} ${st.badgeText}`}
                            >
                              {st.name}
                            </span>
                            {r.isPeriodStart && (
                              <span className="px-2 py-0.5 rounded-full bg-[#EC407A] text-white text-[10px] font-bold">
                                生理開始日
                              </span>
                            )}
                            {r.isGapDay && (
                              <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">
                                ギャップ検出
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span>
                              体温：
                              <strong className="text-[#C2185B]">
                                {typeof r.temperature === 'number'
                                  ? `${r.temperature.toFixed(2)}℃`
                                  : '--'}
                              </strong>
                            </span>
                            <span>
                              睡眠：
                              <strong className="text-[#0284C7]">
                                {typeof r.sleep === 'number' ? `${r.sleep.toFixed(1)}h` : '--'}
                              </strong>
                            </span>
                            <span>
                              気分：
                              <strong className="text-[#5E35B1]">
                                {moodObj ? `${moodObj.emoji} ${r.mood}/5` : '夜に未入力'}
                              </strong>
                            </span>
                          </div>

                          {(r.conditionTags?.length > 0 || r.memo) && (
                            <div className="text-[11px] text-slate-500">
                              {r.conditionTags?.length > 0 && (
                                <span className="mr-2 text-[#AD1457]">
                                  [{r.conditionTags.join('・')}]
                                </span>
                              )}
                              {r.memo && <span>{r.memo}</span>}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditRecord(r.date)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-bold text-[#5E35B1] hover:bg-purple-50 transition flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>編集</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.date)}
                            className="p-1.5 rounded-xl bg-white border border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </>
        ) : (
          /* ==================================================================
              傾向分析（マイパターン）タブ
             ================================================================== */
          <div className="space-y-6">
            {/* ヘッダーサマリー */}
            <section className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#5E35B1] text-[11px] font-bold mb-1">
                    REAL-TIME INSIGHTS
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#4A3B69]">
                    あなたのバイオリズム傾向分析（自動更新）
                  </h2>
                  <p className="text-xs text-slate-500">
                    記録が増えるたびに、あなたの周期・体温・気分の相関パターンを自動で再計算します
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7FF] border border-purple-100">
                  <div className="text-[11px] text-slate-500">あなたの平均周期</div>
                  <div className="text-xl font-extrabold text-[#5E35B1] mt-0.5">
                    {analysis.avgCycleLength} 日
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFF5F8] border border-pink-100">
                  <div className="text-[11px] text-slate-500">低温期→高温期の温度差</div>
                  <div className="text-xl font-extrabold text-[#C2185B] mt-0.5">
                    {analysis.tempDiff !== null ? `+${analysis.tempDiff.toFixed(2)} ℃` : '計測中'}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-amber-200">
                  <div className="text-[11px] text-slate-500">不調が始まりやすい目安</div>
                  <div className="text-xl font-extrabold text-[#B45309] mt-0.5">
                    {analysis.pmsStartCandidate
                      ? `生理 ${analysis.pmsStartCandidate.daysBefore}日前〜`
                      : '安定傾向'}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F2FBF9] border border-teal-100">
                  <div className="text-[11px] text-slate-500">リズム外不調（ギャップ日）</div>
                  <div className="text-xl font-extrabold text-[#00695C] mt-0.5">
                    {analysis.gapDays.length} 日検出
                  </div>
                </div>
              </div>
            </section>

            {/* 分析①：生理何日前からイライラ・落ち込みが始まりやすい？ */}
            <section className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#4A3B69] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#EC407A]" />
                    <span>① 生理の何日前からイライラ・落ち込みが始まりやすい？</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    生理開始日の10日前〜前日までの平均気分スコアと不調出現率をカウントダウン表示します
                  </p>
                </div>
              </div>

              {analysis.pmsStartCandidate && (
                <div className="p-3.5 rounded-2xl bg-[#FCE4EC]/70 border border-[#F8BBD0] text-xs sm:text-sm text-[#880E4F] leading-relaxed">
                  🔍 <strong>あなたの傾向：</strong>過去の記録から、生理予定日の
                  <strong className="underline mx-1">
                    約{analysis.pmsStartCandidate.daysBefore}日前
                  </strong>
                  あたりから気分スコアが下がり、イライラや落ち込みが出やすくなる傾向があります。この時期は「ホルモンの準備期間」と意識しておくと気持ちが楽になります。
                </div>
              )}

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-2">
                {analysis.countdownStats.map((item) => {
                  const barHeight = item.avgMood ? Math.round((item.avgMood / 5) * 100) : 0;
                  const isLow = item.avgMood !== null && item.avgMood <= 2.8;
                  return (
                    <div
                      key={item.daysBefore}
                      className="flex flex-col items-center bg-[#FAF7FF] rounded-2xl p-2 border border-purple-100"
                    >
                      <div className="text-[10px] font-bold text-slate-500 mb-1">
                        {item.daysBefore}日前
                      </div>
                      <div className="w-full h-24 bg-purple-100/50 rounded-xl flex items-end overflow-hidden p-0.5">
                        {item.avgMood !== null ? (
                          <div
                            className={`w-full rounded-lg transition-all ${
                              isLow ? 'bg-[#EC407A]' : 'bg-[#9575CD]'
                            }`}
                            style={{ height: `${barHeight}%` }}
                          />
                        ) : (
                          <div className="w-full text-center text-[9px] text-slate-400 pb-2">
                            --
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-xs font-extrabold mt-1.5 ${
                          isLow ? 'text-[#C2185B]' : 'text-[#4A3B69]'
                        }`}
                      >
                        {item.avgMood !== null ? item.avgMood.toFixed(1) : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 分析②：睡眠時間・生活要因と不調の相関 */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 睡眠時間別の平均気分 */}
              <div className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-[#4A3B69] flex items-center gap-2">
                  <Moon className="w-5 h-5 text-[#7E57C2]" />
                  <span>② 睡眠時間と気分スコアの相関</span>
                </h3>
                <p className="text-xs text-slate-500">
                  睡眠時間の長さによって、翌日の気分スコアにどれくらい差が出るかを比較しています
                </p>

                <div className="space-y-3 pt-1">
                  {analysis.sleepStats.map((sb) => {
                    const pct = sb.avgMood ? Math.round((sb.avgMood / 5) * 100) : 0;
                    return (
                      <div key={sb.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">
                            {sb.label}（{sb.count}日分）
                          </span>
                          <span className="text-[#5E35B1]">
                            {sb.avgMood !== null ? `平均 ${sb.avgMood} / 5.0` : 'データなし'}
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-purple-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#7E57C2] to-[#38BDF8]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ギャップ日（卵胞期なのに不調だった日）の共通要因 */}
              <div className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-[#4A3B69] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                  <span>③ 「卵胞期なのに不調だった日」の別要因サイン</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ホルモンが安定している時期にイライラや落ち込みが出た日に重なっていた要因です
                </p>

                {analysis.topGapFactors.length > 0 ? (
                  <div className="space-y-2.5">
                    {analysis.topGapFactors.map(([factor, count]) => (
                      <div
                        key={factor}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#FFFBEB] border border-amber-200 text-xs"
                      >
                        <span className="font-bold text-[#92400E]">{factor}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[#B45309] font-extrabold">
                          {count}回 該当
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FAF7FF] text-xs text-slate-500">
                    現在、卵胞期における大きなギャップ不調は検出されていません。安定したリズムを保てています！
                  </div>
                )}
              </div>
            </section>

            {/* 分析③：体の時期別の平均気分＆体温 ＆ 効きやすいセルフケア */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 4つの時期別の平均 */}
              <div className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-[#4A3B69] flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-[#EC407A]" />
                  <span>④ 体の時期ごとの平均体温・気分バランス</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {analysis.stageStats.map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-2xl border"
                      style={{ backgroundColor: st.bgHex, borderColor: st.borderHex }}
                    >
                      <div className="text-xs font-extrabold" style={{ color: st.textHex }}>
                        {st.name}（{st.count}日）
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-700">
                        <div>
                          平均体温：
                          <strong>{st.avgTemp !== null ? `${st.avgTemp}℃` : '--'}</strong>
                        </div>
                        <div>
                          平均気分：
                          <strong>{st.avgMood !== null ? `${st.avgMood} / 5` : '--'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 好調な日に実践しているセルフケアランキング */}
              <div className="rounded-3xl p-5 sm:p-6 bg-white/95 border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-[#4A3B69] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#26A69A]" />
                  <span>⑤ 気分が良い日に実践しているセルフケア習慣</span>
                </h3>
                <p className="text-xs text-slate-500">
                  気分スコア4〜5の好調な日に多く選ばれていた習慣のランキングです
                </p>

                {analysis.topSelfCares.length > 0 ? (
                  <div className="space-y-2.5">
                    {analysis.topSelfCares.map(([care, count], idx) => (
                      <div
                        key={care}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#F2FBF9] border border-[#B2DFDB] text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#26A69A] text-white font-extrabold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-[#00695C]">{care}</span>
                        </div>
                        <span className="text-[#00897B] font-extrabold">{count}日実践</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FAF7FF] text-xs text-slate-500">
                    夜の振り返りでセルフケアタグを記録していくと、あなたに効果が出やすい習慣が表示されます。
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
/**
 * src/utils/glossEngine.ts
 * 한국어 구어체 문장을 수어 글로스(Gloss) 형식으로 변환합니다.
 * - 조사(은/는/이/가/을/를/의/에/에서/로/으로) 제거
 * - 어미 정규화 (했어요 → 하다, 주세요 → 주다)
 * - 수어 어순: SOV (주어-목적어-서술어) 유지, 핵심어 추출
 */

// 제거할 조사 패턴 (긴 것 → 짧은 것 순서로 적용)
const PARTICLE_PATTERNS: RegExp[] = [
  /에서/g, /으로/g, /에게/g, /한테/g,
  /부터/g, /까지/g, /이랑/g, /하고/g,
  /이라/g, /이나/g, /이든/g,
  /와/g, /과/g, /랑/g,
  /을/g, /를/g, /은/g, /는/g,
  /이/g, /가/g, /의/g, /에/g, /로/g,
];

// 어미/경어 정규화 규칙
const ENDING_RULES: Array<[RegExp, string]> = [
  [/했어요\.?$/, '하다'],
  [/했습니다\.?$/, '하다'],
  [/하세요\.?$/, '하다'],
  [/해주세요\.?$/, '주다'],
  [/주세요\.?$/, '주다'],
  [/주십시오\.?$/, '주다'],
  [/입니다\.?$/, '이다'],
  [/이에요\.?$/, '이다'],
  [/예요\.?$/, '이다'],
  [/인가요\.?$/, ''],
  [/인지요\.?$/, ''],
  [/이에요\.?$/, '이다'],
  [/어요\.?$/, ''],
  [/아요\.?$/, ''],
  [/어요\.?$/, ''],
  [/네요\.?$/, ''],
  [/죠\.?$/, ''],
  [/요\.?$/, ''],
  [/\.?$/, ''],
];

/**
 * 공항 특화 글로스 사전 (표준 문장 → 글로스 직접 매핑)
 * 알고리즘 변환보다 우선 적용됩니다.
 */
const GLOSS_DICTIONARY: Record<string, string> = {
  '탑승 수속 창구가 어디인가요?': '탑승수속 창구 어디',
  '여권과 입국 신고서를 보여 주세요.': '여권 입국신고서 보여주다',
  '비행기를 놓쳤어요.': '비행기 놓치다',
  '수하물 찾는 곳이 어디입니까?': '수하물 찾다 어디',
  '짐이 망가졌어요.': '짐 망가지다',
  '면세점이 몇 층이에요?': '면세점 몇층',
  '화장실이 어디예요?': '화장실 어디',
  '이 비행기가 어디로 가나요?': '비행기 어디 가다',
  '항공편을 예약하고 싶어요.': '항공편 예약 원하다',
  '짐을 찾지 못했어요.': '짐 못 찾다',
  '환전소가 어디예요?': '환전소 어디',
  '몸이 아파요.': '몸 아프다',
  '분실물 센터가 어디예요?': '분실물센터 어디',
};

/**
 * 형태소 기반 글로스 변환 (규칙 기반 Fallback)
 */
function ruleBasedGloss(sentence: string): string {
  let text = sentence.trim();

  // 1. 어미 정규화
  for (const [pattern, replacement] of ENDING_RULES) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      break;
    }
  }

  // 2. 조사 제거
  for (const pattern of PARTICLE_PATTERNS) {
    text = text.replace(pattern, ' ');
  }

  // 3. 여러 공백 압축 및 트리밍
  text = text.replace(/\s+/g, ' ').trim();

  // 4. 빈 결과 방지
  if (!text) return sentence;

  return text;
}

/**
 * 한국어 문장을 수어 글로스로 변환합니다.
 * 사전 매핑 우선 → 규칙 기반 변환 순으로 적용합니다.
 */
export function convertToGloss(sentence: string): string {
  const trimmed = sentence.trim();

  // 사전 직접 매핑 확인
  if (GLOSS_DICTIONARY[trimmed]) {
    return GLOSS_DICTIONARY[trimmed];
  }

  // 부분 매칭 (사전에 포함 관계)
  for (const [key, value] of Object.entries(GLOSS_DICTIONARY)) {
    if (trimmed.includes(key.replace(/[?.]$/, ''))) {
      return value;
    }
  }

  // 규칙 기반 변환
  return ruleBasedGloss(trimmed);
}

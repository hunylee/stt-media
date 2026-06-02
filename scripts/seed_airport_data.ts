/**
 * scripts/seed_airport_data.ts
 * Airport.txt (70개 핵심 공항 구문)를 Supabase airport_sentences 테이블에 삽입
 *
 * 실행 방법:
 *   SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> npx ts-node scripts/seed_airport_data.ts
 * 또는:
 *   npx tsx scripts/seed_airport_data.ts
 */

import { createClient } from '@supabase/supabase-js';

// ────────────────────────────────────────────────
// Supabase 클라이언트 초기화 (Service Role Key 사용)
// ────────────────────────────────────────────────
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ────────────────────────────────────────────────
// Airport.txt 전체 70개 문장 (카테고리·글로스 수동 매핑)
// ────────────────────────────────────────────────
interface SeedRecord {
  category: string;
  sentence: string;
  gloss_sentence: string;
  emoji: string;
}

const SEED_DATA: SeedRecord[] = [
  // ── 탑승수속 ──────────────────────────────────
  { category: '탑승수속', sentence: '탑승 수속 창구가 어디인가요?',          gloss_sentence: '탑승수속 창구 어디',          emoji: '✈️' },
  { category: '탑승수속', sentence: '경유 시간이 얼마나 기나요?',            gloss_sentence: '경유 시간 얼마',             emoji: '✈️' },
  { category: '탑승수속', sentence: '도쿄에서 한 시간 정도 경유할 수 있어',  gloss_sentence: '도쿄 경유 1시간',            emoji: '✈️' },
  { category: '탑승수속', sentence: '비행기 어디서 갈아타나요?',             gloss_sentence: '비행기 환승 어디',           emoji: '✈️' },
  { category: '탑승수속', sentence: '비행기를 놓쳤어요.',                    gloss_sentence: '비행기 놓치다',              emoji: '✈️' },
  { category: '탑승수속', sentence: '다른 비행기를 탈 수 있나요?',           gloss_sentence: '다른 비행기 탑승 가능',       emoji: '✈️' },
  { category: '탑승수속', sentence: '탑승 시간은 언제입니까?',               gloss_sentence: '탑승 시간 언제',             emoji: '✈️' },
  { category: '탑승수속', sentence: '탑승 시간은 3시야',                     gloss_sentence: '탑승 시간 3시',              emoji: '✈️' },
  { category: '탑승수속', sentence: '탑승 게이트는 어디인가요?',             gloss_sentence: '탑승 게이트 어디',           emoji: '✈️' },
  { category: '탑승수속', sentence: '도착 게이트는 어디인가요?',             gloss_sentence: '도착 게이트 어디',           emoji: '✈️' },
  { category: '탑승수속', sentence: '어느 게이트로 가야 하나요?',            gloss_sentence: '게이트 어디',               emoji: '✈️' },
  { category: '탑승수속', sentence: '게이트로 몇 시까지 가면 되나요?',       gloss_sentence: '게이트 몇시 가다',           emoji: '✈️' },
  { category: '탑승수속', sentence: '복도 좌석으로 할 수 있나요?',           gloss_sentence: '복도 좌석 원하다',           emoji: '✈️' },
  { category: '탑승수속', sentence: '창가 좌석으로 할 수 있나요?',           gloss_sentence: '창가 좌석 원하다',           emoji: '✈️' },
  { category: '탑승수속', sentence: '국제선 터미널은 어디인가요?',           gloss_sentence: '국제선 터미널 어디',         emoji: '✈️' },

  // ── 입국심사 ──────────────────────────────────
  { category: '입국심사', sentence: '세관에 신고할 품목이 있나요?',           gloss_sentence: '세관 신고 품목 있나',        emoji: '🛂' },
  { category: '입국심사', sentence: '여권과 입국 신고서를 보여 주세요.',      gloss_sentence: '여권 입국-신고서 보여주다',  emoji: '🛂' },
  { category: '입국심사', sentence: '탑승권을 보여주세요.',                  gloss_sentence: '탑승권 보여주다',            emoji: '🛂' },
  { category: '입국심사', sentence: '네, 여기 있습니다.',                    gloss_sentence: '여기 있다',                 emoji: '🛂' },
  { category: '입국심사', sentence: '여권 연장했어요?',                      gloss_sentence: '여권 연장 했나',             emoji: '🛂' },
  { category: '입국심사', sentence: '여권 심사대가 어디입니까?',              gloss_sentence: '여권 심사대 어디',           emoji: '🛂' },
  { category: '입국심사', sentence: '여권 번호가 기억나질 않아요.',           gloss_sentence: '여권 번호 기억 안 나다',     emoji: '🛂' },
  { category: '입국심사', sentence: '어디에서 왔나요?',                      gloss_sentence: '어디 왔나',                 emoji: '🛂' },
  { category: '입국심사', sentence: '방문하신 목적이 무엇입니까?',           gloss_sentence: '방문 목적 무엇',             emoji: '🛂' },
  { category: '입국심사', sentence: '일 때문에 왔습니다',                    gloss_sentence: '출장 왔다',                 emoji: '🛂' },
  { category: '입국심사', sentence: '관광하러 왔습니다',                     gloss_sentence: '관광 왔다',                 emoji: '🛂' },
  { category: '입국심사', sentence: '어디를 방문할 계획입니까?',             gloss_sentence: '방문 장소 어디',             emoji: '🛂' },
  { category: '입국심사', sentence: '얼마나 머무르실 건가요?',               gloss_sentence: '머물다 기간 얼마',           emoji: '🛂' },
  { category: '입국심사', sentence: '5일 정도 머무를 계획입니다.',           gloss_sentence: '5일 머물다',                emoji: '🛂' },
  { category: '입국심사', sentence: '어디에서 지내실 건가요?',               gloss_sentence: '숙소 어디',                 emoji: '🛂' },
  { category: '입국심사', sentence: '호텔에서 지낼 거예요.',                 gloss_sentence: '호텔 지내다',               emoji: '🛂' },

  // ── 면세점 ────────────────────────────────────
  { category: '면세점', sentence: '면세점에서 쇼핑할 시간이 있을까요?',      gloss_sentence: '면세점 쇼핑 시간 있나',      emoji: '🛍️' },
  { category: '면세점', sentence: '면세점은 몇 층이에요?',                   gloss_sentence: '면세점 몇층',               emoji: '🛍️' },
  { category: '면세점', sentence: '면세점에서 살 거 있어?',                  gloss_sentence: '면세점 구매 필요',           emoji: '🛍️' },
  { category: '면세점', sentence: '면세 한도는 얼마입니까?',                 gloss_sentence: '면세 한도 얼마',             emoji: '🛍️' },
  { category: '면세점', sentence: '환전소는 어디에 있습니까?',               gloss_sentence: '환전소 어디',               emoji: '🛍️' },
  { category: '면세점', sentence: '환전 수수료는 얼마인가요?',               gloss_sentence: '환전 수수료 얼마',           emoji: '🛍️' },

  // ── 수하물 ────────────────────────────────────
  { category: '수하물', sentence: '짐이 몇개이십니까?',                      gloss_sentence: '짐 몇개',                   emoji: '🧳' },
  { category: '수하물', sentence: '기내 수하물이 있으시나요?',               gloss_sentence: '기내 수하물 있나',           emoji: '🧳' },
  { category: '수하물', sentence: '인화성 물질이 있나요?',                   gloss_sentence: '인화성 물질 있나',           emoji: '🧳' },
  { category: '수하물', sentence: '이 짐을 기내에 반입할 수 있나요?',        gloss_sentence: '짐 기내 반입 가능',          emoji: '🧳' },
  { category: '수하물', sentence: '수하물 찾는 곳이 어디입니까?',            gloss_sentence: '수하물 찾다 어디',           emoji: '🧳' },
  { category: '수하물', sentence: '수하물을 어디에 둘까요?',                 gloss_sentence: '수하물 두다 어디',           emoji: '🧳' },
  { category: '수하물', sentence: '컨베이어 벨트에 캐리어를 올려주세요.',    gloss_sentence: '캐리어 벨트 올리다',         emoji: '🧳' },
  { category: '수하물', sentence: '저울에 캐리어를 올려주세요.',             gloss_sentence: '캐리어 저울 올리다',         emoji: '🧳' },
  { category: '수하물', sentence: '수하물 예치증을 가지고 있습니까?',        gloss_sentence: '수하물 예치증 있나',         emoji: '🧳' },
  { category: '수하물', sentence: '수하물 찾는 곳에서 짐을 찾을 수 없습니다.', gloss_sentence: '수하물 못 찾다',          emoji: '🧳' },
  { category: '수하물', sentence: '제 캐리어가 망가졌어요.',                 gloss_sentence: '캐리어 파손',               emoji: '🧳' },
  { category: '수하물', sentence: '제 수화물을 잃어버린 거 같아요',          gloss_sentence: '수화물 잃다',               emoji: '🧳' },
  { category: '수하물', sentence: '분실물은 어디에서 찾을 수 있나요?',       gloss_sentence: '분실물 찾다 어디',           emoji: '🧳' },
  { category: '수하물', sentence: '캐리어 좀 열어 주시겠어요?',              gloss_sentence: '캐리어 열다',               emoji: '🧳' },

  // ── 항공예약 ──────────────────────────────────
  { category: '항공예약', sentence: '항공편을 예약하고 싶어요',              gloss_sentence: '항공편 예약 원하다',         emoji: '📋' },
  { category: '항공예약', sentence: '비행기 예약을 확인하고 싶어요',         gloss_sentence: '비행기 예약 확인',           emoji: '📋' },
  { category: '항공예약', sentence: '목적지가 어디인가요?',                  gloss_sentence: '목적지 어디',               emoji: '📋' },
  { category: '항공예약', sentence: '항공편을 취소하고 싶어요',              gloss_sentence: '항공편 취소 원하다',         emoji: '📋' },
  { category: '항공예약', sentence: '기내 반입이 가능한가요?',               gloss_sentence: '기내 반입 가능',             emoji: '📋' },
  { category: '항공예약', sentence: '비행시간이 얼마나 걸리나요?',           gloss_sentence: '비행시간 얼마',              emoji: '📋' },

  // ── 편의시설 ──────────────────────────────────
  { category: '편의시설', sentence: '화장실이 어디예요?',                    gloss_sentence: '화장실 어디',               emoji: '🚻' },
  { category: '편의시설', sentence: '렌트를 하고 싶어요',                    gloss_sentence: '렌트 원하다',               emoji: '🚻' },
  { category: '편의시설', sentence: '택시 승차장이 어디입니까?',             gloss_sentence: '택시 승차장 어디',           emoji: '🚻' },
  { category: '편의시설', sentence: '어디에서 버스를 탈 수 있나요?',         gloss_sentence: '버스 승차 어디',             emoji: '🚻' },
  { category: '편의시설', sentence: '연락할 수 있는 연락처를 주시면 소식이 들어오는 대로 연락드리겠습니다.', gloss_sentence: '연락처 주다 연락하겠다', emoji: '🚻' },
  { category: '편의시설', sentence: '제 전화번호는 000-0000입니다.',         gloss_sentence: '전화번호 알려주다',          emoji: '🚻' },

  // ── 기내 안내 ─────────────────────────────────
  { category: '기내안내', sentence: '곧 탑승을 시작합니다',                  gloss_sentence: '탑승 시작',                 emoji: '🛫' },
  { category: '기내안내', sentence: '곧 이륙합니다.',                        gloss_sentence: '이륙',                      emoji: '🛫' },
  { category: '기내안내', sentence: '곧 착륙합니다.',                        gloss_sentence: '착륙',                      emoji: '🛫' },
  { category: '기내안내', sentence: '안전벨트 매십시오',                     gloss_sentence: '안전벨트 착용',              emoji: '🛫' },
  { category: '기내안내', sentence: '비행기가 멈출 때까지 좌석에서 일어나지 마세요.', gloss_sentence: '멈추다 전까지 좌석 앉다', emoji: '🛫' },
  { category: '기내안내', sentence: '테이블을 원위치로 돌려주세요.',          gloss_sentence: '테이블 원위치',              emoji: '🛫' },
  { category: '기내안내', sentence: '수하물은 머리 위 사물함에 넣어 주시기 바랍니다.', gloss_sentence: '수하물 사물함 넣다', emoji: '🛫' },
];

// ────────────────────────────────────────────────
// 시딩 실행
// ────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Airport.txt 데이터 Supabase 시딩 시작...');
  console.log(`   총 ${SEED_DATA.length}개 문장 삽입 예정\n`);

  // 기존 데이터 삭제 (재시딩 시 중복 방지)
  const { error: deleteError } = await supabase
    .from('airport_sentences')
    .delete()
    .neq('id', 0); // 전체 삭제

  if (deleteError) {
    console.warn('⚠️  기존 데이터 삭제 실패 (테이블이 없거나 권한 문제일 수 있음):', deleteError.message);
  } else {
    console.log('🗑️  기존 데이터 초기화 완료');
  }

  // 카테고리별로 분류해서 표시
  const categories = [...new Set(SEED_DATA.map(r => r.category))];
  for (const cat of categories) {
    const count = SEED_DATA.filter(r => r.category === cat).length;
    console.log(`   - ${cat}: ${count}개`);
  }
  console.log('');

  // 배치 삽입
  const { data, error } = await supabase
    .from('airport_sentences')
    .insert(SEED_DATA)
    .select();

  if (error) {
    console.error('❌ 시딩 실패:', error.message);
    console.error('   상세:', error.details);
    process.exit(1);
  }

  console.log(`✅ 시딩 완료! ${data?.length ?? 0}개 문장 삽입됨`);

  // 검증
  const { count } = await supabase
    .from('airport_sentences')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 DB 최종 확인: airport_sentences 테이블에 ${count}개 행 존재`);
}

seed().catch((err) => {
  console.error('❌ 예상치 못한 오류:', err);
  process.exit(1);
});

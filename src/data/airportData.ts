/**
 * src/data/airportData.ts
 * 공항 핵심 문장 로컬 데이터셋 (70개)
 * Supabase 오프라인 fallback 및 초기 캐시로 사용됩니다.
 */

import type { AirportSentence } from '@/types/database';

// 로컬 AirportSentence (embedding 제외, Supabase 스키마 호환)
type LocalSentence = Omit<AirportSentence, 'embedding'>;

export const AIRPORT_SENTENCES: LocalSentence[] = [
  // BOARDING — 탑승수속
  { id: 1,  category: 'BOARDING',    sentence: '탑승 수속 창구가 어디인가요?',         gloss_sentence: '탑승수속 창구 어디',             english_translation: 'Where is the check-in counter?',              keywords: ['탑승수속','창구'],            display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 2,  category: 'BOARDING',    sentence: '탑승권을 보여주시겠어요?',              gloss_sentence: '탑승권 보여주다',                english_translation: 'Can I see your boarding pass?',               keywords: ['탑승권'],                     display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 3,  category: 'BOARDING',    sentence: '비행기를 놓쳤어요.',                    gloss_sentence: '비행기 놓치다',                  english_translation: 'I missed my flight.',                          keywords: ['비행기','놓치다'],             display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 4,  category: 'BOARDING',    sentence: '출발 게이트가 어디예요?',               gloss_sentence: '출발 게이트 어디',               english_translation: 'Where is the departure gate?',                keywords: ['게이트','출발'],               display_order: 4,  is_active: true, created_at: '', updated_at: '' },
  { id: 5,  category: 'BOARDING',    sentence: '탑승 시간이 언제예요?',                gloss_sentence: '탑승 시간 언제',                 english_translation: 'What time is boarding?',                      keywords: ['탑승','시간'],                 display_order: 5,  is_active: true, created_at: '', updated_at: '' },
  { id: 6,  category: 'BOARDING',    sentence: '비행기가 얼마나 지연됐나요?',           gloss_sentence: '비행기 지연 얼마',               english_translation: 'How long is the flight delayed?',             keywords: ['지연','비행기'],               display_order: 6,  is_active: true, created_at: '', updated_at: '' },
  { id: 7,  category: 'BOARDING',    sentence: '창가 자리로 주세요.',                   gloss_sentence: '창가 자리 원하다',               english_translation: 'I would like a window seat.',                 keywords: ['창가','자리'],                 display_order: 7,  is_active: true, created_at: '', updated_at: '' },
  { id: 8,  category: 'BOARDING',    sentence: '통로 자리로 주세요.',                   gloss_sentence: '통로 자리 원하다',               english_translation: 'I would like an aisle seat.',                 keywords: ['통로','자리'],                 display_order: 8,  is_active: true, created_at: '', updated_at: '' },
  { id: 9,  category: 'BOARDING',    sentence: '항공편이 취소됐나요?',                  gloss_sentence: '항공편 취소 됐나',               english_translation: 'Is the flight cancelled?',                    keywords: ['항공편','취소'],               display_order: 9,  is_active: true, created_at: '', updated_at: '' },
  { id: 10, category: 'BOARDING',    sentence: '체크인 카운터가 어디예요?',             gloss_sentence: '체크인 카운터 어디',             english_translation: 'Where is the check-in counter?',              keywords: ['체크인','카운터'],             display_order: 10, is_active: true, created_at: '', updated_at: '' },

  // IMMIGRATION — 입국심사
  { id: 11, category: 'IMMIGRATION', sentence: '여권과 입국 신고서를 보여 주세요.',     gloss_sentence: '여권 입국신고서 보여주다',       english_translation: 'Please show your passport and entry form.',   keywords: ['여권','입국신고서'],           display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 12, category: 'IMMIGRATION', sentence: '방문 목적이 무엇인가요?',               gloss_sentence: '방문 목적 무엇',                english_translation: 'What is the purpose of your visit?',          keywords: ['방문','목적'],                 display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 13, category: 'IMMIGRATION', sentence: '관광입니다.',                           gloss_sentence: '관광',                          english_translation: 'Tourism.',                                     keywords: ['관광'],                       display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 14, category: 'IMMIGRATION', sentence: '출장입니다.',                           gloss_sentence: '출장',                          english_translation: 'Business trip.',                               keywords: ['출장'],                       display_order: 4,  is_active: true, created_at: '', updated_at: '' },
  { id: 15, category: 'IMMIGRATION', sentence: '얼마나 머물 예정인가요?',               gloss_sentence: '머물다 기간 얼마',               english_translation: 'How long will you be staying?',               keywords: ['머물다','기간'],               display_order: 5,  is_active: true, created_at: '', updated_at: '' },
  { id: 16, category: 'IMMIGRATION', sentence: '일주일 동안 머물 예정입니다.',          gloss_sentence: '일주일 머물다',                 english_translation: 'I plan to stay for a week.',                  keywords: ['일주일'],                     display_order: 6,  is_active: true, created_at: '', updated_at: '' },
  { id: 17, category: 'IMMIGRATION', sentence: '세관 신고서를 작성해 주세요.',          gloss_sentence: '세관 신고서 작성하다',           english_translation: 'Please fill out the customs form.',           keywords: ['세관','신고서'],               display_order: 7,  is_active: true, created_at: '', updated_at: '' },
  { id: 18, category: 'IMMIGRATION', sentence: '신고할 물건이 없어요.',                 gloss_sentence: '신고 물건 없다',                english_translation: 'I have nothing to declare.',                  keywords: ['신고','없다'],                 display_order: 8,  is_active: true, created_at: '', updated_at: '' },

  // BAGGAGE — 수하물
  { id: 19, category: 'BAGGAGE',     sentence: '수하물 찾는 곳이 어디입니까?',          gloss_sentence: '수하물 찾다 어디',               english_translation: 'Where is the baggage claim?',                 keywords: ['수하물','찾다'],               display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 20, category: 'BAGGAGE',     sentence: '제 캐리어가 안 나왔어요.',              gloss_sentence: '캐리어 안 나오다',               english_translation: 'My luggage has not arrived.',                 keywords: ['캐리어','수하물'],             display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 21, category: 'BAGGAGE',     sentence: '짐이 망가졌어요.',                      gloss_sentence: '짐 망가지다',                   english_translation: 'My luggage is damaged.',                      keywords: ['짐','망가지다'],               display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 22, category: 'BAGGAGE',     sentence: '수하물 분실 신고를 하고 싶어요.',       gloss_sentence: '수하물 분실 신고 원하다',        english_translation: 'I want to report lost baggage.',             keywords: ['분실','신고'],                 display_order: 4,  is_active: true, created_at: '', updated_at: '' },
  { id: 23, category: 'BAGGAGE',     sentence: '수하물 무게가 초과됐어요.',             gloss_sentence: '수하물 무게 초과',               english_translation: 'My baggage is overweight.',                  keywords: ['무게','초과'],                 display_order: 5,  is_active: true, created_at: '', updated_at: '' },
  { id: 24, category: 'BAGGAGE',     sentence: '짐을 부치고 싶어요.',                   gloss_sentence: '짐 부치다 원하다',               english_translation: 'I want to check my luggage.',                keywords: ['짐','부치다'],                 display_order: 6,  is_active: true, created_at: '', updated_at: '' },
  { id: 25, category: 'BAGGAGE',     sentence: '수하물 보관소가 어디예요?',             gloss_sentence: '수하물 보관소 어디',             english_translation: 'Where is the luggage storage?',              keywords: ['보관소'],                     display_order: 7,  is_active: true, created_at: '', updated_at: '' },

  // DUTY_FREE — 면세점
  { id: 26, category: 'DUTY_FREE',   sentence: '면세점이 몇 층이에요?',                gloss_sentence: '면세점 몇층',                   english_translation: 'What floor is the duty-free shop?',          keywords: ['면세점'],                     display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 27, category: 'DUTY_FREE',   sentence: '이거 얼마예요?',                       gloss_sentence: '이거 얼마',                     english_translation: 'How much is this?',                           keywords: ['얼마'],                       display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 28, category: 'DUTY_FREE',   sentence: '카드로 결제할게요.',                   gloss_sentence: '카드 결제',                     english_translation: 'I will pay by card.',                         keywords: ['카드','결제'],                 display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 29, category: 'DUTY_FREE',   sentence: '환불할 수 있나요?',                    gloss_sentence: '환불 가능',                     english_translation: 'Can I get a refund?',                         keywords: ['환불'],                       display_order: 4,  is_active: true, created_at: '', updated_at: '' },
  { id: 30, category: 'DUTY_FREE',   sentence: '다른 사이즈 있나요?',                  gloss_sentence: '다른 사이즈 있나',               english_translation: 'Do you have another size?',                  keywords: ['사이즈'],                     display_order: 5,  is_active: true, created_at: '', updated_at: '' },

  // TRANSPORT — 교통
  { id: 31, category: 'TRANSPORT',   sentence: '시내 가는 버스는 어디서 타나요?',      gloss_sentence: '시내버스 어디 타다',             english_translation: 'Where can I take the bus to the city?',      keywords: ['버스','시내'],                 display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 32, category: 'TRANSPORT',   sentence: '택시 타는 곳이 어디예요?',             gloss_sentence: '택시 타다 어디',                english_translation: 'Where can I get a taxi?',                    keywords: ['택시'],                       display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 33, category: 'TRANSPORT',   sentence: '지하철역이 어디예요?',                 gloss_sentence: '지하철역 어디',                 english_translation: 'Where is the subway station?',               keywords: ['지하철'],                     display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 34, category: 'TRANSPORT',   sentence: '이 차가 시내로 가나요?',               gloss_sentence: '이 차 시내 가다',               english_translation: 'Does this go to the city?',                  keywords: ['시내','가다'],                 display_order: 4,  is_active: true, created_at: '', updated_at: '' },

  // FACILITY — 편의시설
  { id: 35, category: 'FACILITY',    sentence: '화장실이 어디예요?',                    gloss_sentence: '화장실 어디',                   english_translation: 'Where is the restroom?',                     keywords: ['화장실'],                     display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 36, category: 'FACILITY',    sentence: 'ATM이 어디예요?',                      gloss_sentence: 'ATM 어디',                      english_translation: 'Where is the ATM?',                          keywords: ['ATM'],                        display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 37, category: 'FACILITY',    sentence: '환전소가 어디예요?',                    gloss_sentence: '환전소 어디',                   english_translation: 'Where is the currency exchange?',            keywords: ['환전소'],                     display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 38, category: 'FACILITY',    sentence: '와이파이 비밀번호가 뭐예요?',           gloss_sentence: '와이파이 비밀번호 무엇',         english_translation: 'What is the Wi-Fi password?',               keywords: ['와이파이','비밀번호'],         display_order: 4,  is_active: true, created_at: '', updated_at: '' },
  { id: 39, category: 'FACILITY',    sentence: '안내 데스크가 어디예요?',               gloss_sentence: '안내 데스크 어디',               english_translation: 'Where is the information desk?',            keywords: ['안내','데스크'],               display_order: 5,  is_active: true, created_at: '', updated_at: '' },
  { id: 40, category: 'FACILITY',    sentence: '식당이 어디예요?',                      gloss_sentence: '식당 어디',                     english_translation: 'Where is the restaurant?',                  keywords: ['식당'],                       display_order: 6,  is_active: true, created_at: '', updated_at: '' },

  // MEDICAL — 의료
  { id: 41, category: 'MEDICAL',     sentence: '몸이 아파요.',                          gloss_sentence: '몸 아프다',                     english_translation: 'I am sick.',                                 keywords: ['아프다'],                     display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 42, category: 'MEDICAL',     sentence: '의사가 필요해요.',                      gloss_sentence: '의사 필요',                     english_translation: 'I need a doctor.',                           keywords: ['의사'],                       display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 43, category: 'MEDICAL',     sentence: '응급 처치가 필요해요.',                 gloss_sentence: '응급처치 필요',                 english_translation: 'I need first aid.',                          keywords: ['응급','처치'],                 display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 44, category: 'MEDICAL',     sentence: '약국이 어디예요?',                      gloss_sentence: '약국 어디',                     english_translation: 'Where is the pharmacy?',                    keywords: ['약국'],                       display_order: 4,  is_active: true, created_at: '', updated_at: '' },

  // LOST — 분실물
  { id: 45, category: 'LOST',        sentence: '분실물 센터가 어디예요?',               gloss_sentence: '분실물센터 어디',               english_translation: 'Where is the lost and found center?',       keywords: ['분실물'],                     display_order: 1,  is_active: true, created_at: '', updated_at: '' },
  { id: 46, category: 'LOST',        sentence: '지갑을 잃어버렸어요.',                  gloss_sentence: '지갑 잃다',                     english_translation: 'I lost my wallet.',                          keywords: ['지갑','잃다'],                 display_order: 2,  is_active: true, created_at: '', updated_at: '' },
  { id: 47, category: 'LOST',        sentence: '여권을 잃어버렸어요.',                  gloss_sentence: '여권 잃다',                     english_translation: 'I lost my passport.',                        keywords: ['여권','잃다'],                 display_order: 3,  is_active: true, created_at: '', updated_at: '' },
  { id: 48, category: 'LOST',        sentence: '핸드폰을 잃어버렸어요.',               gloss_sentence: '핸드폰 잃다',                   english_translation: 'I lost my phone.',                           keywords: ['핸드폰','폰'],                 display_order: 4,  is_active: true, created_at: '', updated_at: '' },
  { id: 49, category: 'LOST',        sentence: '도와주세요!',                           gloss_sentence: '도움 필요',                     english_translation: 'Please help me!',                            keywords: ['도움','도와주다'],             display_order: 5,  is_active: true, created_at: '', updated_at: '' },
  { id: 50, category: 'LOST',        sentence: '저는 청각장애인입니다.',               gloss_sentence: '나 청각장애인',                 english_translation: 'I am hearing impaired.',                     keywords: ['청각장애인'],                 display_order: 6,  is_active: true, created_at: '', updated_at: '' },
];

export type { AirportSentence };

/**
 * src/app/api/transcribe/route.ts
 * Gemini AI 음성 인식(STT) 프록시 Route Handler
 * - gemini-2.0-flash 멀티모달: WAV 오디오 → 한국어 텍스트
 * - API Key를 서버에서만 사용 (클라이언트 노출 방지)
 * - 공항 도메인 컨텍스트 프롬프트로 인식 정확도 향상
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini 파일 크기 제한: 20MB (인라인 base64 기준)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// 공항 도메인 컨텍스트 프롬프트
const TRANSCRIBE_PROMPT = `다음 오디오를 한국어로 정확하게 받아쓰기해 주세요.
이 오디오는 공항에서 사용되는 대화입니다. 아래 공항 관련 단어들이 자주 등장합니다:
탑승수속, 탑승권, 여권, 비자, 입국심사, 수하물, 짐, 캐리어, 면세점, 환전, 탑승구, 항공편, 보딩패스, 세관신고서, 보안검색, 출국심사, 항공사, 화장실, 분실물, 대사관.
받아쓰기 텍스트만 출력하고, 다른 설명은 절대 포함하지 마세요.`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '오디오 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `파일 크기가 20MB를 초과합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 413 }
      );
    }

    if (file.size < 100) {
      return NextResponse.json(
        { error: '오디오 데이터가 너무 짧습니다.' },
        { status: 400 }
      );
    }

    // File → ArrayBuffer → base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // MIME 타입 결정 (기본: audio/wav)
    const mimeType = (file.type || 'audio/wav') as
      | 'audio/wav'
      | 'audio/mp3'
      | 'audio/mpeg'
      | 'audio/ogg'
      | 'audio/webm';

    // Gemini 멀티모달 STT 호출
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0,         // 받아쓰기는 deterministic하게
        maxOutputTokens: 512,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      TRANSCRIBE_PROMPT,
    ]);

    const text = result.response.text().trim();

    if (!text) {
      return NextResponse.json(
        { error: '음성을 인식하지 못했습니다. 다시 말씀해 주세요.' },
        { status: 422 }
      );
    }

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      transcript: text,
      processingTimeMs,
      model: 'gemini-2.0-flash',
    });
  } catch (error) {
    console.error('[/api/transcribe] Gemini 오류:', error);

    const message = error instanceof Error ? error.message : String(error);

    // 할당량 초과
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      return NextResponse.json(
        { error: 'API 요청 한도 초과. 잠시 후 재시도하세요.' },
        { status: 429 }
      );
    }

    // API 키 문제
    if (message.includes('403') || message.toLowerCase().includes('api key')) {
      return NextResponse.json(
        { error: 'Gemini API 키가 유효하지 않습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: `서버 내부 오류: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

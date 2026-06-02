/**
 * src/app/api/embed/route.ts
 * Gemini Embeddings API 프록시 Route Handler
 * - text-embedding-004 모델: 768차원 벡터 생성
 * - Supabase pgvector 코사인 유사도 검색에 사용
 *
 * ⚠️  Gemini 임베딩은 768차원 (OpenAI 1536차원과 다름)
 *    → Supabase의 airport_sentences.embedding 컬럼을 vector(768)로 설정해야 함
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body as { text?: string };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 입력 텍스트 최대 길이 제한 (2048 토큰 이내 권장)
    const trimmedText = text.trim().slice(0, 512);

    // Gemini text-embedding-004 호출 (768차원)
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent({
      content: {
        role: 'user',
        parts: [{ text: trimmedText }],
      },
      // taskType: 검색용 쿼리에 RETRIEVAL_QUERY 적용 (SDK TaskType enum 사용)
      taskType: TaskType.RETRIEVAL_QUERY,
    });

    const embedding = result.embedding.values;

    return NextResponse.json({
      embedding,
      dimensions: embedding.length, // 768
      model: 'text-embedding-004',
    });
  } catch (error) {
    console.error('[/api/embed] Gemini 임베딩 오류:', error);

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      return NextResponse.json(
        { error: 'API 요청 한도 초과.' },
        { status: 429 }
      );
    }

    if (message.includes('403') || message.toLowerCase().includes('api key')) {
      return NextResponse.json(
        { error: 'Gemini API 키가 유효하지 않습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: `임베딩 생성 실패: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

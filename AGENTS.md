<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# AGENTS.md

## Project goal
이 프로젝트는 청각장애인을 위한 실시간 자막 생성 및 전달 웹앱입니다. 공항 스크립트를 이용해서 자막 생성
1. Airport.txt의 문장을 학습
2. 공항에서 사용하는 문장을 기반으로 청각장애인에게 자막으로 실시간으로 전달
3. Airport.txt의 문장이 단어마다 끊김없이 청각장애인이 이해할 수 있게 gloss + whisper 기반으로 문장으로 변환해서 자막으로 실시간 표출
4. Hermes agent로 위 내용으로 기획, 설계를 하기
5. 언어는 웹앱으로 모바일과 웹으로 보일 수 있게 typescript로 개발
6. 데이터셋은 스크립트 파일을 활용해서 supabase 연동
7. 코딩은 codex + gemini 3.1 pro를 활용해서 진행
8. Hareness를 이용해서 코드 리뷰 및 수정 후 완성 배포

## 차후 개발 계획(개발 계획이며 개발은 진행 안함)
1. Signgpt 소스를 분석
2. Hermes agent를 이용해서 signgpt 소스와 mediapipe를 활용한 영상 촬영 데이터셋 구축
3. 데이터셋을 추출해서 수어영상을 데이터로 전환 
4. 이 영상을 기반으로 아바타 생성(사람처럼 비슷하게)
5. 감정적인 표현을 추구  
6. 1~5번은 현재 데이터가 없어서 개발 진행 보류 

### 지시

```txt
이 저장소의 AGENTS.md를 따르세요.
수정 후 npm run harness를 실행하고,
실패하면 원인 분석 후 수정하세요.
최종 답변에는 변경 파일, 실행한 명령, 테스트 결과를 요약하세요.


## Setup
- Node 20 사용
- 의존성 설치: npm install

## Test harness
변경 후 반드시 아래 순서로 검증한다.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run harness
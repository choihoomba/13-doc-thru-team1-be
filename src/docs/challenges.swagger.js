// src/docs/challenges.swagger.js
// challenges 엔드포인트 Swagger 문서
// swagger.js의 apis 경로(./src/docs/*.js)로 스캔됨

/**
 * @openapi
 * tags:
 *   - name: Challenges
 *     description: 챌린지 목록 조회 관련 API
 */

/**
 * @openapi
 * /challenges:
 *   get:
 *     summary: 챌린지 목록 조회
 *     description: >
 *       공개된 챌린지 목록을 페이지 단위로 조회합니다.
 *       제목 검색, 분야, 문서 타입, 챌린지 상태 필터를 사용할 수 있습니다.
 *       status를 전달하지 않으면 APPROVED와 CLOSED 상태의 챌린지를 모두 조회합니다.
 *       삭제 처리된 챌린지는 조회 결과에서 제외되며,
 *       목록은 생성일을 기준으로 최신순으로 정렬됩니다.
 *       accessToken 쿠키를 이용한 로그인이 필요합니다.
 *     tags: [Challenges]
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: 조회할 페이지 번호
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *
 *       - in: query
 *         name: pageSize
 *         required: false
 *         description: 한 페이지에 조회할 챌린지 개수
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         example: 5
 *
 *       - in: query
 *         name: keyword
 *         required: false
 *         description: 챌린지 제목 검색어
 *         schema:
 *           type: string
 *           minLength: 1
 *         example: 리액트
 *
 *       - in: query
 *         name: field
 *         required: false
 *         description: 챌린지 분야
 *         schema:
 *           type: string
 *           enum:
 *             - NEXTJS
 *             - REACT
 *             - MODERNJS
 *             - TYPESCRIPT
 *             - API
 *             - WEB
 *             - CAREER
 *         example: REACT
 *
 *       - in: query
 *         name: docType
 *         required: false
 *         description: 번역 문서 타입
 *         schema:
 *           type: string
 *           enum:
 *             - OFFICIAL
 *             - BLOG
 *             - BOOK
 *             - ETC
 *         example: OFFICIAL
 *
 *       - in: query
 *         name: status
 *         required: false
 *         description: >
 *           챌린지 상태입니다.
 *           값을 전달하지 않으면 APPROVED와 CLOSED 상태를 모두 조회합니다.
 *         schema:
 *           type: string
 *           enum:
 *             - APPROVED
 *             - CLOSED
 *         example: APPROVED
 *
 *     responses:
 *       200:
 *         description: 챌린지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - page
 *                 - pageSize
 *                 - totalCount
 *                 - data
 *               properties:
 *                 page:
 *                   type: integer
 *                   description: 현재 페이지 번호
 *                   example: 1
 *
 *                 pageSize:
 *                   type: integer
 *                   description: 한 페이지에 조회하는 챌린지 개수
 *                   example: 5
 *
 *                 totalCount:
 *                   type: integer
 *                   description: 검색 및 필터 조건에 맞는 전체 챌린지 개수
 *                   example: 12
 *
 *                 data:
 *                   type: array
 *                   description: 챌린지 목록
 *                   items:
 *                     type: object
 *                     required:
 *                       - id
 *                       - title
 *                       - field
 *                       - docType
 *                       - deadline
 *                       - status
 *                       - currentParticipants
 *                       - maxParticipants
 *                       - isFull
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 챌린지 ID
 *                         example: 7
 *
 *                       title:
 *                         type: string
 *                         description: 챌린지 제목
 *                         example: React 공식 문서 번역하기
 *
 *                       field:
 *                         type: string
 *                         description: 챌린지 분야
 *                         enum:
 *                           - NEXTJS
 *                           - REACT
 *                           - MODERNJS
 *                           - TYPESCRIPT
 *                           - API
 *                           - WEB
 *                           - CAREER
 *                         example: REACT
 *
 *                       docType:
 *                         type: string
 *                         description: 번역 문서 타입
 *                         enum:
 *                           - OFFICIAL
 *                           - BLOG
 *                           - BOOK
 *                           - ETC
 *                         example: OFFICIAL
 *
 *                       deadline:
 *                         type: string
 *                         format: date-time
 *                         description: 챌린지 마감 일시
 *                         example: '2026-08-31T14:59:59.000Z'
 *
 *                       status:
 *                         type: string
 *                         description: 챌린지 상태
 *                         enum:
 *                           - APPROVED
 *                           - CLOSED
 *                         example: APPROVED
 *
 *                       currentParticipants:
 *                         type: integer
 *                         description: 현재 참여 인원
 *                         minimum: 0
 *                         example: 3
 *
 *                       maxParticipants:
 *                         type: integer
 *                         description: 최대 참여 가능 인원
 *                         minimum: 1
 *                         example: 5
 *
 *                       isFull:
 *                         type: boolean
 *                         description: 현재 참여 인원이 최대 인원에 도달했는지 여부
 *                         example: false
 *
 *             example:
 *               page: 1
 *               pageSize: 5
 *               totalCount: 12
 *               data:
 *                 - id: 7
 *                   title: React 공식 문서 번역하기
 *                   field: REACT
 *                   docType: OFFICIAL
 *                   deadline: '2026-08-31T14:59:59.000Z'
 *                   status: APPROVED
 *                   currentParticipants: 3
 *                   maxParticipants: 5
 *                   isFull: false
 *
 *       400:
 *         description: 쿼리스트링 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       401:
 *         description: >
 *           accessToken 쿠키가 없거나, 만료되었거나,
 *           유효하지 않은 경우 발생하는 인증 오류 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       500:
 *         description: 서버 내부 오류 (INTERNAL_SERVER_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

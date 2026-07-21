// Challenge Swagger 문서는 실행 코드와 분리하여 Route 파일의 역할을 단순하게 유지합니다.
// 다른 담당자는 자신의 엔드포인트 문서를 이 파일의 같은 Challenges 태그 아래에 추가합니다.

/**
 * @openapi
 * tags:
 *   name: Challenges
 *   description: 번역 챌린지 신청, 조회 및 관리 API
 */

/**
 * @openapi
 * /challenges:
 *   post:
 *     summary: 신규 챌린지 신청
 *     description: 인증된 USER 또는 ADMIN이 번역을 원하는 문서를 신규 챌린지로 신청합니다. accessToken 쿠키 인증이 필요합니다.
 *     tags: [Challenges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, field, docType, content, originalUrl, deadline, maxParticipants]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: Express Router 공식 문서 번역
 *               field:
 *                 type: string
 *                 enum: [NEXTJS, REACT, MODERNJS, TYPESCRIPT, API, WEB, CAREER]
 *                 example: WEB
 *               docType:
 *                 type: string
 *                 enum: [OFFICIAL, BLOG, BOOK, ETC]
 *                 example: OFFICIAL
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Express Router 공식 문서를 함께 번역합니다.
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://expressjs.com/en/guide/routing.html
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: 현재 시간보다 이후인 마감일
 *                 example: 2026-12-20T23:59:59.000Z
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *                 example: 8
 *     responses:
 *       201:
 *         description: 챌린지 신청 성공. PENDING 상태로 생성됩니다.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *       400:
 *         description: 요청 본문 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /challenges/{id}:
 *   patch:
 *     summary: 진행 중인 챌린지 정보 수정
 *     description: 관리자가 승인되었고 마감 전인 챌린지의 정보를 수정합니다. accessToken 쿠키 인증과 ADMIN 권한이 필요합니다.
 *     tags: [Challenges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 수정할 챌린지 ID
 *         example: 12
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             description: 전달한 필드만 변경합니다.
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               field:
 *                 type: string
 *                 enum: [NEXTJS, REACT, MODERNJS, TYPESCRIPT, API, WEB, CAREER]
 *               docType:
 *                 type: string
 *                 enum: [OFFICIAL, BLOG, BOOK, ETC]
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: 현재 시간보다 이후인 마감일
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *                 description: 현재 참여 인원보다 작게 변경할 수 없습니다.
 *     responses:
 *       200:
 *         description: 챌린지 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *       400:
 *         description: 경로 또는 요청 본문 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 관리자 권한이 아님 (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 존재하지 않거나 삭제된 챌린지 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 진행 중이 아니거나 현재 참여 인원보다 작은 정원으로 수정 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

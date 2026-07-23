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
 *     description: 인증된 USER 또는 ADMIN이 신규 챌린지를 신청합니다. 서버에서 PENDING 상태와 현재 참여 인원 0명을 설정합니다.
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
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
 *                 maxLength: 2048
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
 *         description: 챌린지 신청 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               data:
 *                 id: 19
 *                 title: Express Router 공식 문서 번역
 *                 field: WEB
 *                 docType: OFFICIAL
 *                 content: Express Router 공식 문서를 함께 번역합니다.
 *                 originalUrl: https://expressjs.com/en/guide/routing.html
 *                 deadline: 2026-12-20T23:59:59.000Z
 *                 maxParticipants: 8
 *                 currentParticipants: 0
 *                 status: PENDING
 *                 reason: null
 *                 deletedAt: null
 *                 userId: 2
 *       400:
 *         description: 요청 본문 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: title은 필수 값입니다.
 *               code: VALIDATION_ERROR
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 로그인이 필요합니다.
 *               code: UNAUTHORIZED
 */

/**
 * @openapi
 * /challenges/{id}:
 *   patch:
 *     summary: 진행 중인 챌린지 정보 수정
 *     description: ADMIN이 승인되었고 마감 전인 챌린지를 수정합니다. 수정과 신청자 알림 생성을 같은 트랜잭션으로 처리합니다.
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
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
 *             minProperties: 2
 *             required: [reason]
 *             description: 수정할 필드를 한 개 이상 전달하고 관리자 수정 사유를 함께 입력합니다.
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: MDN Fetch API 번역 챌린지
 *               field:
 *                 type: string
 *                 enum: [NEXTJS, REACT, MODERNJS, TYPESCRIPT, API, WEB, CAREER]
 *                 example: API
 *               docType:
 *                 type: string
 *                 enum: [OFFICIAL, BLOG, BOOK, ETC]
 *                 example: OFFICIAL
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *                 example: MDN Fetch API 문서를 함께 번역합니다.
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *                 maxLength: 2048
 *                 example: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: 현재 시간보다 이후인 마감일
 *                 example: 2026-12-20T23:59:59.000Z
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *                 description: 현재 참여 인원보다 작게 변경할 수 없습니다.
 *                 example: 6
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: 신청자에게 전달할 관리자 수정 사유이며 Challenge의 거절 사유 필드에는 저장하지 않습니다.
 *                 example: 원문 링크와 마감 일정을 최신 정보로 수정했습니다.
 *     responses:
 *       200:
 *         description: 챌린지 수정 및 신청자 알림 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *             example:
 *               success: true
 *               data:
 *                 id: 12
 *                 title: MDN Fetch API 번역 챌린지
 *                 field: API
 *                 docType: OFFICIAL
 *                 content: MDN Fetch API 문서를 함께 번역합니다.
 *                 originalUrl: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 *                 deadline: 2026-12-20T23:59:59.000Z
 *                 maxParticipants: 6
 *                 currentParticipants: 3
 *                 status: APPROVED
 *                 reason: null
 *                 deletedAt: null
 *                 userId: 2
 *       400:
 *         description: 경로 또는 요청 본문 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 수정 사유를 입력해주세요.
 *               code: VALIDATION_ERROR
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 로그인이 필요합니다.
 *               code: UNAUTHORIZED
 *       403:
 *         description: 관리자 권한이 아님
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 접근 권한이 없습니다.
 *               code: FORBIDDEN
 *       404:
 *         description: 존재하지 않거나 삭제된 챌린지
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 챌린지를 찾을 수 없습니다.
 *               code: NOT_FOUND
 *       409:
 *         description: 진행 중이 아니거나 현재 참여 인원보다 작은 정원으로 수정
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 진행 중인 챌린지만 수정할 수 있습니다.
 *               code: CONFLICT
 */

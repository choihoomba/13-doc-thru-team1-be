// src/docs/challenges.swagger.js
// 공개 챌린지(목록/상세/신청) Swagger 문서

/**
 * @openapi
 * tags:
 *   name: Challenges
 */

/**
 * @openapi
 * /challenges:
 *   get:
 *     summary: 승인된 챌린지 목록 조회
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: field
 *         schema:
 *           type: string
 *           enum: [NEXTJS, REACT, MODERNJS, TYPESCRIPT, API, WEB, CAREER]
 *       - in: query
 *         name: docType
 *         schema:
 *           type: string
 *           enum: [OFFICIAL, BLOG, BOOK, ETC]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         challenges:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Challenge'
 *                         total: { type: integer, example: 42 }
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 10 }
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: 챌린지 신청(생성)
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
 *                 example: "Next.js - App Router: Routing Fundamentals"
 *               field:
 *                 type: string
 *                 enum: [NEXTJS, REACT, MODERNJS, TYPESCRIPT, API, WEB, CAREER]
 *               docType:
 *                 type: string
 *                 enum: [OFFICIAL, BLOG, BOOK, ETC]
 *               content:
 *                 type: string
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               maxParticipants:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: 신청 성공 (PENDING 상태로 생성됨)
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
 *         description: 유효성 검사 실패 (VALIDATION_ERROR)
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
 *   get:
 *     summary: 승인된 챌린지 상세 조회 (참여 전 미리보기)
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Challenge'
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 승인된 챌린지가 아니거나 존재하지 않음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

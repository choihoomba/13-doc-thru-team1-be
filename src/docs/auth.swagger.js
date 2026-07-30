// src/docs/auth.swagger.js
// auth 엔드포인트 Swagger 문서 (라우터와 분리)
// swagger.js의 apis 경로(./src/docs/*.js)로 스캔됨

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 */

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nickname]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password1234
 *               nickname:
 *                 type: string
 *                 example: 만두
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 이미 사용 중인 이메일 (CONFLICT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /auth/signin:
 *   post:
 *     summary: 로그인
 *     description: 성공 시 accessToken, refreshToken이 httpOnly 쿠키로 설정됩니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password1234
 *     responses:
 *       200:
 *         description: 로그인 성공 (쿠키 설정됨)
 *         headers:
 *           Set-Cookie:
 *             description: accessToken, refreshToken (httpOnly)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: 유효성 검사 실패 (VALIDATION_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 이메일 또는 비밀번호 불일치 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: 본인 정보 조회
 *     description: accessToken 쿠키로 인증합니다.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
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
 *                       $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: 인증 실패 / 토큰 만료 (UNAUTHORIZED / TOKEN_EXPIRED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 사용자를 찾을 수 없음 (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /auth/signout:
 *   post:
 *     summary: 로그아웃
 *     description: DB의 refreshToken을 제거하고 인증 쿠키를 삭제합니다.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공 (쿠키 삭제됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 인증 실패 (UNAUTHORIZED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: 토큰 재발급 (sliding session)
 *     description: >
 *       refreshToken 쿠키를 검증하고 새 accessToken, refreshToken을 발급합니다.
 *       인증 미들웨어 없이 refreshToken 쿠키만으로 동작합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 재발급 성공 (쿠키 갱신됨)
 *         headers:
 *           Set-Cookie:
 *             description: 새 accessToken, refreshToken (httpOnly)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: >
 *           refreshToken 없음/위조/해시 불일치 (UNAUTHORIZED) 또는
 *           만료 (REFRESH_EXPIRED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

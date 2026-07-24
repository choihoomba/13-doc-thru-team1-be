/**
 * Challenge 도메인의 단일 Swagger/OpenAPI 문서 파일입니다.
 *
 * 이 파일이 필요한 이유
 * ----------------------
 * 실제 요청 처리는 route/controller/service/repository가 담당하지만 Swagger UI는
 * 실행 코드를 분석해서 query, request body, response schema를 자동으로 추론하지
 * 않습니다. 따라서 `/api-docs`에 정확한 사용법을 보여주려면 `@openapi` JSDoc으로
 * 외부 API 계약을 별도로 선언해야 합니다.
 *
 * `src/config/swagger.js`의 `apis: ['./src/routes/*.js', './src/docs/*.js']` 설정이
 * 이 파일을 자동으로 읽습니다. 파일을 삭제하거나 `@openapi` 블록을 제거해도
 * 실제 API는 계속 작동하지만 Swagger UI에서 해당 엔드포인트 설명이 사라집니다.
 *
 * 하나로 통합한 이유
 * ------------------
 * 기존에는 담당 범위를 구분하기 위해 다음 두 파일로 나뉘어 있었습니다.
 * - challenge-query.swagger.js: GET 목록·상세
 * - challenge-manage.swagger.js: POST·PATCH·DELETE
 *
 * 실행 레이어가 `challenge.*.js` 단일 파일로 통합된 뒤에도 Swagger만 query와
 * manage로 남아 있으면 별도 API가 존재하는 것처럼 오해하기 쉽습니다. 또한 같은
 * `/challenges`, `/challenges/{id}` path의 문서를 수정할 때 두 파일을 함께
 * 확인해야 합니다. 그래서 기존 OpenAPI 내용을 손실 없이 이 파일 하나로 합쳤습니다.
 *
 * 문서 구성
 * ---------
 * 1. Challenges tag
 * 2. GET /challenges 목록
 * 3. POST /challenges 신규 신청
 * 4. GET /challenges/{id} 상세
 * 5. PATCH /challenges/{id} 수정·승인·거절·취소
 * 6. DELETE /challenges/{id} 관리자 삭제
 *
 * 주의사항
 * --------
 * - 이 파일은 문서 전용이며 Router를 등록하거나 Prisma를 호출하지 않습니다.
 * - 기존 API 명세에 없는 새 path를 문서에만 임의로 추가하지 않습니다.
 * - Validation이나 응답 형식이 바뀌면 실행 코드와 이 문서를 함께 수정합니다.
 * - 모든 성공 응답은 `{ success: true, data }` 계약을 따릅니다.
 */

/**
 * @openapi
 * tags:
 *   - name: Challenges
 *     description: 번역 챌린지 조회, 신청 및 관리 API
 */

/**
 * GET /challenges 문서
 * -------------------
 * 하나의 목록 endpoint를 `view` query로 재사용하는 이유와 화면별 조건을
 * Swagger에서 바로 확인할 수 있게 합니다. 프론트는 화면마다 새 URL을 외우는
 * 대신 같은 query 이름과 같은 pagination 응답을 사용합니다.
 *
 * `status`는 모든 ChallengeStatus를 문법적으로 받을 수 있지만 실행 Validation이
 * view와 모순되는 조합을 추가로 차단합니다.
 * - public: APPROVED, CLOSED만 허용
 * - participating/completed: view가 상태를 결정하므로 status 사용 불가
 * - applied/admin: 필요한 상태 필터 사용 가능
 */
/**
 * @openapi
 * /challenges:
 *   get:
 *     summary: 챌린지 목록 조회
 *     description: |
 *       하나의 목록 API를 view query로 화면별로 구분합니다.
 *
 *       - public: 승인 및 마감 챌린지
 *       - participating: 내가 참여 중인 진행 중 챌린지
 *       - completed: 내가 참여한 마감 챌린지
 *       - applied: 내가 어드민에게 신청한 챌린지
 *       - admin: 관리자 신청 관리 목록
 *
 *       검색·필터·정렬 조건은 함께 조합할 수 있습니다. 모든 view가 동일한
 *       `{ success, data: { challenges, pagination } }` 응답을 사용합니다.
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: view
 *         description: 조회할 화면 종류입니다. 생략하면 공개 목록입니다.
 *         schema:
 *           type: string
 *           enum: [public, participating, completed, applied, admin]
 *           default: public
 *       - in: query
 *         name: search
 *         description: 챌린지 제목 부분 검색어입니다.
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: field
 *         description: 개발 분야 enum 필터입니다.
 *         schema:
 *           type: string
 *           enum: [NEXTJS, REACT, MODERNJS, TYPESCRIPT, API, WEB, CAREER]
 *       - in: query
 *         name: docType
 *         description: 원문 문서 유형 enum 필터입니다.
 *         schema:
 *           type: string
 *           enum: [OFFICIAL, BLOG, BOOK, ETC]
 *       - in: query
 *         name: status
 *         description: public, applied, admin view에서 사용합니다. public은 APPROVED와 CLOSED만 허용하며, admin은 생략 시 전체 상태를 조회합니다.
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, DELETED, CLOSED]
 *       - in: query
 *         name: sort
 *         description: 등록 시각 또는 마감일 기준 정렬입니다.
 *         schema:
 *           type: string
 *           enum: [latest, oldest, deadlineAsc, deadlineDesc]
 *           default: latest
 *       - in: query
 *         name: page
 *         description: 1부터 시작하는 페이지 번호입니다.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         description: 페이지당 개수이며 최대 100개입니다.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   required: [challenges, pagination]
 *                   properties:
 *                     challenges:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 *                     pagination:
 *                       type: object
 *                       required: [page, limit, total, totalPages, hasNext]
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 10 }
 *                         total: { type: integer, example: 18 }
 *                         totalPages: { type: integer, example: 2 }
 *                         hasNext: { type: boolean, example: true }
 *       400:
 *         description: 지원하지 않는 query 값 또는 view/status 조합
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 일반 사용자가 admin view를 요청함
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * POST /challenges 문서
 * --------------------
 * 클라이언트가 입력하는 챌린지 정보만 request body에 노출합니다. userId, status,
 * currentParticipants는 서버가 결정하므로 문서의 입력 properties에 포함하지
 * 않습니다. 이렇게 Swagger의 Try it out도 실제 Validation 계약과 일치합니다.
 */
/**
 * @openapi
 * /challenges:
 *   post:
 *     summary: 신규 챌린지 신청
 *     description: |
 *       인증된 USER 또는 ADMIN이 신규 챌린지를 신청합니다.
 *       신청 결과는 바로 공개 목록에 노출되지 않고 PENDING 상태로 저장되며,
 *       관리자가 같은 Challenge API의 PATCH 기능으로 승인한 뒤 공개됩니다.
 *
 *       userId는 로그인 쿠키의 사용자 정보로 결정하고 status,
 *       currentParticipants 같은 서버 관리 필드는 요청에서 받지 않습니다.
 *       deadline은 신청 시점으로부터 최소 7일 이후여야 합니다.
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
 *                 description: 신청 시점으로부터 최소 7일 이후의 마감일입니다.
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *           example:
 *             title: Express Router 공식 문서 번역
 *             field: WEB
 *             docType: OFFICIAL
 *             content: Express Router 공식 문서를 함께 번역합니다.
 *             originalUrl: https://expressjs.com/en/guide/routing.html
 *             deadline: 2026-12-20T23:59:59.000Z
 *             maxParticipants: 8
 *     responses:
 *       201:
 *         description: 신청 성공
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
 *         description: 입력값 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * GET /challenges/{id} 문서
 * ------------------------
 * Challenge 자체 정보 외에 상세 화면에서 조합해 사용하는 relation과 viewer
 * 정보를 설명합니다.
 *
 * - originalUrl: 프론트의 원문 보기 새 창에 사용
 * - topSubmissions: CLOSED에서만 최다 추천 작업물
 * - viewer.isApplicant: 신청자 본인 여부
 * - viewer.participation: 현재 사용자의 ACTIVE 참여와 작업물 ID
 * - viewer.canParticipate: 도전하기 버튼 활성화 여부
 *
 * PENDING/REJECTED/DELETED 상세는 신청자와 관리자만 조회할 수 있으며, 권한이
 * 없는 사용자는 리소스 존재 여부를 알 수 없도록 404를 받습니다.
 */
/**
 * @openapi
 * /challenges/{id}:
 *   get:
 *     summary: 챌린지 상세 조회
 *     description: |
 *       승인·마감 챌린지는 모든 로그인 사용자가 조회할 수 있습니다.
 *       그 외 신청 상태는 신청자 본인과 관리자만 조회할 수 있습니다.
 *
 *       현재 사용자의 참여/작업물 ID와 참여 가능 여부를 viewer에 반환합니다.
 *       마감된 챌린지는 최다 추천 작업물을 topSubmissions에 반환합니다.
 *       원문 보기는 응답의 originalUrl을 새 창으로 열어 사용합니다.
 *     tags: [Challenges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 조회할 챌린지의 양의 정수 ID입니다.
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *                       allOf:
 *                         - $ref: '#/components/schemas/Challenge'
 *                         - type: object
 *                           properties:
 *                             topSubmissions:
 *                               type: array
 *                               description: CLOSED 상태에서만 반환되는 최다 추천 작업물입니다.
 *                               items:
 *                                 $ref: '#/components/schemas/Submission'
 *                             viewer:
 *                               type: object
 *                               description: 현재 로그인 사용자 기준 상세 화면 상태입니다.
 *                               properties:
 *                                 isApplicant:
 *                                   type: boolean
 *                                   description: 현재 사용자가 챌린지 신청자인지 여부입니다.
 *                                 canParticipate:
 *                                   type: boolean
 *                                   description: 마감·정원·신청자·기존 참여를 모두 고려한 도전 가능 여부입니다.
 *                                 participation:
 *                                   nullable: true
 *                                   description: 현재 사용자의 ACTIVE 참여이며 없으면 null입니다.
 *                                   $ref: '#/components/schemas/Participation'
 *       400:
 *         description: 양의 정수가 아닌 챌린지 ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 챌린지가 없거나 비공개 상세 조회 권한이 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * PATCH /challenges/{id} 문서
 * --------------------------
 * 기존 명세의 한 PATCH path에서 세 기능을 처리하므로 requestBody를 oneOf로
 * 표현합니다. 각 object는 실행 Validation과 동일하게 서로 다른 식별 필드를
 * 사용합니다.
 *
 * - 수정: 변경 필드 + reason
 * - 승인/거절: status + 거절 시 reason
 * - 신청 취소: action=CANCEL
 *
 * 서로 다른 예시를 Swagger UI에서 선택할 수 있어 프론트와 어드민 담당자가
 * 같은 path를 사용하더라도 body 계약을 혼동하지 않습니다.
 */
/**
 * @openapi
 * /challenges/{id}:
 *   patch:
 *     summary: 챌린지 정보 수정, 승인·거절 또는 신청 취소
 *     description: |
 *       같은 PATCH Handler가 요청 본문을 기준으로 기능을 구분합니다.
 *       - 정보 수정: ADMIN, 수정 필드와 reason 전달
 *       - 승인·거절: ADMIN, status와 필요 시 reason 전달
 *       - 신청 취소: 신청자 본인, action=CANCEL 전달
 *
 *       정보 수정·승인·거절은 Challenge 변경과 신청자 알림 생성을 같은
 *       transaction 안에서 처리합니다. 따라서 변경만 저장되고 알림이 누락되는
 *       중간 상태를 만들지 않습니다. 신청 취소는 승인 대기(PENDING) 상태에서만
 *       가능하며 취소 후 어드민 신청 목록에서 제외됩니다.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: 진행 중인 챌린지 정보 수정
 *                 required: [reason]
 *                 properties:
 *                   title: { type: string, maxLength: 100 }
 *                   field:
 *                     type: string
 *                     enum: [NEXTJS, REACT, MODERNJS, TYPESCRIPT, API, WEB, CAREER]
 *                   docType:
 *                     type: string
 *                     enum: [OFFICIAL, BLOG, BOOK, ETC]
 *                   content: { type: string, maxLength: 5000 }
 *                   originalUrl: { type: string, format: uri }
 *                   deadline: { type: string, format: date-time }
 *                   maxParticipants: { type: integer, minimum: 1 }
 *                   reason: { type: string, maxLength: 100 }
 *               - type: object
 *                 description: 승인 또는 거절
 *                 required: [status]
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [APPROVED, REJECTED]
 *                   reason:
 *                     type: string
 *                     maxLength: 100
 *                     description: REJECTED일 때 필수
 *               - type: object
 *                 description: 신청자 본인의 승인 대기 신청 취소
 *                 required: [action]
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [CANCEL]
 *           examples:
 *             update:
 *               summary: 정보 수정
 *               value:
 *                 maxParticipants: 10
 *                 reason: 모집 정원을 조정했습니다.
 *             approve:
 *               summary: 승인
 *               value:
 *                 status: APPROVED
 *             reject:
 *               summary: 거절
 *               value:
 *                 status: REJECTED
 *                 reason: 원문 링크를 확인할 수 없습니다.
 *             cancel:
 *               summary: 신청 취소
 *               value:
 *                 action: CANCEL
 *     responses:
 *       200:
 *         description: 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/Challenge'
 *                         - type: object
 *                           properties:
 *                             id: { type: integer }
 *       400:
 *         description: 입력값 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 역할 또는 소유권 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 챌린지를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 현재 상태에서 처리할 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * DELETE /challenges/{id} 문서
 * ---------------------------
 * 실제 row를 제거하지 않고 `status=DELETED`, `deletedAt`, `reason`을 남기는
 * soft delete 계약을 설명합니다. 데이터를 남겨야 신청자가 나의 신청 상세에서
 * 삭제 상태와 관리자 사유를 확인할 수 있고, 상태 변경 알림도 어떤 Challenge를
 * 가리키는지 유지할 수 있습니다.
 *
 * 일반 사용자는 호출할 수 없고 ADMIN만 진행 중인 APPROVED Challenge를 삭제할
 * 수 있습니다. 삭제 사유는 사용자 안내와 감사 기록에 필요하므로 필수입니다.
 */
/**
 * @openapi
 * /challenges/{id}:
 *   delete:
 *     summary: 진행 중인 챌린지 삭제
 *     description: |
 *       ADMIN이 진행 중인 APPROVED 챌린지를 soft delete합니다.
 *       Challenge row를 실제로 지우지 않고 DELETED 상태, deletedAt, reason을
 *       저장하여 신청자 상세와 이력에서 삭제 상태 및 사유를 조회할 수 있습니다.
 *
 *       Challenge 상태 변경과 신청자에게 보내는 삭제 사유 알림은 같은
 *       transaction에서 처리합니다. 이미 마감·거절·삭제된 Challenge에는
 *       적용할 수 없습니다.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 100
 *           example:
 *             reason: 원문 링크가 더 이상 유효하지 않습니다.
 *     responses:
 *       200:
 *         description: 삭제 성공
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
 *         description: 삭제 사유 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 관리자 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 챌린지를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: 진행 중인 챌린지가 아님
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

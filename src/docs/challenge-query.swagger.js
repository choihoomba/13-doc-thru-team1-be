/**
 * @openapi
 * /challenges:
 *   get:
 *     summary: 챌린지 목록 조회
 *     description: |
 *       `view` 쿼리를 이용해 다음 네 가지 챌린지 목록을 조회합니다.
 *
 *       - `public`: 전체 공개 챌린지 목록
 *       - `participating`: 내가 참여 중인 챌린지 목록
 *       - `completed`: 내가 완료한 챌린지 목록
 *       - `admin`: 관리자 챌린지 신청 관리 목록
 *
 *       제목 검색, 분야, 문서 유형, 상태, 정렬, 페이지네이션을 지원합니다.
 *
 *       ### public
 *       - APPROVED 또는 CLOSED 상태만 조회합니다.
 *       - 삭제된 챌린지는 제외합니다.
 *       - status를 생략하면 APPROVED와 CLOSED를 모두 조회합니다.
 *
 *       ### participating
 *       - 로그인 사용자의 ACTIVE 참여 기록이 있는 챌린지를 조회합니다.
 *       - APPROVED 상태이면서 마감일이 지나지 않은 챌린지만 조회합니다.
 *       - 삭제된 챌린지는 제외합니다.
 *       - status 쿼리를 사용할 수 없습니다.
 *
 *       ### completed
 *       - 로그인 사용자의 ACTIVE 참여 기록이 있는 챌린지를 조회합니다.
 *       - CLOSED 상태이거나 마감일이 지난 챌린지를 조회합니다.
 *       - 삭제된 챌린지는 제외합니다.
 *       - status 쿼리를 사용할 수 없습니다.
 *
 *       ### admin
 *       - ADMIN만 조회할 수 있습니다.
 *       - status를 전달하면 해당 상태만 조회합니다.
 *       - status를 생략하면 상태 필터 없이 전체 상태를 조회합니다.
 *
 *       모든 view는 `data.challenges`와 `data.pagination`으로 구성된
 *       동일한 응답 형식을 사용합니다.
 *
 *       목록 응답에는 상세 조회용 `content`, `originalUrl`과
 *       신청자 관계 정보인 `user` 객체가 포함되지 않습니다.
 *
 *     tags:
 *       - Challenges
 *
 *     security:
 *       - cookieAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: view
 *         required: false
 *         description: |
 *           조회할 목록 종류입니다.
 *           생략하면 `public`을 기본값으로 사용합니다.
 *         schema:
 *           type: string
 *           enum:
 *             - public
 *             - participating
 *             - completed
 *             - admin
 *           default: public
 *         example: public
 *
 *       - in: query
 *         name: search
 *         required: false
 *         description: |
 *           챌린지 제목 검색어입니다.
 *           제목에 검색어가 포함된 챌린지를 영문 대소문자 구분 없이 조회합니다.
 *         schema:
 *           type: string
 *           maxLength: 100
 *         example: router
 *
 *       - in: query
 *         name: field
 *         required: false
 *         description: 챌린지 분야 필터입니다.
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
 *         example: WEB
 *
 *       - in: query
 *         name: docType
 *         required: false
 *         description: 번역할 문서 유형 필터입니다.
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
 *         description: |
 *           챌린지 상태 필터입니다.
 *
 *           - public: APPROVED 또는 CLOSED만 사용 가능
 *           - participating: 사용 불가
 *           - completed: 사용 불가
 *           - admin: 모든 Challenge 상태 사용 가능
 *
 *           admin에서 status를 생략하면 상태 필터 없이 전체 상태를 조회합니다.
 *         schema:
 *           type: string
 *           enum:
 *             - PENDING
 *             - APPROVED
 *             - REJECTED
 *             - DELETED
 *             - CLOSED
 *         example: PENDING
 *
 *       - in: query
 *         name: sort
 *         required: false
 *         description: |
 *           목록 정렬 방법입니다.
 *
 *           - latest: 최신 생성 순
 *           - oldest: 오래된 생성 순
 *           - deadlineAsc: 마감일이 빠른 순
 *           - deadlineDesc: 마감일이 늦은 순
 *         schema:
 *           type: string
 *           enum:
 *             - latest
 *             - oldest
 *             - deadlineAsc
 *             - deadlineDesc
 *           default: latest
 *         example: latest
 *
 *       - in: query
 *         name: page
 *         required: false
 *         description: 조회할 페이지 번호입니다.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         description: 한 페이지에 조회할 챌린지 개수입니다.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         example: 10
 *
 *     responses:
 *       200:
 *         description: 챌린지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 요청 성공 여부
 *                   example: true
 *
 *                 data:
 *                   type: object
 *                   required:
 *                     - challenges
 *                     - pagination
 *                   properties:
 *                     challenges:
 *                       type: array
 *                       description: 조회 조건에 맞는 챌린지 목록
 *                       items:
 *                         type: object
 *                         required:
 *                           - id
 *                           - title
 *                           - field
 *                           - docType
 *                           - deadline
 *                           - maxParticipants
 *                           - currentParticipants
 *                           - status
 *                           - userId
 *                           - createdAt
 *                           - updatedAt
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: 챌린지 ID
 *                             example: 7
 *
 *                           title:
 *                             type: string
 *                             description: 챌린지 제목
 *                             example: Express Router 공식 문서 번역
 *
 *                           field:
 *                             type: string
 *                             description: 챌린지 분야
 *                             enum:
 *                               - NEXTJS
 *                               - REACT
 *                               - MODERNJS
 *                               - TYPESCRIPT
 *                               - API
 *                               - WEB
 *                               - CAREER
 *                             example: WEB
 *
 *                           docType:
 *                             type: string
 *                             description: 번역 문서 유형
 *                             enum:
 *                               - OFFICIAL
 *                               - BLOG
 *                               - BOOK
 *                               - ETC
 *                             example: OFFICIAL
 *
 *                           deadline:
 *                             type: string
 *                             format: date-time
 *                             description: 챌린지 마감 일시
 *                             example: '2026-12-20T23:59:59.000Z'
 *
 *                           maxParticipants:
 *                             type: integer
 *                             minimum: 1
 *                             description: 최대 참여 가능 인원
 *                             example: 8
 *
 *                           currentParticipants:
 *                             type: integer
 *                             minimum: 0
 *                             description: 현재 참여 인원
 *                             example: 3
 *
 *                           status:
 *                             type: string
 *                             description: 챌린지 상태
 *                             enum:
 *                               - PENDING
 *                               - APPROVED
 *                               - REJECTED
 *                               - DELETED
 *                               - CLOSED
 *                             example: APPROVED
 *
 *                           reason:
 *                             type: string
 *                             nullable: true
 *                             description: 거절 또는 삭제 사유
 *                             example: null
 *
 *                           deletedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: soft delete 처리 일시
 *                             example: null
 *
 *                           userId:
 *                             type: integer
 *                             description: 챌린지를 생성한 사용자 ID
 *                             example: 3
 *
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: 챌린지 생성 일시
 *                             example: '2026-07-20T09:00:00.000Z'
 *
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             description: 챌린지 마지막 수정 일시
 *                             example: '2026-07-20T09:00:00.000Z'
 *
 *                           participations:
 *                             type: array
 *                             description: |
 *                               현재 로그인 사용자의 ACTIVE 참여 기록입니다.
 *
 *                               `view=participating` 또는 `view=completed`인
 *                               경우에만 응답에 포함됩니다.
 *
 *                               public과 admin 응답에는 포함되지 않습니다.
 *                             items:
 *                               type: object
 *                               required:
 *                                 - id
 *                                 - status
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   description: 참여 기록 ID
 *                                   example: 12
 *
 *                                 status:
 *                                   type: string
 *                                   description: 참여 상태
 *                                   enum:
 *                                     - ACTIVE
 *                                     - DROPPED
 *                                     - REMOVED
 *                                   example: ACTIVE
 *
 *                                 submission:
 *                                   type: object
 *                                   nullable: true
 *                                   description: |
 *                                     참여 기록과 연결된 번역 작업물입니다.
 *                                     아직 작업물이 생성되지 않았다면 null일 수 있습니다.
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                       description: 번역 작업물 ID
 *                                       example: 30
 *
 *                                     isTopSubmission:
 *                                       type: boolean
 *                                       description: 최다 추천 작업물 여부
 *                                       example: false
 *
 *                                     createdAt:
 *                                       type: string
 *                                       format: date-time
 *                                       description: 번역 작업물 생성 일시
 *                                       example: '2026-07-20T09:30:00.000Z'
 *
 *                     pagination:
 *                       type: object
 *                       description: 페이지네이션 정보
 *                       required:
 *                         - page
 *                         - limit
 *                         - total
 *                         - totalPages
 *                       properties:
 *                         page:
 *                           type: integer
 *                           minimum: 1
 *                           description: 현재 페이지 번호
 *                           example: 1
 *
 *                         limit:
 *                           type: integer
 *                           minimum: 1
 *                           maximum: 100
 *                           description: 한 페이지에 조회하는 챌린지 개수
 *                           example: 10
 *
 *                         total:
 *                           type: integer
 *                           minimum: 0
 *                           description: 검색 및 필터 조건에 맞는 전체 챌린지 개수
 *                           example: 18
 *
 *                         totalPages:
 *                           type: integer
 *                           minimum: 0
 *                           description: 전체 페이지 개수
 *                           example: 2
 *
 *             examples:
 *               public:
 *                 summary: 전체 공개 챌린지 목록
 *                 value:
 *                   success: true
 *                   data:
 *                     challenges:
 *                       - id: 7
 *                         title: Express Router 공식 문서 번역
 *                         field: WEB
 *                         docType: OFFICIAL
 *                         deadline: '2026-12-20T23:59:59.000Z'
 *                         maxParticipants: 8
 *                         currentParticipants: 3
 *                         status: APPROVED
 *                         reason: null
 *                         deletedAt: null
 *                         userId: 3
 *                         createdAt: '2026-07-20T09:00:00.000Z'
 *                         updatedAt: '2026-07-20T09:00:00.000Z'
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 1
 *                       totalPages: 1
 *
 *               participating:
 *                 summary: 내가 참여 중인 챌린지 목록
 *                 value:
 *                   success: true
 *                   data:
 *                     challenges:
 *                       - id: 7
 *                         title: Express Router 공식 문서 번역
 *                         field: WEB
 *                         docType: OFFICIAL
 *                         deadline: '2026-12-20T23:59:59.000Z'
 *                         maxParticipants: 8
 *                         currentParticipants: 3
 *                         status: APPROVED
 *                         reason: null
 *                         deletedAt: null
 *                         userId: 3
 *                         createdAt: '2026-07-20T09:00:00.000Z'
 *                         updatedAt: '2026-07-20T09:00:00.000Z'
 *                         participations:
 *                           - id: 12
 *                             status: ACTIVE
 *                             submission:
 *                               id: 30
 *                               isTopSubmission: false
 *                               createdAt: '2026-07-20T09:30:00.000Z'
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 1
 *                       totalPages: 1
 *
 *               completed:
 *                 summary: 내가 완료한 챌린지 목록
 *                 value:
 *                   success: true
 *                   data:
 *                     challenges:
 *                       - id: 1
 *                         title: React Hooks Reference 번역
 *                         field: REACT
 *                         docType: OFFICIAL
 *                         deadline: '2026-05-15T23:59:59.000Z'
 *                         maxParticipants: 8
 *                         currentParticipants: 5
 *                         status: CLOSED
 *                         reason: null
 *                         deletedAt: null
 *                         userId: 2
 *                         createdAt: '2026-04-10T09:00:00.000Z'
 *                         updatedAt: '2026-05-16T00:00:00.000Z'
 *                         participations:
 *                           - id: 3
 *                             status: ACTIVE
 *                             submission:
 *                               id: 10
 *                               isTopSubmission: true
 *                               createdAt: '2026-05-10T10:00:00.000Z'
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 1
 *                       totalPages: 1
 *
 *               admin:
 *                 summary: 관리자 챌린지 신청 관리 목록
 *                 value:
 *                   success: true
 *                   data:
 *                     challenges:
 *                       - id: 18
 *                         title: HTTP Caching 개념
 *                         field: WEB
 *                         docType: OFFICIAL
 *                         deadline: '2026-09-20T23:59:59.000Z'
 *                         maxParticipants: 10
 *                         currentParticipants: 0
 *                         status: PENDING
 *                         reason: null
 *                         deletedAt: null
 *                         userId: 3
 *                         createdAt: '2026-07-14T08:00:00.000Z'
 *                         updatedAt: '2026-07-14T08:00:00.000Z'
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 5
 *                       totalPages: 1
 *
 *       400:
 *         description: |
 *           쿼리스트링 유효성 검사 실패
 *
 *           발생 예시:
 *
 *           - 지원하지 않는 view
 *           - 지원하지 않는 field 또는 docType
 *           - 지원하지 않는 status 또는 sort
 *           - public에서 PENDING, REJECTED, DELETED 상태 사용
 *           - participating 또는 completed에서 status 사용
 *           - page가 1 미만이거나 정수가 아님
 *           - limit이 1~100 범위를 벗어남
 *           - search가 100자를 초과함
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidStatusCombination:
 *                 summary: 참여·완료 목록에서 status 사용
 *                 value:
 *                   success: false
 *                   message: 참여 중/완료 목록에서는 status를 함께 사용할 수 없습니다.
 *                   code: VALIDATION_ERROR
 *
 *               invalidPublicStatus:
 *                 summary: 공개 목록에서 비공개 상태 사용
 *                 value:
 *                   success: false
 *                   message: 공개 목록의 status는 APPROVED 또는 CLOSED만 사용할 수 있습니다.
 *                   code: VALIDATION_ERROR
 *
 *       401:
 *         description: 로그인이 필요하거나 인증 정보가 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 로그인이 필요합니다.
 *               code: UNAUTHORIZED
 *
 *       403:
 *         description: |
 *           관리자 챌린지 신청 관리 목록에 대한 접근 권한이 없습니다.
 *
 *           ADMIN이 아닌 사용자가 `view=admin`을 요청하면 발생합니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 관리자 챌린지 신청 목록은 관리자만 조회할 수 있습니다.
 *               code: FORBIDDEN
 *
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

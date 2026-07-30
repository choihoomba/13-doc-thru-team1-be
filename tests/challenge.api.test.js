import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

let server;
let baseUrl;
const createdChallengeIds = [];

async function request(path, { cookie, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(cookie && { cookie }),
      ...(body && { 'content-type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  return { response, data };
}

async function signIn(email) {
  const { response, data } = await request('/auth/signin', {
    method: 'POST',
    body: {
      email,
      password: 'test1234!',
    },
  });

  assert.equal(response.status, 200);
  assert.equal(data.success, true);

  const accessToken = response.headers
    .get('set-cookie')
    ?.match(/accessToken=([^;]+)/)?.[1];
  assert.ok(accessToken);
  return `accessToken=${accessToken}`;
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (createdChallengeIds.length > 0) {
    await prisma.$transaction([
      prisma.notification.deleteMany({
        where: {
          targetType: 'CHALLENGE',
          targetId: { in: createdChallengeIds },
        },
      }),
      prisma.challenge.deleteMany({
        where: {
          id: { in: createdChallengeIds },
        },
      }),
    ]);
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await prisma.$disconnect();
});

test('챌린지 목록·상세·신청 관리·알림 통합 흐름', async () => {
  const userCookie = await signIn('jihoon@docsru.dev');

  const publicList = await request('/challenges?view=public&page=1&limit=3', {
    cookie: userCookie,
  });
  assert.equal(publicList.response.status, 200);
  assert.equal(publicList.data.success, true);
  assert.equal(publicList.data.data.challenges.length <= 3, true);
  assert.equal(typeof publicList.data.data.pagination.hasNext, 'boolean');

  const detail = await request('/challenges/12', { cookie: userCookie });
  assert.equal(detail.response.status, 200);
  assert.equal(detail.data.data.id, 12);
  assert.equal(typeof detail.data.data.viewer.canParticipate, 'boolean');

  const closedDetail = await request('/challenges/1', {
    cookie: userCookie,
  });
  assert.equal(closedDetail.response.status, 200);
  assert.equal(closedDetail.data.data.status, 'CLOSED');
  assert.equal(Array.isArray(closedDetail.data.data.topSubmissions), true);

  const fullDetail = await request('/challenges/10', {
    cookie: userCookie,
  });
  assert.equal(fullDetail.response.status, 200);
  assert.equal(
    fullDetail.data.data.currentParticipants,
    fullDetail.data.data.maxParticipants
  );
  assert.equal(fullDetail.data.data.viewer.canParticipate, false);

  const title = `Codex Challenge API Test ${Date.now()}`;
  const tooEarlyDeadline = await request('/challenges', {
    cookie: userCookie,
    method: 'POST',
    body: {
      title: `${title} Too Early`,
      field: 'API',
      docType: 'OFFICIAL',
      content: '최소 7일 마감일 검증용 요청입니다.',
      originalUrl: 'https://example.com/challenge-too-early-test',
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      maxParticipants: 5,
    },
  });
  assert.equal(tooEarlyDeadline.response.status, 400);

  const created = await request('/challenges', {
    cookie: userCookie,
    method: 'POST',
    body: {
      title,
      field: 'API',
      docType: 'OFFICIAL',
      content: '통합 테스트가 생성하고 정리하는 챌린지입니다.',
      originalUrl: 'https://example.com/challenge-api-test',
      deadline: '2027-12-31T23:59:59.000Z',
      maxParticipants: 5,
    },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.data.data.status, 'PENDING');
  createdChallengeIds.push(created.data.data.id);

  const cancelCandidate = await request('/challenges', {
    cookie: userCookie,
    method: 'POST',
    body: {
      title: `${title} Cancel`,
      field: 'WEB',
      docType: 'ETC',
      content: '신청 취소 통합 테스트 데이터입니다.',
      originalUrl: 'https://example.com/challenge-cancel-test',
      deadline: '2027-12-31T23:59:59.000Z',
      maxParticipants: 3,
    },
  });
  assert.equal(cancelCandidate.response.status, 201);
  createdChallengeIds.push(cancelCandidate.data.data.id);

  const canceled = await request(
    `/challenges/${cancelCandidate.data.data.id}`,
    {
      cookie: userCookie,
      method: 'PATCH',
      body: { action: 'CANCEL' },
    }
  );
  assert.equal(canceled.response.status, 200);
  assert.equal(canceled.data.data.id, cancelCandidate.data.data.id);

  const forbiddenAdminList = await request('/challenges?view=admin', {
    cookie: userCookie,
  });
  assert.equal(forbiddenAdminList.response.status, 403);

  const forbiddenUpdate = await request('/challenges/12', {
    cookie: userCookie,
    method: 'PATCH',
    body: {
      maxParticipants: 10,
      reason: '일반 사용자 권한 확인입니다.',
    },
  });
  assert.equal(forbiddenUpdate.response.status, 403);

  const adminCookie = await signIn('admin@docsru.dev');
  const pendingList = await request(
    `/challenges?view=admin&search=${encodeURIComponent(title)}`,
    { cookie: adminCookie }
  );
  assert.equal(pendingList.response.status, 200);
  assert.equal(pendingList.data.data.challenges[0].id, created.data.data.id);
  assert.equal(
    'user' in pendingList.data.data.challenges[0],
    false,
    '관리자 신청 목록에 신청자 User relation이 노출되면 안 됩니다.'
  );

  const pendingDetail = await request(`/challenges/${created.data.data.id}`, {
    cookie: adminCookie,
  });
  assert.equal(pendingDetail.response.status, 200);
  assert.equal(
    'user' in pendingDetail.data.data,
    false,
    '관리자 신청 상세에 신청자 User relation이 노출되면 안 됩니다.'
  );

  const approved = await request(`/challenges/${created.data.data.id}`, {
    cookie: adminCookie,
    method: 'PATCH',
    body: { status: 'APPROVED' },
  });
  assert.equal(approved.response.status, 200);
  assert.equal(approved.data.data.status, 'APPROVED');

  const mixedPatch = await request(`/challenges/${created.data.data.id}`, {
    cookie: adminCookie,
    method: 'PATCH',
    body: {
      status: 'REJECTED',
      title: '상태와 정보를 동시에 바꿀 수 없습니다.',
      reason: 'PATCH 충돌 검증입니다.',
    },
  });
  assert.equal(mixedPatch.response.status, 400);

  const updated = await request(`/challenges/${created.data.data.id}`, {
    cookie: adminCookie,
    method: 'PATCH',
    body: {
      maxParticipants: 7,
      reason: '통합 테스트 수정입니다.',
    },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.data.data.maxParticipants, 7);

  const deleted = await request(`/challenges/${created.data.data.id}`, {
    cookie: adminCookie,
    method: 'DELETE',
    body: {
      reason: '통합 테스트 정리입니다.',
    },
  });
  assert.equal(deleted.response.status, 200);
  assert.equal(deleted.data.data.status, 'DELETED');

  const appliedDetail = await request(`/challenges/${created.data.data.id}`, {
    cookie: userCookie,
  });
  assert.equal(appliedDetail.response.status, 200);
  assert.equal(appliedDetail.data.data.reason, '통합 테스트 정리입니다.');

  const rejectCandidate = await request('/challenges', {
    cookie: userCookie,
    method: 'POST',
    body: {
      title: `${title} Reject`,
      field: 'TYPESCRIPT',
      docType: 'BLOG',
      content: '거절 통합 테스트 데이터입니다.',
      originalUrl: 'https://example.com/challenge-reject-test',
      deadline: '2027-12-31T23:59:59.000Z',
      maxParticipants: 4,
    },
  });
  assert.equal(rejectCandidate.response.status, 201);
  createdChallengeIds.push(rejectCandidate.data.data.id);

  const rejected = await request(
    `/challenges/${rejectCandidate.data.data.id}`,
    {
      cookie: adminCookie,
      method: 'PATCH',
      body: {
        status: 'REJECTED',
        reason: '통합 테스트 거절 사유입니다.',
      },
    }
  );
  assert.equal(rejected.response.status, 200);
  assert.equal(rejected.data.data.status, 'REJECTED');

  const allAdminApplications = await request(
    `/challenges?view=admin&search=${encodeURIComponent(title)}`,
    { cookie: adminCookie }
  );
  assert.equal(allAdminApplications.response.status, 200);
  assert.deepEqual(
    new Set(
      allAdminApplications.data.data.challenges.map(
        (challenge) => challenge.status
      )
    ),
    new Set(['DELETED', 'REJECTED'])
  );

  const appliedList = await request(
    `/challenges?view=applied&search=${encodeURIComponent(title)}`,
    { cookie: userCookie }
  );
  assert.equal(appliedList.response.status, 200);
  assert.deepEqual(
    new Set(
      appliedList.data.data.challenges.map((challenge) => challenge.status)
    ),
    new Set(['DELETED', 'REJECTED'])
  );

  const notifications = await request('/notifications', {
    cookie: userCookie,
  });
  assert.equal(notifications.response.status, 200);
  const challengeNotifications = notifications.data.data.filter(
    (notification) => notification.targetId === created.data.data.id
  );
  assert.deepEqual(
    new Set(challengeNotifications.map((notification) => notification.type)),
    new Set(['STATUS_CHANGED', 'CONTENT_CHANGED'])
  );

  const unreadNotification = challengeNotifications.find(
    (notification) => !notification.isRead
  );
  assert.ok(unreadNotification);
  const readNotification = await request(
    `/notifications/${unreadNotification.id}/read`,
    {
      cookie: userCookie,
      method: 'PATCH',
    }
  );
  assert.equal(readNotification.response.status, 200);
  assert.equal(readNotification.data.data.isRead, true);
});

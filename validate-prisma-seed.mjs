import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(root, 'prisma', 'data');
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(dataDirectory, `${name}.json`), 'utf8'));
const data = Object.fromEntries(
  [
    'users',
    'challenges',
    'participations',
    'submissions',
    'drafts',
    'feedbacks',
    'likes',
    'notifications',
  ].map((name) => [name, read(name)])
);
const errors = [];

// Prisma의 scalar 필드를 JSON 표현에 맞춰 검사한다. DateTime은 JSON에서
// ISO 8601 문자열이고, nullable 필드는 `?` 접미사로 표시한다.
const fieldChecks = {
  positiveInteger: (value) => Number.isInteger(value) && value > 0,
  nonNegativeInteger: (value) => Number.isInteger(value) && value >= 0,
  string: (value) => typeof value === 'string',
  boolean: (value) => typeof value === 'boolean',
  dateTime: (value) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)),
  email: (value) =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value) => {
    if (typeof value !== 'string') return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },
};

const rowSchemas = {
  users: {
    id: 'positiveInteger',
    email: 'email',
    nickname: 'string',
    password: 'string',
    role: 'string',
    grade: 'string',
    topLikedCount: 'nonNegativeInteger',
    refreshToken: 'string?',
    createdAt: 'dateTime',
    updatedAt: 'dateTime',
  },
  challenges: {
    id: 'positiveInteger',
    title: 'string',
    field: 'string',
    docType: 'string',
    content: 'string',
    originalUrl: 'url',
    deadline: 'dateTime',
    maxParticipants: 'positiveInteger',
    currentParticipants: 'nonNegativeInteger',
    status: 'string',
    reason: 'string?',
    deletedAt: 'dateTime?',
    createdAt: 'dateTime',
    updatedAt: 'dateTime',
    userId: 'positiveInteger',
  },
  participations: {
    id: 'positiveInteger',
    status: 'string',
    createdAt: 'dateTime',
    updatedAt: 'dateTime',
    userId: 'positiveInteger',
    challengeId: 'positiveInteger',
  },
  submissions: {
    id: 'positiveInteger',
    content: 'string',
    deletedAt: 'dateTime?',
    isTopSubmission: 'boolean',
    createdAt: 'dateTime',
    updatedAt: 'dateTime',
    participationId: 'positiveInteger',
    challengeId: 'positiveInteger',
    userId: 'positiveInteger',
  },
  drafts: {
    id: 'positiveInteger',
    title: 'string?',
    content: 'string',
    createdAt: 'dateTime',
    updatedAt: 'dateTime',
    submissionId: 'positiveInteger',
    userId: 'positiveInteger',
  },
  feedbacks: {
    id: 'positiveInteger',
    content: 'string',
    createdAt: 'dateTime',
    updatedAt: 'dateTime',
    submissionId: 'positiveInteger',
    userId: 'positiveInteger',
  },
  likes: {
    id: 'positiveInteger',
    createdAt: 'dateTime',
    userId: 'positiveInteger',
    submissionId: 'positiveInteger',
  },
  notifications: {
    id: 'positiveInteger',
    type: 'string',
    targetType: 'string',
    targetId: 'positiveInteger',
    message: 'string',
    isRead: 'boolean',
    createdAt: 'dateTime',
    userId: 'positiveInteger',
  },
};

const validateShape = (name, rows, schema) => {
  if (!Array.isArray(rows)) {
    errors.push(`${name}: top-level value must be an array`);
    return;
  }

  rows.forEach((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      errors.push(`${name}[${index}]: row must be an object`);
      return;
    }

    const expectedFields = new Set(Object.keys(schema));
    for (const field of Object.keys(row)) {
      if (!expectedFields.has(field))
        errors.push(`${name}[${index}]: unexpected field ${field}`);
    }

    for (const [field, rawType] of Object.entries(schema)) {
      const nullable = rawType.endsWith('?');
      const type = nullable ? rawType.slice(0, -1) : rawType;
      if (!(field in row)) {
        errors.push(`${name}[${index}]: missing field ${field}`);
      } else if (
        row[field] === null ? !nullable : !fieldChecks[type](row[field])
      ) {
        errors.push(`${name}[${index}].${field}: expected ${rawType}`);
      }
    }
  });
};

for (const [name, schema] of Object.entries(rowSchemas)) {
  validateShape(name, data[name], schema);
}

const byId = (rows) => new Map(rows.map((row) => [row.id, row]));
const unique = (name, rows, keyOf = ({ id }) => id) => {
  const keys = rows.map(keyOf);
  if (new Set(keys).size !== keys.length) errors.push(`${name}: duplicate key`);
};
const requireEnum = (name, value, allowed) => {
  if (!allowed.includes(value)) errors.push(`${name}: invalid enum ${value}`);
};

const users = byId(data.users);
const challenges = byId(data.challenges);
const participations = byId(data.participations);
const submissions = byId(data.submissions);
const feedbacks = byId(data.feedbacks);

for (const [name, rows] of Object.entries(data)) {
  if (Array.isArray(rows)) unique(name, rows);
}
unique('User.email', data.users, ({ email }) => email);
unique(
  'Participation.userId+challengeId',
  data.participations,
  (row) => `${row.userId}:${row.challengeId}`
);
unique(
  'Submission.participationId',
  data.submissions,
  ({ participationId }) => participationId
);
unique('Draft.submissionId', data.drafts, ({ submissionId }) => submissionId);
unique(
  'Like.userId+submissionId',
  data.likes,
  (row) => `${row.userId}:${row.submissionId}`
);

for (const user of data.users) {
  requireEnum(`User ${user.id}.role`, user.role, ['ADMIN', 'USER']);
  requireEnum(`User ${user.id}.grade`, user.grade, ['GENERAL', 'EXPERT']);
  const participationCount = data.participations.filter(
    (row) => row.userId === user.id
  ).length;
  const expert =
    (participationCount >= 5 && user.topLikedCount >= 5) ||
    participationCount >= 10 ||
    user.topLikedCount >= 10;
  const expected =
    user.role === 'ADMIN' ? 'GENERAL' : expert ? 'EXPERT' : 'GENERAL';
  if (user.grade !== expected)
    errors.push(`User ${user.id}: grade/cache mismatch`);
}

for (const challenge of data.challenges) {
  requireEnum(`Challenge ${challenge.id}.status`, challenge.status, [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'DELETED',
    'CLOSED',
  ]);
  requireEnum(`Challenge ${challenge.id}.field`, challenge.field, [
    'NEXTJS',
    'REACT',
    'MODERNJS',
    'TYPESCRIPT',
    'API',
    'WEB',
    'CAREER',
  ]);
  requireEnum(`Challenge ${challenge.id}.docType`, challenge.docType, [
    'OFFICIAL',
    'BLOG',
    'BOOK',
    'ETC',
  ]);
  if (!users.has(challenge.userId))
    errors.push(`Challenge ${challenge.id}: missing owner`);
  const active = data.participations.filter(
    (row) => row.challengeId === challenge.id && row.status === 'ACTIVE'
  ).length;
  if (challenge.currentParticipants !== active)
    errors.push(`Challenge ${challenge.id}: currentParticipants mismatch`);
  if (active > challenge.maxParticipants)
    errors.push(`Challenge ${challenge.id}: capacity exceeded`);
  if (['REJECTED', 'DELETED'].includes(challenge.status) && !challenge.reason) {
    errors.push(`Challenge ${challenge.id}: missing rejection/deletion reason`);
  }
}

for (const row of data.participations) {
  requireEnum(`Participation ${row.id}.status`, row.status, [
    'ACTIVE',
    'DROPPED',
    'REMOVED',
  ]);
  if (!users.has(row.userId) || !challenges.has(row.challengeId)) {
    errors.push(`Participation ${row.id}: broken relation`);
  }
}

for (const submission of data.submissions) {
  const participation = participations.get(submission.participationId);
  if (!participation) {
    errors.push(`Submission ${submission.id}: missing participation`);
    continue;
  }
  const challenge = challenges.get(participation.challengeId);
  if (submission.challengeId !== participation.challengeId) {
    errors.push(`Submission ${submission.id}: challengeId mismatch`);
  }
  if (submission.userId !== participation.userId) {
    errors.push(`Submission ${submission.id}: userId mismatch`);
  }
  if (
    submission.content &&
    new Date(submission.updatedAt) > new Date(challenge.deadline)
  ) {
    errors.push(`Submission ${submission.id}: submitted after deadline`);
  }
}

for (const draft of data.drafts) {
  const submission = submissions.get(draft.submissionId);
  if (!submission || !users.has(draft.userId))
    errors.push(`Draft ${draft.id}: broken relation`);
  if (submission?.content)
    errors.push(`Draft ${draft.id}: linked submission is already final`);
  const participation =
    submission && participations.get(submission.participationId);
  if (participation && participation.userId !== draft.userId)
    errors.push(`Draft ${draft.id}: wrong owner`);
}

for (const feedback of data.feedbacks) {
  const submission = submissions.get(feedback.submissionId);
  if (!submission?.content || !users.has(feedback.userId))
    errors.push(`Feedback ${feedback.id}: invalid target/author`);
}

for (const like of data.likes) {
  const submission = submissions.get(like.submissionId);
  const participation =
    submission && participations.get(submission.participationId);
  if (!submission?.content || !users.has(like.userId))
    errors.push(`Like ${like.id}: invalid target/author`);
  if (participation?.userId === like.userId)
    errors.push(`Like ${like.id}: self-like`);
}

for (const challenge of data.challenges.filter(
  ({ status }) => status === 'CLOSED'
)) {
  const rows = data.submissions.filter((submission) => {
    const participation = participations.get(submission.participationId);
    return participation?.challengeId === challenge.id && submission.content;
  });
  const max = Math.max(
    ...rows.map(
      (row) => data.likes.filter((like) => like.submissionId === row.id).length
    )
  );
  for (const row of rows) {
    const count = data.likes.filter(
      (like) => like.submissionId === row.id
    ).length;
    if (row.isTopSubmission !== (count === max))
      errors.push(`Submission ${row.id}: top flag mismatch`);
  }
}

for (const user of data.users) {
  const topCount = data.submissions.filter((submission) => {
    if (!submission.isTopSubmission) return false;
    const participation = participations.get(submission.participationId);
    return participation?.userId === user.id;
  }).length;
  if (user.topLikedCount !== topCount)
    errors.push(`User ${user.id}: topLikedCount mismatch`);
}

for (const notification of data.notifications) {
  requireEnum(`Notification ${notification.id}.type`, notification.type, [
    'CONTENT_CHANGED',
    'STATUS_CHANGED',
    'NEW_SUBMISSION',
    'NEW_FEEDBACK',
    'DEADLINE',
  ]);
  requireEnum(
    `Notification ${notification.id}.targetType`,
    notification.targetType,
    ['CHALLENGE', 'SUBMISSION', 'FEEDBACK']
  );
  const target =
    notification.targetType === 'CHALLENGE'
      ? challenges
      : notification.targetType === 'SUBMISSION'
        ? submissions
        : feedbacks;
  if (!users.has(notification.userId) || !target.has(notification.targetId)) {
    errors.push(`Notification ${notification.id}: broken relation/target`);
  }
}

if (errors.length) {
  console.error('Prisma seed validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Prisma seed validation passed.');
  console.log(
    Object.fromEntries(
      Object.entries(data)
        .filter(([, rows]) => Array.isArray(rows))
        .map(([name, rows]) => [name, rows.length])
    )
  );
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const dataDirectory = path.resolve(process.cwd(), 'prisma', 'data');

// JSON에는 주석을 넣을 수 없으므로 파일별 설명과 관계는
// prisma/data/README.md에서 관리한다. 각 파일명은 Prisma 모델의 복수형이다.
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(dataDirectory, `${name}.json`), 'utf8'));

const data = {
  users: read('users'),
  challenges: read('challenges'),
  participations: read('participations'),
  submissions: read('submissions'),
  drafts: read('drafts'),
  feedbacks: read('feedbacks'),
  likes: read('likes'),
  notifications: read('notifications'),
};

const TEST_PASSWORD = 'test1234!';

const asDates = (rows, keys) =>
  rows.map((row) => {
    const copy = { ...row };

    for (const key of keys) {
      if (copy[key] !== null && copy[key] !== undefined) {
        copy[key] = new Date(copy[key]);
      }
    }

    return copy;
  });

async function main() {
  // JSON의 password 값은 자리표시자다.
  // 실제 DB에는 실행 시 생성한 bcrypt 해시를 저장한다.
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  const users = data.users.map((user) => ({
    ...user,
    password: hashedPassword,
  }));

  await prisma.$transaction(async (tx) => {
    // 외래키 자식부터 역순으로 비우고 부모부터 정순으로 생성한다.
    // 중간에 실패하면 전체 트랜잭션을 롤백한다.
    await tx.notification.deleteMany();
    await tx.like.deleteMany();
    await tx.feedback.deleteMany();
    await tx.draft.deleteMany();
    await tx.submission.deleteMany();
    await tx.participation.deleteMany();
    await tx.challenge.deleteMany();
    await tx.user.deleteMany();

    await tx.user.createMany({
      data: asDates(users, ['createdAt', 'updatedAt']),
    });

    await tx.challenge.createMany({
      data: asDates(data.challenges, [
        'deadline',
        'deletedAt',
        'createdAt',
        'updatedAt',
      ]),
    });

    await tx.participation.createMany({
      data: asDates(data.participations, ['createdAt', 'updatedAt']),
    });

    await tx.submission.createMany({
      data: asDates(data.submissions, ['deletedAt', 'createdAt', 'updatedAt']),
    });

    await tx.draft.createMany({
      data: asDates(data.drafts, ['createdAt', 'updatedAt']),
    });

    await tx.feedback.createMany({
      data: asDates(data.feedbacks, ['createdAt', 'updatedAt']),
    });

    await tx.like.createMany({
      data: asDates(data.likes, ['createdAt']),
    });

    await tx.notification.createMany({
      data: asDates(data.notifications, ['createdAt']),
    });

    // 명시적인 ID를 넣은 뒤 PostgreSQL sequence를 최대 ID로 보정한다.
    for (const table of [
      'User',
      'Challenge',
      'Participation',
      'Submission',
      'Draft',
      'Feedback',
      'Like',
      'Notification',
    ]) {
      await tx.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX(id), 1), true) FROM "${table}"`
      );
    }
  });

  console.log('Docsru seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

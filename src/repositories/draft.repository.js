import prisma from '../config/prisma.js';

// 작업물(Submission) 소유자 확인용 - draft 생성/삭제 권한 체크에 사용
export function findSubmissionOwner(submissionId) {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    select: { userId: true },
  });
}

export function createDraft({ submissionId, userId, title, content }) {
  return prisma.draft.upsert({
    where: { submissionId },
    create: { submissionId, userId, title, content },
    update: { title, content },
  });
}

export function deleteDraft(submissionId) {
  return prisma.draft.delete({
    where: { submissionId },
  });
}

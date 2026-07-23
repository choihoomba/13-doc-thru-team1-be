import * as challengeRepository from '../repositories/challenges.repository.js';

const SORT_MAP = {
  appliedAtAsc: { createdAt: 'asc' },
  appliedAtDesc: { createdAt: 'desc' },
  deadlineAsc: { deadline: 'asc' },
  deadlineDesc: { deadline: 'desc' },
};

export async function getApplicationList({
  status,
  keyword,
  field,
  docType,
  sort,
  page,
  pageSize,
}) {
  const where = {
    status,
    ...(status !== 'DELETED' && { deletedAt: null }),
    ...(keyword && { title: { contains: keyword, mode: 'insensitive' } }),
    ...(field && { field }),
    ...(docType && { docType }),
  };

  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const orderBy = SORT_MAP[sort];

  const { data, totalCount } =
    await challengeRepository.findApplicationsAndCount(
      where,
      skip,
      take,
      orderBy
    );

  return { page, pageSize, totalCount, data };
}

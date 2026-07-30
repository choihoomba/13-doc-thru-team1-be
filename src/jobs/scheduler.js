// jobs/scheduler.js
import cron from 'node-cron';
import { closeExpiredChallenges } from './deadline.job.js';

/**
 * 매일 자정(KST) 만료된 챌린지를 마감 처리합니다.
 *
 * KST로 명시하는 이유: 서버 배포 환경(Render)의 기본 타임존이 UTC라,
 * timezone 지정 없이 돌리면 KST 자정이 아니라 UTC 자정(KST 오전 9시)에
 * 실행되어 마감 최소 단위(day)가 KST 기준과 어긋나게 됩니다.
 */
export function registerCronJobs() {
  cron.schedule(
    '0 0 * * *',
    () => {
      closeExpiredChallenges();
    },
    {
      timezone: 'Asia/Seoul',
    }
  );
}

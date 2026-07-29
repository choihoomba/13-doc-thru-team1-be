import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

function errorHandler(err, req, res, next) {
  // 이미 응답이 전송되기 시작했다면 중복 응답을 막고 Express 기본 핸들러에 위임
  if (res.headersSent) {
    return next(err);
  }

  // 1) 우리가 만든 커스텀 에러 (NotFoundError 등)
  // instanceof로 "우리 에러"만 정확히 걸러낸다.
  // (statusCode 값만 검사하면 우연히 statusCode를 가진 외부 객체도 통과할 수 있음)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // 2) Zod 유효성 검사 실패
  // 상태코드는 400이지만 code는 VALIDATION_ERROR로 분리한다.
  // 서비스 로직의 BadRequest와 "스키마 검증 실패"를 응답만 보고 구분하기 위함.
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message ?? '입력값이 유효하지 않습니다.',
      code: 'VALIDATION_ERROR',
    });
  }

  // 3) Prisma의 알려진 요청 에러
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: 수정/삭제 대상 레코드가 없음 → 404
    // 메시지는 NotFoundError의 기본 메시지와 통일
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.',
        code: 'NOT_FOUND',
      });
    }
    // P2002: 고유(unique) 제약 위반, 중복 값 → 409
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 값입니다.',
        code: 'CONFLICT',
      });
    }
    // P2003: 외래 키 제약 위반 → 400 (잘못된 참조를 보낸 요청)
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: '잘못된 참조 값입니다.',
        code: 'BAD_REQUEST',
      });
    }

    // 그 외 알 수 없는 Prisma 에러는 서버 문제로 간주 → 500
    console.error('Prisma known request error:', err);
    return res.status(500).json({
      success: false,
      message: '데이터베이스 처리 중 오류가 발생했습니다.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }

  // 4) Prisma 쿼리 형식 오류 (KnownRequestError와는 별개의 클래스)
  // zod 검증이 없는 경로나 내부 로직 실수로 NaN, 잘못된 enum 값 등이
  // 쿼리에 들어간 경우. 원인이 대부분 잘못된 값이므로 400으로 응답한다.
  // err.message에는 쿼리 구조와 모델/필드명이 포함되므로 로그에만 남긴다.
  // 이 분기가 없으면 모든 에러가 500으로 떨어져 원인을 찾는데 어려움(문지기 추가 개념)
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('Prisma validation error:', err.message);
    return res.status(400).json({
      success: false,
      message: '요청 값이 올바르지 않습니다.',
      code: 'BAD_REQUEST',
    });
  }

  // 5) 위에서 걸리지 않은 예상 못 한 모든 에러 (최후의 보루)
  // 상세 원인은 서버 로그에만 남기고, 사용자에겐 일반 메시지만 노출 (보안)
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: '서버 에러가 발생했습니다.',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

export default errorHandler;

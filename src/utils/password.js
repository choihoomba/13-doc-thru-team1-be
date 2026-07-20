import bcrypt from 'bcrypt';

export const hashPassword = (plainPassword) => {
  // 두 번째 인자는 salt rounds(해싱 강도). 값이 1 오를 때마다 연산 시간이 2배가 됩니다.
  return bcrypt.hash(plainPassword, 10);
};

export const verifyPassword = (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

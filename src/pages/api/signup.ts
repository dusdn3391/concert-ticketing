// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function signup(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const { name, gender, email, nickname, birthday, phone, verifyCode } = req.body;

  // TODO: verifyCode 검증 로직 추가
  // TODO: DB 저장 처리 추가

  // 성공 응답 예시
  res.status(200).json({ message: '회원가입 성공' });
}

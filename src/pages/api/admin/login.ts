import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDB } from '../../../lib/db';

export default async function adminLogin(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { admin_id, password } = req.body;

  // 필수 필드 검증
  if (!admin_id || !password) {
    return res.status(400).json({ 
      message: '관리자 ID와 비밀번호를 입력해주세요.',
      required: ['admin_id', 'password']
    });
  }

  try {
    // 관리자 조회
    const admin = adminDB.findByAdminId(admin_id);
    
    if (!admin) {
      return res.status(401).json({ message: '관리자 정보를 찾을 수 없습니다.' });
    }

    // 실제 환경에서는 bcrypt 등으로 암호화된 비밀번호 비교 필요
    // 현재는 단순 비교 (개발용)
    if (admin.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 제외하고 응답
    const { password: _, ...adminResponse } = admin;
    
    return res.status(200).json({ 
      message: '로그인 성공',
      admin: adminResponse,
      // 실제 환경에서는 JWT 토큰 생성하여 반환
      token: `admin_token_${admin.id}_${Date.now()}` 
    });
  } catch (error) {
    console.error('관리자 로그인 오류:', error);
    return res.status(500).json({ message: '로그인 처리 중 오류가 발생했습니다.' });
  }
}
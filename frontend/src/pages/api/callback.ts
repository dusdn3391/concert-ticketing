import { NextApiRequest, NextApiResponse } from 'next';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  provider: 'kakao' | 'naver' | 'google';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state, error, token } = req.query;

  if (error) {
    return res.redirect('/login?error=oauth_error');
  }

  if (!token || typeof token !== 'string') {
    return res.redirect('/login?error=no_token');
  }

  try {
    const provider = state as string;
    let userInfo: UserInfo | null = null;

    switch (provider) {
      case 'kakao':
        userInfo = await getUserInfoFromToken('kakao', token);
        break;
      case 'naver':
        userInfo = await getUserInfoFromToken('naver', token);
        break;
      case 'google':
        userInfo = await getUserInfoFromToken('google', token);
        break;
      default:
        return res.redirect('/login?error=invalid_provider');
    }

    if (!userInfo) {
      return res.redirect('/login?error=user_info_failed');
    }

    const existingUser = await findUserById(userInfo.id);
    const isFirstSignup = !existingUser;

    if (isFirstSignup) {
      await createUser(userInfo);
    } else {
      await updateUser(userInfo);
    }

    const userParam = encodeURIComponent(
      JSON.stringify({
        name: userInfo.name,
        email: userInfo.email,
        profileImage: userInfo.profileImage,
        provider: userInfo.provider,
      }),
    );

    res.redirect(
      `/oauth/success?token=${token}&user=${userParam}&firstSignup=${isFirstSignup}`,
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/login?error=callback_failed');
  }
}

// 예시: 토큰으로 사용자 정보 가져오기 (실제 구현 필요)
async function getUserInfoFromToken(
  provider: string,
  token: string,
): Promise<UserInfo | null> {
  // 예시 구현: 실제로는 provider별 API 호출하거나 DB 조회 필요
  // 여기서는 임시로 null 반환
  return null;
}

// 데이터베이스 관련 함수들 (예시)
async function findUserById(id: string) {
  return null;
}
async function createUser(userInfo: UserInfo) {}
async function updateUser(userInfo: UserInfo) {}

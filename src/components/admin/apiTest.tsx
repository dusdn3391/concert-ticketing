import { useState } from 'react';
import { userService, concertService, adminService } from '@/services';
import { User, Concert } from '@/types';

export default function ApiTest() {
  const [users, setUsers] = useState<User[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 사용자 목록 테스트
  async function testGetUsers() {
    try {
      setIsLoading(true);
      setMessage('사용자 목록 조회 중...');

      const response = await userService.getList({
        page: 1,
        limit: 5,
      });

      if (response.success) {
        setUsers(response.data.data);
        setMessage(
          `✅ 사용자 ${response.data.total}명 중 ${response.data.data.length}명 조회 성공`,
        );
      }
    } catch (error) {
      setMessage(`❌ 사용자 조회 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  // 콘서트 목록 테스트
  async function testGetConcerts() {
    try {
      setIsLoading(true);
      setMessage('콘서트 목록 조회 중...');

      const response = await concertService.getList({
        page: 1,
        limit: 3,
      });

      if (response.success) {
        setConcerts(response.data.data);
        setMessage(
          `✅ 콘서트 ${response.data.total}개 중 ${response.data.data.length}개 조회 성공`,
        );
      }
    } catch (error) {
      setMessage(`❌ 콘서트 조회 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  // 관리자 통계 테스트
  async function testAdminStats() {
    try {
      setIsLoading(true);
      setMessage('관리자 통계 조회 중...');

      const response = await adminService.getStats();

      if (response.success) {
        setMessage(`✅ 관리자 통계 조회 성공: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      setMessage(`❌ 관리자 통계 조회 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>🧪 API Services 테스트</h2>

      {/* 테스트 버튼들 */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={testGetUsers} disabled={isLoading}>
          사용자 목록 테스트
        </button>
        <button onClick={testGetConcerts} disabled={isLoading}>
          콘서트 목록 테스트
        </button>
        <button onClick={testAdminStats} disabled={isLoading}>
          관리자 통계 테스트
        </button>
      </div>

      {/* 상태 메시지 */}
      <div
        style={{
          padding: '10px',
          backgroundColor: message.includes('❌') ? '#fee' : '#efe',
          color: message.includes('❌') ? '#d00' : '#080',
          border: '1px solid #ccc',
          marginBottom: '20px',
        }}
      >
        {isLoading ? '🔄 로딩 중...' : message || '테스트 버튼을 클릭해보세요'}
      </div>

      {/* 사용자 목록 결과 */}
      {users.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>👥 사용자 목록</h3>
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                {user.name} ({user.email}) - {user.state}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 콘서트 목록 결과 */}
      {concerts.length > 0 && (
        <div>
          <h3>🎭 콘서트 목록</h3>
          <ul>
            {concerts.map((concert) => (
              <li key={concert.id}>
                {concert.title} - {concert.location} ({concert.start_date} ~{' '}
                {concert.end_date})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

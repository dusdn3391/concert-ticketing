import React, { useEffect, useState } from 'react';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import Pagination from '@/components/user/common/Pagination';
import styles from './AdminTable.module.css';

type Manager = {
  adminId: string;
  phone: string;
  role: string;
  email: string;
  company: string;
  companyNumber: string;
  companyLocation: string;
  state: string;
};

const MANAGERS_PER_PAGE = 10;

export default function ManagerTable() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const page = currentPage - 1; // 서버는 0부터 시작하는 page index
        const size = MANAGERS_PER_PAGE;
        const response = await fetch(
          `http://localhost:8080/api/admin/concert?page=${page}&size=${size}`,
          {
            method: 'GET',
            headers: {
              Accept: '*/*',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          },
        );

        if (!response.ok) throw new Error('데이터를 불러오지 못했습니다.');

        const data = await response.json();
        setManagers(data.content); // Page 객체의 content만 추출
      } catch (error) {
        console.error('❌ 관리자 목록 로딩 실패:', error);
      }
    };

    fetchManagers();
  }, [currentPage]); // 페이지가 바뀔 때마다 호출

  const totalPages = Math.ceil(managers.length / MANAGERS_PER_PAGE);
  const startIndex = (currentPage - 1) * MANAGERS_PER_PAGE;
  const paginatedManagers = managers.slice(startIndex, startIndex + MANAGERS_PER_PAGE);
  const handleApprove = async (adminId: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/modify-state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          adminId,
          state: 'ACTIVE',
        }),
      });

      if (!response.ok) {
        throw new Error('승인 요청 실패');
      }

      // 승인 성공 시, 상태를 다시 불러오거나 로컬 상태 업데이트
      setManagers((prev) =>
        prev.map((manager) =>
          manager.adminId === adminId ? { ...manager, state: 'ACTIVE' } : manager,
        ),
      );
      alert('승인이 완료되었습니다.');
    } catch (error) {
      console.error('❌ 승인 실패:', error);
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <main className={styles.content}>
          <h2>콘서트 관리자 관리</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>회사명</th>
                <th>사업자번호</th>
                <th>회사 주소</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {paginatedManagers.map((manager) => (
                <tr key={manager.adminId}>
                  <td>{manager.adminId}</td>
                  <td>{manager.email}</td>
                  <td>{manager.phone}</td>
                  <td>{manager.company}</td>
                  <td>{manager.companyNumber}</td>
                  <td>{manager.companyLocation}</td>
                  <td>
                    {manager.state === 'INACTIVE' ? (
                      <button onClick={() => handleApprove(manager.adminId)}>승인</button>
                    ) : (
                      manager.state
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </main>
      </div>
    </div>
  );
}

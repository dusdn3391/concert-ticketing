import React, { useEffect, useState } from 'react';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import Pagination from '@/components/user/common/Pagination'; // ✅ 추가
import styles from './AdminTable.module.css';

type Manager = {
  id: number;
  name: string;
  email: string;
  assignedConcerts: string[];
};

const MANAGERS_PER_PAGE = 10;

export default function ManagerTable() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // 더미 데이터 예시 (25명 생성)
    const dummyManagers = Array.from({ length: 25 }, (_, i) => ({
      id: 100 + i,
      name: `관리자 ${i + 1}`,
      email: `manager${i + 1}@example.com`,
      assignedConcerts: [`콘서트 ${i + 1}`, `공연 ${i + 2}`],
    }));
    setManagers(dummyManagers);
  }, []);

  const totalPages = Math.ceil(managers.length / MANAGERS_PER_PAGE);
  const startIndex = (currentPage - 1) * MANAGERS_PER_PAGE;
  const paginatedManagers = managers.slice(startIndex, startIndex + MANAGERS_PER_PAGE);

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
                <th>이름</th>
                <th>이메일</th>
                <th>담당 콘서트</th>
              </tr>
            </thead>
            <tbody>
              {paginatedManagers.map((manager) => (
                <tr key={manager.id}>
                  <td>{manager.id}</td>
                  <td>{manager.name}</td>
                  <td>{manager.email}</td>
                  <td>{manager.assignedConcerts.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ 페이지네이션 추가 */}
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

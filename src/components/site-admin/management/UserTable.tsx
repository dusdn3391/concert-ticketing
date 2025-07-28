import React, { useEffect, useState } from 'react';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import Pagination from '@/components/user/common/Pagination'; // ✅ 추가
import styles from './UserTable.module.css'; // ✅ 오타 수정

type User = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
};

const USERS_PER_PAGE = 10;

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // 추후 API로 대체
    const dummyUsers = Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      name: `유저 ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i % 3 === 0 ? 'admin' : i % 2 === 0 ? 'manager' : 'user',
    }));
    setUsers(dummyUsers);
  }, []);

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, startIndex + USERS_PER_PAGE);

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <main className={styles.content}>
          <h2>유저 관리</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>이메일</th>
                <th>역할</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
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

import { useState } from "react";
import ConcertCard from "@/pages/concert/concert-list/index";
import Pagination from "@/pages/components/Pagination";
import styles from "@/styles/concert/Concert.module.css";

type Concert = {
  id: number;
  title: string;
  singer: string;
  date: string;
};

const mockData: Concert[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `title title title ${i + 1}`,
  singer: `singer ${i + 1}`,
  date: `2025-05-${(30 - (i % 30)).toString().padStart(2, "0")}`, // 날짜 다양하게
}));

export default function ConcertPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("latest");
  const perPage = 9;

  const sortedData = [...mockData].sort((a, b) => {
    if (sortOption === "latest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime(); // 최신순
    } else {
      return a.id - b.id; // 인기순 (id 기준)
    }
  });

  const totalPages = Math.ceil(sortedData.length / perPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1); // 페이지 초기화
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>콘서트</h1>
      <div className={styles.sortWrapper}>
        <select
          className={styles.sortSelect}
          value={sortOption}
          onChange={handleSortChange}
          aria-label="정렬 방식 선택"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>
      <div className={styles.list}>
        {currentData.map((concert) => {
          return (
            <ConcertCard
              key={concert.id}
              id={concert.id}
              title={concert.title}
              singer={concert.singer}
              date={concert.date}
            />
          );
        })}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

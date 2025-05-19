// pages/concert/ConcertCard.tsx (또는 적절한 위치)

import Link from "next/link";
import styles from "@/styles/concert/Concert.module.css";

type ConcertCardProps = {
  id: number;
  title: string;
  singer: string;
  date: string;
};

export default function ConcertCard({
  id,
  title,
  singer,
  date,
}: ConcertCardProps) {
  return (
    <Link href={`/concert/${id}`} className={styles.card} onClick={() => {}}>
      <div className={styles.image}>image</div>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardSinger}>{singer}</div>
      <div className={styles.cardDate}>
        {date} ~ {date}
      </div>
    </Link>
  );
}

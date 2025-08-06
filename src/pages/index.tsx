import { useEffect, useState } from 'react';
import Image from 'next/image';

import styles from '@/styles/Home.module.css';
import ConcertCard from '@/components/user/concert/ConcertCard';

interface Slide {
  id: number;
  text: string;
  image: string;
}

const events = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `Event Title ${i + 1}`,
  date: `2024.0${i + 1} ~ 2024.1${i + 1}`,
  image: `/events/event-${i + 1}.png`,
}));

export default function HomePage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredEvent, setHoveredEvent] = useState(events[0]);
  const [page, setPage] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);

  // ✅ 슬라이드 데이터 API 호출
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/banners`, {
      headers: {
        Accept: '*/*',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('슬라이드 배너 데이터를 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then((data: any[]) => {
        const mapped = data.map((b) => ({
          id: b.id,
          text: b.title,
          image: b.imageUrl,
        }));
        setSlides(mapped);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoadingSlides(false);
      });
  }, []);

  // ✅ 슬라이드 자동 이동
  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  // ✅ 이벤트 자동 전환
  useEffect(() => {
    const eventInterval = setInterval(() => {
      setEventIndex((prev) => {
        const next = (prev + 1) % events.length;
        setHoveredEvent(events[next]);
        return next;
      });
    }, 3000);
    return () => clearInterval(eventInterval);
  }, []);

  const togglePlay = () => setIsPlaying((prev) => !prev);
  const startIdx = page * 5;
  const currentPageEvents = events.slice(startIdx, startIdx + 5);

  const concerts = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `콘서트 제목 ${i + 1}`,
    singer: `가수 ${i + 1}`,
    date: `2024.0${i + 1}`,
    image: '/concerts.png',
  }));

  const limitedConcerts = concerts.slice(0, 6);

  if (loadingSlides) {
    return <div>슬라이드를 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 슬라이드 섹션 */}
      <section className={styles.slider}>
        <div className={styles.sliderWrapper}>
          <div
            className={styles.sliderInner}
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {slides.map((slide) => (
              <div
                className={styles.slide}
                key={slide.id}
                style={{
                  backgroundImage: `url(${slide.image})`,
                }}
              >
                <div className={styles.slideText}>{slide.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.slideFooter}>
          <span>
            {currentSlide + 1} / {slides.length}
          </span>
          <button onClick={togglePlay} aria-label='슬라이드 재생/정지'>
            <Image
              src={isPlaying ? '/free-icon-video-stop-16252813.png' : '/play-button.png'}
              alt={isPlaying ? '정지' : '재생'}
              width={20}
              height={20}
            />
          </button>
        </div>
      </section>

      {/* 인기 이벤트 */}
      <section className={styles.events}>
        <h2>인기 이벤트</h2>
        <div className={styles.eventContent}>
          <div className={styles.eventLeft}>
            <h3>{hoveredEvent.title}</h3>
            <p>{hoveredEvent.date}</p>
          </div>
          <div className={styles.eventImage}>
            <Image
              src={hoveredEvent.image}
              alt={hoveredEvent.title}
              width={300}
              height={350}
            />
          </div>
          <div className={styles.eventList}>
            {currentPageEvents.map((event) => (
              <div
                key={event.id}
                className={styles.eventItem}
                onMouseEnter={() => setHoveredEvent(event)}
              >
                {event.title}
              </div>
            ))}
            <div className={styles.pageButtons}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label='이전 페이지'
              >
                <Image src='/Group 686leftarrow.png' alt='이전' width={12} height={12} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(1, p + 1))}
                aria-label='다음 페이지'
              >
                <Image src='/Group 687rightarrow.png' alt='다음' width={12} height={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 콘서트 */}
      <section className={styles.concerts}>
        <h2>콘서트</h2>
        <div className={styles.concertGrid}>
          {limitedConcerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      </section>
    </div>
  );
}

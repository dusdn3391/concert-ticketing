import { useEffect, useState } from 'react';
import Image from 'next/image';

import styles from '@/styles/Home.module.css';

import ConcertCard from '@/components/user/concert/ConcertCard';

const slides = [
  { id: 1, text: 'Slide 1', image: '/slides/slide-1.png' },
  { id: 2, text: 'Slide 2', image: '/slides/slide-2.png' },
  { id: 3, text: 'Slide 3', image: '/slides/slide-3.png' },
  { id: 4, text: 'Slide 4', image: '/slides/slide-4.png' },
  { id: 5, text: 'Slide 5', image: '/slides/slide-5.png' },
  { id: 6, text: 'Slide 6', image: '/slides/slide-6.png' },
];

const events = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `Event Title ${i + 1}`,
  date: `2024.0${i + 1} ~ 2024.1${i + 1}`,
  image: `/events/event-${i + 1}.png`,
}));

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredEvent, setHoveredEvent] = useState(events[0]);
  const [page, setPage] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);

  useEffect(() => {
    console.log('=== 환경변수 디버깅 ===');
    console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // 모든 NEXT_PUBLIC_ 환경변수 확인
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        console.log(`${key}:`, process.env[key]);
      }
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const eventInterval = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % events.length);
      setHoveredEvent(events[(eventIndex + 1) % events.length]);
    }, 3000);
    return () => clearInterval(eventInterval);
  }, [eventIndex]);

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

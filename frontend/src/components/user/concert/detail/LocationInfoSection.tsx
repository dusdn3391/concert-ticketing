// components/user/concert/LocationInfoSection.tsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './ConcertDetail.module.css';

declare global {
  interface Window {
    kakao: any;
  }
}

type Props = {
  address: string;
  lat: number | null | undefined;
  lng: number | null | undefined;
};

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY as string;

function useKakaoLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 이미 로드됨
    if (window.kakao?.maps) {
      setLoaded(true);
      return;
    }

    const scriptId = 'kakao-map-sdk';
    if (document.getElementById(scriptId)) {
      const check = setInterval(() => {
        if (window.kakao?.maps) {
          clearInterval(check);
          setLoaded(true);
        }
      }, 50);
      return () => clearInterval(check);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`;
    script.onload = () => {
      window.kakao.maps.load(() => setLoaded(true));
    };
    script.onerror = () => {
      console.error('Kakao map SDK load failed');
    };
    document.head.appendChild(script);
  }, []);

  return loaded;
}

export default function LocationInfoSection({ address, lat, lng }: Props) {
  const loaded = useKakaoLoader();
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const kakao = window.kakao;
    const defaultCenter = new kakao.maps.LatLng(37.5665, 126.978); // 서울시청 근처

    const map = new kakao.maps.Map(mapRef.current, {
      center: defaultCenter,
      level: 4,
    });

    const placeMarker = (position: any, title?: string) => {
      map.setCenter(position);
      const marker = new kakao.maps.Marker({ position });
      marker.setMap(map);

      if (title) {
        const iw = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 8px;">${title}</div>`,
        });
        iw.open(map, marker);
      }
    };

    // 1) 좌표가 있으면 그대로 사용
    if (lat && lng) {
      const pos = new kakao.maps.LatLng(lat, lng);
      placeMarker(pos, address);
      return;
    }

    if (address) {
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (results: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK && results.length > 0) {
          const r = results[0];
          const pos = new kakao.maps.LatLng(Number(r.y), Number(r.x));
          placeMarker(pos, address);
        } else {
          setError('주소를 좌표로 변환하지 못했습니다.');
        }
      });
    } else {
      setError('주소 정보가 없습니다.');
    }
  }, [loaded, address, lat, lng]);

  return (
    <div className={styles.locationWrap}>
      <div className={styles.mapWrap}>
        <div className={styles.address}>
          <strong>주소</strong> {address || '-'}
        </div>
      </div>

      <div
        ref={mapRef}
        className={styles.map}
        style={{
          width: '100%',
          height: 360,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
        }}
      />
    </div>
  );
}

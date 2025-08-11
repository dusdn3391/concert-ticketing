// PostcodeModal.tsx - 주소만 선택하고 모달에서 바로 전달
import React, { useEffect, useRef } from 'react';

interface AddressData {
  address: string;
  addressName: string;
  bname: string;
  buildingName: string;
  jibunAddress: string;
  roadAddress: string;
  roadAddressEnglish: string;
  sido: string;
  sigungu: string;
  zonecode: string;
  addressType: string;
}

interface PostcodeModalProps {
  onAddressSelect: (data: AddressData) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    daum: any;
  }
}

const PostcodeModal: React.FC<PostcodeModalProps> = ({ onAddressSelect, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadScripts = async () => {
      console.log('🚀 Daum Postcode 스크립트 로딩 시작');

      // Daum 우편번호 서비스 로드
      const loadDaumPostcode = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          console.log('📮 Daum Postcode 로딩 시작');

          if (window.daum && window.daum.Postcode) {
            console.log('✅ Daum Postcode 이미 로드됨');
            resolve();
            return;
          }

          const script = document.createElement('script');
          script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
          script.onload = () => {
            console.log('✅ Daum Postcode 로드 성공');
            resolve();
          };
          script.onerror = (error) => {
            console.error('❌ Daum Postcode 로드 실패:', error);
            reject(new Error('Daum Postcode 로드 실패'));
          };
          document.head.appendChild(script);
        });
      };

      try {
        // Daum 우편번호 서비스 로드
        await loadDaumPostcode();

        // Daum 우편번호 서비스 초기화
        if (containerRef.current && window.daum && window.daum.Postcode) {
          console.log('🎯 Daum Postcode 초기화');

          new window.daum.Postcode({
            oncomplete: function (data: any) {
              console.log('📍 주소 선택됨:', data);

              // 주소 데이터를 부모 컴포넌트로 전달
              onAddressSelect(data);
            },
            width: '100%',
            height: '400px',
          }).embed(containerRef.current);
        } else {
          console.error('❌ Daum Postcode 초기화 실패');
        }
      } catch (error) {
        console.error('💥 스크립트 로드 중 치명적 오류:', error);
        alert('주소 검색 서비스를 로드하는데 실패했습니다. 페이지를 새로고침해주세요.');
      }
    };

    loadScripts();
  }, [onAddressSelect]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#000' }}>
            주소 검색
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '400px',
          }}
        />

        <div
          style={{
            padding: '15px',
            borderTop: '1px solid #eee',
            textAlign: 'right',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f5f5f5',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostcodeModal;

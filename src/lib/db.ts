/*
 * 임시 데이터베이스 모킹 파일
 * 실제 백엔드 서버 없이 개발할 때 사용
 * 실제 서버 환경에서는 이 파일을 사용하지 않고 API 호출을 사용
 */

import { User, Concert, ConcertSchedule, Admin } from './types';

/* 
 * ===== 임시 메모리 저장소 =====
 * 실제 서버 환경에서는 아래 데이터들이 실제 데이터베이스에 저장됨
 */
let users: User[] = [];
let concerts: Concert[] = [
  {
    id: 1,
    title: '뮤지컬 레미제라블',
    description: '빅토르 위고의 소설을 원작으로 한 대표적인 뮤지컬',
    location: '세종문화회관 대극장',
    location_X: 37.5721,
    location_y: 126.9765,
    start_date: new Date('2024-12-01'),
    end_date: new Date('2024-12-31'),
    rating: 5,
    admin_id: 1,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    title: '콘서트 윤종신',
    description: '윤종신 전국투어 콘서트',
    location: '올림픽공원 체조경기장',
    location_X: 37.5195,
    location_y: 127.1243,
    start_date: new Date('2024-11-15'),
    end_date: new Date('2024-11-17'),
    rating: 4,
    admin_id: 1,
    created_at: new Date(),
    updated_at: new Date()
  }
];

let concertSchedules: ConcertSchedule[] = [
  {
    id: 1,
    concert_id: 1,
    start_time: new Date('2024-12-01T19:30:00'),
    end_time: new Date('2024-12-01T22:00:00'),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    concert_id: 1,
    start_time: new Date('2024-12-02T14:00:00'),
    end_time: new Date('2024-12-02T16:30:00'),
    created_at: new Date(),
    updated_at: new Date()
  }
];

let admins: Admin[] = [
  {
    id: 1,
    admin_id: 'admin1',
    password: 'hashedpassword',
    phone: '010-1234-5678',
    role: 'SUPER_ADMIN',
    email: 'admin@concert.com',
    company: '콘서트컴퍼니',
    company_number: '123-45-67890',
    company_location: '서울시 강남구',
    state: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date()
  },
  // 테스트용 관리자 계정
  {
    id: 2,
    admin_id: 'admin',
    password: '1234',
    phone: '010-0000-0000',
    role: 'ADMIN',
    email: 'test@concert.com',
    company: '테스트컴퍼니',
    company_number: '000-00-00000',
    company_location: '서울시 테스트구',
    state: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date()
  }
];

/* 
 * ===== 데이터베이스 함수들 =====
 * 실제 서버 환경에서는 이 함수들 대신 API 호출을 사용
 */

// 사용자 관련 DB 함수들 (개발용)
export const userDB = {
  findByEmail: (email: string): User | undefined => {
    return users.find(user => user.email === email);
  },
  
  findById: (id: number): User | undefined => {
    return users.find(user => user.id === id);
  },
  
  create: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User => {
    const newUser: User = {
      ...userData,
      id: users.length + 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    users.push(newUser);
    return newUser;
  }
};

// 콘서트 관련 DB 함수들 (개발용)
export const concertDB = {
  findAll: (): Concert[] => {
    return concerts.filter(concert => !concert.deleted_at);
  },
  
  findById: (id: number): Concert | undefined => {
    return concerts.find(concert => concert.id === id && !concert.deleted_at);
  },

  // 상세 정보 포함한 조회 (스케줄, 통계 등)
  findByIdWithDetails: (id: number) => {
    const concert = concerts.find(concert => concert.id === id && !concert.deleted_at);
    if (!concert) return null;

    // 해당 콘서트의 일정 조회
    const schedules = concertSchedules.filter(schedule => 
      schedule.concert_id === id && !schedule.deleted_at
    );

    // 상세 정보 구성
    return {
      ...concert,
      schedules: schedules.map(schedule => ({
        ...schedule,
        cast_assignments: [],
        seat_count: 100,
        available_seats: 85,
        reserved_seats: 15,
        revenue: 1500000
      })),
      total_seats: schedules.length * 100,
      total_revenue: schedules.length * 1500000,
      reservation_count: schedules.length * 15,
      average_rating: concert.rating,
      review_count: 12,
      zones: [
        {
          id: "zone1",
          name: "VIP석",
          svgElementId: "vip-section",
          seatCount: 50,
          priceRange: { min: 150000, max: 200000 }
        },
        {
          id: "zone2", 
          name: "R석",
          svgElementId: "r-section",
          seatCount: 30,
          priceRange: { min: 100000, max: 120000 }
        },
        {
          id: "zone3",
          name: "S석", 
          svgElementId: "s-section",
          seatCount: 20,
          priceRange: { min: 80000, max: 90000 }
        }
      ]
    };
  },
  
  create: (concertData: Omit<Concert, 'id' | 'created_at' | 'updated_at'>): Concert => {
    const newConcert: Concert = {
      ...concertData,
      id: concerts.length + 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    concerts.push(newConcert);
    return newConcert;
  }
};

// 콘서트 일정 관련 DB 함수들 (개발용)
export const scheduleDB = {
  findByConcertId: (concertId: number): ConcertSchedule[] => {
    return concertSchedules.filter(schedule => 
      schedule.concert_id === concertId && !schedule.deleted_at
    );
  },
  
  findById: (id: number): ConcertSchedule | undefined => {
    return concertSchedules.find(schedule => schedule.id === id && !schedule.deleted_at);
  },

  create: (scheduleData: Omit<ConcertSchedule, 'id' | 'created_at' | 'updated_at'>): ConcertSchedule => {
    const newSchedule: ConcertSchedule = {
      ...scheduleData,
      id: concertSchedules.length + 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    concertSchedules.push(newSchedule);
    return newSchedule;
  }
};

// 관리자 관련 DB 함수들 (개발용)
export const adminDB = {
  findByAdminId: (adminId: string): Admin | undefined => {
    return admins.find(admin => admin.admin_id === adminId && admin.state === 'ACTIVE');
  }
};
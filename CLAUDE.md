Table user {
  id Long [pk,increment]
  user_id varchar2
  email varchar2(255)
  name varchar2(10)
  phone varchar2(50)
  gender Enum //woman, man
  state Enum  // ACTIVE, INACTIVE
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table concert{
  id Long [pk, increment]
  title varchar2(50)
  description varchar2
  location varchar2
  location_X decimal(10,3)
  location_y decimal(10,3)
  start_date date
  end_date date
  rating int
  admin_id Long [ref: > admin.id]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}
Table concert_schedule{
  id Long [pk, increment]
  concert_id Long [ref: > concert.id]
  start_time timestamp
  end_time timestamp
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
  
}

Table cast {
  id Long [pk, increment]
  name varchar2
  admin_id Long [ref : > admin.id]
}
Table concert_cast {
  id Long [pk, increment]
  concert_schedule_id Long [ref: > concert_schedule.id]
  cast_id Long [ref: > cast.id]
  role Enum
}

// 예약 테이블이지만 이력성도 있음.
Table reservation {
  id Long [pk,increment]
  user_id Long [ref: > user.id]
  concert_id Long [ref: > concert.id]
  ticket_count Long // 반정규화
  state Enum  // 예약, 예약 취소
  created_at timestamp
}


// 예약 테이블 하위의 좌석 예약 테이블
// 실질적인 표 또는 영수증 개념
// 예약 내역과 일정 콘서트 가격등을 가져옴
Table seat_reservation {
  id UUID [pk] // UUID로 변경한 이유는 예약번호를 불러줄때 추정 가능한 값이 아니도록 하기 위함.
  reservation_id Long [ref: > reservation.id]
  schedule_id Long [ref: > concert_schedule.id]
  concert_seat_metadata_id Long [ref: > concert_seat_metadata.id]
  created_at timestamp
}

// 결제 테이블
/*
  결제 테이블은 이력성 테이블으로 이해
  동일한 결제건에 대해서 최대 2번의 이력이 있을 수 있음.
  결제, 또는 결제 취소
*/
Table payment { 
  id Long [pk, increment]
  reservation_id Long [ref: > reservation.id]
  total_price Long
  state enum // 결제, 결제 취소
  created_at timestamp
}

Table admin {
  id Long [pk, increment]
  admin_id varchar2(50)
  password varchar2(255)
  phone varchar2(50)
  role Enum
  email varchar2(100)
  company varchar2(255)
  company_number varchar2(255)
  company_location varchar2(255)
  state Enum// 계정 정지에 관한
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table concert_hall{
  id Long [pk,increment]
  concert_hall_name varchar2
  // concert_schedule_id Long [ref : > concert_schedule.id ]
  admin_id varchar2 [ref: > admin.id]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

}

// 콘서트장의 좌석이 아닌 콘서트장의 영역의 좌석으로 지정하도록 변경.
Table seats {
  // concert_hall_area_id ,seat_x,seat_y 3개 묶어서 unique 처리 할것.
  id Long [pk,increment]
  concert_hall_area_id Long [ref: > concert_hall_area.id]
  seat_name varchar2
  x float(100,1)
  y float(100,1)
  ui_metadata JSON  // ui 관련 데이터 / width, height
  // width float(100,1)
  // height float(100,1)
  // rotaion float(100,1)
}

Table concert_seat_metadata {
  id Long [pk, increment]
  seats_id Long [ref: > seats.id]
  concert_id Long [ref: > concert.id]
  price integer // 가격
  seat_per_able_person Long // 좌석당 수용가능 인원
  created_at timestamp
}



// 콘서트장 구역테이블 (층, 또는 구역)
// 하위 테이블로 지정된 좌석은 delete cascade 처리할것
Table concert_hall_area{
  id Long [pk,increment]
  area_name varchar2
  concert_hall_id Long [ref: > concert_hall.id]
  x float (100,1)
  y float (100,1)
  ui_metadata Json
  created_at timestamp
}

Table review {
  id Long [pk, increment]
  user_id Long [ref : > user.id]
  concert_id Long [ref : > concert.id]
  rating int 
  content varchar2
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}
Table inquiry {
  id Long [pk, increment]
  user_id Long [ref: > user.id]
  title varchar2
  content varchar2
  type enum // 예매, 상품,배송,취소,회원관리,etc
  status enum // 응답중, 응답완료
  replied_at timestamp
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table black_list{
  id Long [pk, increment]
  user_id Long [ref : > user.id]
  reason varchar2
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}
Table report {
  id Long [pk, increment]
  admin_id Long [ref : > admin.id]
  reason Enum
  review_id Long [ref : > review.id]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

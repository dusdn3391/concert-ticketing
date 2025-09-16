import type { NextApiRequest, NextApiResponse } from 'next';
import { concertDB, scheduleDB } from '../../../../../lib/db';

export default async function adminConcertSchedules(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const concertId = parseInt(id as string);

  if (isNaN(concertId)) {
    return res.status(400).json({ message: '유효하지 않은 콘서트 ID입니다.' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetSchedules(concertId, res);
    case 'POST':
      return handleCreateSchedule(concertId, req, res);
    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// 콘서트 일정 목록 조회
async function handleGetSchedules(concertId: number, res: NextApiResponse) {
  try {
    // 콘서트 존재 확인
    const concert = concertDB.findById(concertId);
    if (!concert) {
      return res.status(404).json({ message: '콘서트를 찾을 수 없습니다.' });
    }

    const schedules = scheduleDB.findByConcertId(concertId);
    
    return res.status(200).json({
      message: '콘서트 일정 조회 성공',
      concert_id: concertId,
      concert_title: concert.title,
      schedules,
      total: schedules.length
    });
  } catch (error) {
    console.error('콘서트 일정 조회 오류:', error);
    return res.status(500).json({ message: '콘서트 일정 조회 중 오류가 발생했습니다.' });
  }
}

// 콘서트 일정 생성
async function handleCreateSchedule(concertId: number, req: NextApiRequest, res: NextApiResponse) {
  const { start_time, end_time } = req.body;

  // 필수 필드 검증
  if (!start_time || !end_time) {
    return res.status(400).json({ 
      message: '필수 필드가 누락되었습니다.',
      required: ['start_time', 'end_time']
    });
  }

  try {
    // 콘서트 존재 확인
    const concert = concertDB.findById(concertId);
    if (!concert) {
      return res.status(404).json({ message: '콘서트를 찾을 수 없습니다.' });
    }

    // 시간 유효성 검사
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    
    if (startTime >= endTime) {
      return res.status(400).json({ message: '종료 시간이 시작 시간보다 늦어야 합니다.' });
    }

    // 콘서트 기간 내 일정인지 확인
    if (startTime < concert.start_date || endTime > concert.end_date) {
      return res.status(400).json({ 
        message: '일정이 콘서트 기간을 벗어났습니다.',
        concert_period: {
          start: concert.start_date,
          end: concert.end_date
        }
      });
    }

    // 기존 일정과 겹치는지 확인
    const existingSchedules = scheduleDB.findByConcertId(concertId);
    const isOverlapping = existingSchedules.some(schedule => {
      return (startTime < schedule.end_time && endTime > schedule.start_time);
    });

    if (isOverlapping) {
      return res.status(409).json({ message: '기존 일정과 시간이 겹칩니다.' });
    }

    const newSchedule = scheduleDB.create({
      concert_id: concertId,
      start_time: startTime,
      end_time: endTime
    });

    return res.status(201).json({
      message: '콘서트 일정 생성 성공',
      schedule: newSchedule
    });
  } catch (error) {
    console.error('콘서트 일정 생성 오류:', error);
    return res.status(500).json({ message: '콘서트 일정 생성 중 오류가 발생했습니다.' });
  }
}
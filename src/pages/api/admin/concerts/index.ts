import type { NextApiRequest, NextApiResponse } from 'next';
import { concertDB } from '../../../../lib/db';

export default async function adminConcerts(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetConcerts(req, res);
    case 'POST':
      return handleCreateConcert(req, res);
    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// 관리자 콘서트 목록 조회
async function handleGetConcerts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const concerts = concertDB.findAll();
    
    return res.status(200).json({
      message: '콘서트 목록 조회 성공',
      concerts,
      total: concerts.length
    });
  } catch (error) {
    console.error('콘서트 목록 조회 오류:', error);
    return res.status(500).json({ message: '콘서트 목록 조회 중 오류가 발생했습니다.' });
  }
}

// 관리자 콘서트 생성
async function handleCreateConcert(req: NextApiRequest, res: NextApiResponse) {
  const { 
    title, 
    description, 
    location, 
    location_X, 
    location_y, 
    start_date, 
    end_date, 
    admin_id 
  } = req.body;

  // 필수 필드 검증
  if (!title || !description || !location || !start_date || !end_date || !admin_id) {
    return res.status(400).json({ 
      message: '필수 필드가 누락되었습니다.',
      required: ['title', 'description', 'location', 'start_date', 'end_date', 'admin_id']
    });
  }

  // 날짜 유효성 검사
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  if (startDate >= endDate) {
    return res.status(400).json({ message: '종료일이 시작일보다 늦어야 합니다.' });
  }

  try {
    const newConcert = concertDB.create({
      title,
      description,
      location,
      location_X: location_X || 0,
      location_y: location_y || 0,
      start_date: startDate,
      end_date: endDate,
      rating: 0, // 초기값
      admin_id
    });

    return res.status(201).json({
      message: '콘서트 생성 성공',
      concert: newConcert
    });
  } catch (error) {
    console.error('콘서트 생성 오류:', error);
    return res.status(500).json({ message: '콘서트 생성 중 오류가 발생했습니다.' });
  }
}
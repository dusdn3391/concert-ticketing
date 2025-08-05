import type { NextApiRequest, NextApiResponse } from 'next';
import { concertDB } from '../../../../lib/db';

export default async function adminConcertById(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const concertId = parseInt(id as string);

  if (isNaN(concertId)) {
    return res.status(400).json({ message: '유효하지 않은 콘서트 ID입니다.' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetConcert(concertId, res);
    case 'PUT':
      return handleUpdateConcert(concertId, req, res);
    case 'DELETE':
      return handleDeleteConcert(concertId, res);
    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// 특정 콘서트 조회 (상세 정보 포함)
async function handleGetConcert(concertId: number, res: NextApiResponse) {
  try {
    const concertDetail = concertDB.findByIdWithDetails(concertId);
    
    if (!concertDetail) {
      return res.status(404).json({ message: '콘서트를 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      message: '콘서트 상세 조회 성공',
      concert: concertDetail
    });
  } catch (error) {
    console.error('콘서트 조회 오류:', error);
    return res.status(500).json({ message: '콘서트 조회 중 오류가 발생했습니다.' });
  }
}

// 콘서트 수정
async function handleUpdateConcert(concertId: number, req: NextApiRequest, res: NextApiResponse) {
  const { 
    title, 
    description, 
    location, 
    location_X, 
    location_y, 
    start_date, 
    end_date 
  } = req.body;

  try {
    const existingConcert = concertDB.findById(concertId);
    
    if (!existingConcert) {
      return res.status(404).json({ message: '콘서트를 찾을 수 없습니다.' });
    }

    // 날짜 유효성 검사 (날짜가 제공된 경우)
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (startDate >= endDate) {
        return res.status(400).json({ message: '종료일이 시작일보다 늦어야 합니다.' });
      }
    }

    // 업데이트할 필드만 적용
    const updateData = {
      ...existingConcert,
      ...(title && { title }),
      ...(description && { description }),
      ...(location && { location }),
      ...(location_X !== undefined && { location_X }),
      ...(location_y !== undefined && { location_y }),
      ...(start_date && { start_date: new Date(start_date) }),
      ...(end_date && { end_date: new Date(end_date) }),
      updated_at: new Date()
    };

    // 실제 DB에서는 UPDATE 쿼리 실행
    // 여기서는 메모리에서 직접 수정
    Object.assign(existingConcert, updateData);

    return res.status(200).json({
      message: '콘서트 수정 성공',
      concert: existingConcert
    });
  } catch (error) {
    console.error('콘서트 수정 오류:', error);
    return res.status(500).json({ message: '콘서트 수정 중 오류가 발생했습니다.' });
  }
}

// 콘서트 삭제 (소프트 삭제)
async function handleDeleteConcert(concertId: number, res: NextApiResponse) {
  try {
    const concert = concertDB.findById(concertId);
    
    if (!concert) {
      return res.status(404).json({ message: '콘서트를 찾을 수 없습니다.' });
    }

    // 소프트 삭제 (deleted_at 필드 설정)
    concert.deleted_at = new Date();
    concert.updated_at = new Date();

    return res.status(200).json({
      message: '콘서트 삭제 성공',
      concert_id: concertId
    });
  } catch (error) {
    console.error('콘서트 삭제 오류:', error);
    return res.status(500).json({ message: '콘서트 삭제 중 오류가 발생했습니다.' });
  }
}
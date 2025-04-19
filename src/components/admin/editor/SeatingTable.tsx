import React from "react";
import { Seat } from "@/types/Seat";

interface SeatingTableProps {
  seats: Seat[];
}

export default function SeatingTable({ seats }: SeatingTableProps) {
  return (
    <div className="m-auto w-[800px]">
      <table className="min-w-full border">
        <thead>
          <tr className="bg-[#c0c0c0]">
            <th>좌석ID</th>
            <th>위치(x,y)</th>
            <th>너비</th>
            <th>높이</th>
            <th>크기비율</th>
            <th>회전각도</th>
          </tr>
        </thead>
        <tbody>
          {seats.map((seat) => (
            <tr key={seat.id}>
              <td>{seat.id}</td>
              <td>
                {seat.x}, {seat.y}
              </td>
              <td>{seat.width}</td>
              <td>{seat.height}</td>
              <td>{seat.scale}</td>
              <td>{Math.floor(seat.rotation)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

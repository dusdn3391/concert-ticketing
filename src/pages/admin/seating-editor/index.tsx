import { useEffect, useRef, useState } from "react";

type Seat = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
};

export default function SeatingEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [draggingSeatId, setDraggingSeatId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [resizingSeatId, setResizingSeatId] = useState<string | null>(null); // 추가: 크기 조정 중인 좌석 ID
  const [rotatingSeatId, setRotatingSeatId] = useState<string | null>(null); // 추가: 회전 중인 좌석 ID
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null); // 추가: hover된 좌석 ID

  const seatWidth = 30;
  const seatHeight = 30;

  // 캔버스 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    seats.forEach((seat) => {
      ctx.save();
      ctx.translate(seat.x + seat.width / 2, seat.y + seat.height / 2);
      ctx.rotate((seat.rotation * Math.PI) / 180);
      ctx.scale(seat.scale, seat.scale);
      ctx.translate(-seat.width / 2, -seat.height / 2);

      ctx.fillStyle = "skyblue";
      ctx.fillRect(0, 0, seat.width, seat.height);
      ctx.strokeStyle = "black";
      ctx.strokeRect(0, 0, seat.width, seat.height);
      ctx.fillStyle = "black";
      ctx.font = "12px sans-serif";
      ctx.fillText(seat.id, 5, 20);

      // hover된 좌석에 컨트롤 버튼 그리기
      if (seat.id === hoveredSeatId) {
        const buttonSize = 20;
        const hoverColor = "rgba(255, 255, 255, 0.8)";
        const iconColor = "rgba(0, 0, 0, 0.8)";

        // 회전 버튼 (좌상단)
        ctx.fillStyle = isMouseOverButton(offset.x, offset.y, seat, "rotate")
          ? hoverColor
          : "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, buttonSize, buttonSize);
        drawRotateIcon(ctx, 2, 2, 16, 16, iconColor);

        // 삭제 버튼 (우상단)
        ctx.fillStyle = isMouseOverButton(offset.x, offset.y, seat, "delete")
          ? hoverColor
          : "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(seat.width - buttonSize, 0, buttonSize, buttonSize);
        drawDeleteIcon(ctx, seat.width - 18, 2, 16, 16, iconColor);

        // 크기 조정 버튼 (좌하단)
        ctx.fillStyle = isMouseOverButton(offset.x, offset.y, seat, "resize")
          ? hoverColor
          : "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, seat.height - buttonSize, buttonSize, buttonSize);
        drawResizeIcon(ctx, 2, seat.height - 18, 16, 16, iconColor);

        // 이름 변경 버튼 (우하단)
        ctx.fillStyle = isMouseOverButton(offset.x, offset.y, seat, "rename")
          ? hoverColor
          : "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(
          seat.width - buttonSize,
          seat.height - buttonSize,
          buttonSize,
          buttonSize
        );
        drawRenameIcon(
          ctx,
          seat.width - 18,
          seat.height - 18,
          16,
          16,
          iconColor
        );
      }

      ctx.restore();
    });
  }, [seats, hoveredSeatId, offset.x, offset.y]);

  // 버튼 hover 상태 확인 함수
  const isMouseOverButton = (
    mouseX: number,
    mouseY: number,
    seat: Seat,
    buttonType: string
  ): boolean => {
    const centerX = seat.x + seat.width / 2;
    const centerY = seat.y + seat.height / 2;
    const rotatedX =
      (mouseX - centerX) * Math.cos((-seat.rotation * Math.PI) / 180) -
      (mouseY - centerY) * Math.sin((-seat.rotation * Math.PI) / 180) +
      centerX;
    const rotatedY =
      (mouseX - centerX) * Math.sin((-seat.rotation * Math.PI) / 180) +
      (mouseY - centerY) * Math.cos((-seat.rotation * Math.PI) / 180) +
      centerY;

    switch (buttonType) {
      case "rotate":
        return rotatedX <= seat.x + 20 && rotatedY <= seat.y + 20;
      case "delete":
        return rotatedX >= seat.x + seat.width - 20 && rotatedY <= seat.y + 20;
      case "resize":
        return rotatedX <= seat.x + 20 && rotatedY >= seat.y + seat.height - 20;
      case "rename":
        return (
          rotatedX >= seat.x + seat.width - 20 &&
          rotatedY >= seat.y + seat.height - 20
        );
      default:
        return false;
    }
  };

  // 아이콘 그리기 함수들
  const drawRotateIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, width / 2 - 2, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width - 2, y + height / 2 - 4);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width - 2, y + height / 2 + 4);
    ctx.stroke();
  };

  const drawDeleteIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + width - 2, y + height - 2);
    ctx.moveTo(x + width - 2, y + 2);
    ctx.lineTo(x + 2, y + height - 2);
    ctx.stroke();
  };

  const drawResizeIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + 2);
    ctx.lineTo(x + width / 2, y + height - 2);
    ctx.moveTo(x + 2, y + height / 2);
    ctx.lineTo(x + width - 2, y + height / 2);
    ctx.stroke();
  };

  const drawRenameIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + height / 2);
    ctx.lineTo(x + width - 2, y + height / 2);
    ctx.moveTo(x + width / 2, y + 2);
    ctx.lineTo(x + width / 2, y + height - 2);
    ctx.stroke();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging || resizingSeatId || rotatingSeatId) {
      setIsDragging(false);
      setResizingSeatId(null);
      setRotatingSeatId(null);
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 클릭된 좌석이 있는지 확인
    const clickedSeat = seats.find((seat) => {
      const centerX = seat.x + seat.width / 2;
      const centerY = seat.y + seat.height / 2;
      const rotatedX =
        (x - centerX) * Math.cos((-seat.rotation * Math.PI) / 180) -
        (y - centerY) * Math.sin((-seat.rotation * Math.PI) / 180) +
        centerX;
      const rotatedY =
        (x - centerX) * Math.sin((-seat.rotation * Math.PI) / 180) +
        (y - centerY) * Math.cos((-seat.rotation * Math.PI) / 180) +
        centerY;

      return (
        rotatedX >= seat.x &&
        rotatedX <= seat.x + seat.width &&
        rotatedY >= seat.y &&
        rotatedY <= seat.y + seat.height
      );
    });

    if (clickedSeat) {
      const centerX = clickedSeat.x + clickedSeat.width / 2;
      const centerY = clickedSeat.y + clickedSeat.height / 2;
      const rotatedX =
        (x - centerX) * Math.cos((-clickedSeat.rotation * Math.PI) / 180) -
        (y - centerY) * Math.sin((-clickedSeat.rotation * Math.PI) / 180) +
        centerX;
      const rotatedY =
        (x - centerX) * Math.sin((-clickedSeat.rotation * Math.PI) / 180) +
        (y - centerY) * Math.cos((-clickedSeat.rotation * Math.PI) / 180) +
        centerY;

      if (rotatedX <= clickedSeat.x + 20 && rotatedY <= clickedSeat.y + 20) {
        // 좌상단: 회전
        setRotatingSeatId(clickedSeat.id);
      } else if (
        rotatedX >= clickedSeat.x + clickedSeat.width - 20 &&
        rotatedY <= clickedSeat.y + 20
      ) {
        // 우상단: 삭제
        if (window.confirm(`"${clickedSeat.id}" 좌석을 삭제하시겠습니까?`)) {
          setSeats((prev) => prev.filter((seat) => seat.id !== clickedSeat.id));
        }
      } else if (
        rotatedX <= clickedSeat.x + 20 &&
        rotatedY >= clickedSeat.y + clickedSeat.height - 20
      ) {
        // 좌하단: 크기 조정
        setResizingSeatId(clickedSeat.id);
      } else if (
        rotatedX >= clickedSeat.x + clickedSeat.width - 20 &&
        rotatedY >= clickedSeat.y + clickedSeat.height - 20
      ) {
        // 우하단: 이름 변경
        const newId = prompt("새 좌석 이름을 입력하세요:", clickedSeat.id);
        if (newId !== null && newId.trim() !== "") {
          setSeats((prev) =>
            prev.map((seat) =>
              seat.id === clickedSeat.id ? { ...seat, id: newId } : seat
            )
          );
        }
      }
    } else {
      const newSeat: Seat = {
        id: `S${seats.length + 1}`,
        x: x - seatWidth / 2,
        y: y - seatHeight / 2,
        width: seatWidth,
        height: seatHeight,
        scale: 1, // 기본 크기
        rotation: 0, // 기본 회전 각도
      };
      setSeats((prev) => [...prev, newSeat]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const seat of seats) {
      if (
        x >= seat.x &&
        x <= seat.x + seat.width &&
        y >= seat.y &&
        y <= seat.y + seat.height
      ) {
        setDraggingSeatId(seat.id);
        setOffset({ x: x - seat.x, y: y - seat.y });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // hover된 좌석 확인
    const hoveredSeat = seats.find((seat) => {
      const centerX = seat.x + seat.width / 2;
      const centerY = seat.y + seat.height / 2;
      const rotatedX =
        (x - centerX) * Math.cos((-seat.rotation * Math.PI) / 180) -
        (y - centerY) * Math.sin((-seat.rotation * Math.PI) / 180) +
        centerX;
      const rotatedY =
        (x - centerX) * Math.sin((-seat.rotation * Math.PI) / 180) +
        (y - centerY) * Math.cos((-seat.rotation * Math.PI) / 180) +
        centerY;

      return (
        rotatedX >= seat.x &&
        rotatedX <= seat.x + seat.width &&
        rotatedY >= seat.y &&
        rotatedY <= seat.y + seat.height
      );
    });

    setHoveredSeatId(hoveredSeat?.id || null);

    if (draggingSeatId) {
      setIsDragging(true);
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === draggingSeatId
            ? {
                ...seat,
                x: x - offset.x,
                y: y - offset.y,
              }
            : seat
        )
      );
    } else if (resizingSeatId) {
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === resizingSeatId
            ? {
                ...seat,
                width: Math.max(20, x - seat.x),
                height: Math.max(20, y - seat.y),
              }
            : seat
        )
      );
    } else if (rotatingSeatId) {
      const seat = seats.find((s) => s.id === rotatingSeatId);
      if (seat) {
        const centerX = seat.x + seat.width / 2;
        const centerY = seat.y + seat.height / 2;
        const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
        setSeats((prev) =>
          prev.map((s) =>
            s.id === rotatingSeatId ? { ...s, rotation: angle } : s
          )
        );
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingSeatId(null);
    console.log(seats);
  };

  const handleClearAll = () => {
    if (window.confirm("모든 좌석을 삭제하시겠습니까?")) {
      setSeats([]);
    }
  };

  // 페이지 로드 시 세션 스토리지에서 데이터 불러오기
  useEffect(() => {
    const savedSeats = sessionStorage.getItem("seats");
    if (savedSeats) {
      setSeats(JSON.parse(savedSeats));
    }
  }, []);

  const handleSave = () => {
    try {
      sessionStorage.setItem("seats", JSON.stringify(seats));
      alert("좌석 정보가 세션 스토리지에 저장됨");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 실패, 콘솔을 확인 필요");
    }
  };

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <h1>좌석 배치 에디터</h1>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleClearAll}
          style={{ marginRight: "0.5rem", padding: "0.5rem 1rem" }}
        >
          초기화
        </button>
        <button onClick={handleSave} style={{ padding: "0.5rem 1rem" }}>
          저장
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: "1px solid #ccc", cursor: "pointer" }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <pre>{JSON.stringify(seats, null, 2)}</pre>
    </div>
  );
}

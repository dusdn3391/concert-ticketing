import { useRef, useState, useEffect } from "react";

type Zone = {
  id: string;
  name: string;
};

export default function UploadSVGPage() {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSvgContent(reader.result as string);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    svgContainerRef.current.innerHTML = svgContent;

    const svgEl = svgContainerRef.current.querySelector("svg");
    if (svgEl) {
      svgEl.querySelectorAll("polygon, rect, path, circle").forEach((el) => {
        el.addEventListener("click", () => {
          const id = el.getAttribute("id") || crypto.randomUUID();
          const name = prompt("구역 이름을 입력하세요 (예: A구역)");
          if (name) {
            el.setAttribute("fill", "blue");
            el.setAttribute("id", id);
            el.setAttribute("data-name", name);

            setZones((prev) => [...prev, { id, name }]);

            console.log("✅ 도형 구역 지정:");
            console.log("도형 타입:", el.tagName);
            console.log("도형 ID:", id);
            console.log("구역 이름:", name);
            console.log("도형 전체 데이터:", el.outerHTML);
          }
        });
      });
    }
  }, [svgContent]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">공연장 SVG 구역 설정</h1>

      <input
        type="file"
        accept=".svg"
        title="SVG 공연장 파일 업로드"
        onChange={handleUpload}
        className="mb-4"
      />

      <div
        ref={svgContainerRef}
        className="border w-full max-w-4xl h-[500px] overflow-auto"
      />

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">설정된 구역</h2>
        <ul className="list-disc list-inside">
          {zones.map((zone) => (
            <li key={zone.id}>
              ID: {zone.id} - 이름: {zone.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

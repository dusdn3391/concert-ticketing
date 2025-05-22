export default function ReviewSection() {
  return (
    <div>
      <div>
        <p>★ ★ ★ ★ ★ 별점을 선택해주세요</p>
        <textarea
          placeholder="후기를 작성해주세요"
          maxLength={1000}
          style={{ width: "100%", height: 100 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <span>0 / 1000</span>
          <button>등록</button>
        </div>
      </div>
    </div>
  );
}

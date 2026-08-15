"use client";

export default function Loi({ error, reset }) {
  return (
    <div className="khung" style={{ paddingTop: 60 }}>
      <div className="hoso">
        <div className="hoso-de">
          <span className="eyebrow">Ứng dụng gặp lỗi</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--chu-2)" }}>
          Có gì đó hỏng ở màn hình này. Dữ liệu đã ghi vẫn còn nguyên trên máy bạn.
        </p>
        <pre
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "var(--nguy-nen)",
            color: "var(--nguy-chu)",
            borderRadius: "var(--bo-nho)",
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {error?.message || "Không rõ nguyên nhân"}
        </pre>
        <button className="nut rong" onClick={() => reset()}>
          Thử lại
        </button>
      </div>
    </div>
  );
}

/* Dấu hiệu nhận diện: cái mâm nhìn từ trên xuống —
   vành thếp vàng, ba đĩa xà cừ, chén nước chấm son đỏ ở giữa.
   Vành vàng cũng chính là hình vòng calo ở màn hình chính. */
export function Logo({ size = 26, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Mâm"
    >
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="var(--vang)" strokeWidth="2.5" />
      <circle cx="32" cy="18.5" r="6" fill="var(--xa-cu)" />
      <circle cx="20.3" cy="38.8" r="6" fill="var(--xa-cu)" />
      <circle cx="43.7" cy="38.8" r="6" fill="var(--xa-cu)" />
      <circle cx="32" cy="32" r="3.8" fill="var(--son)" />
    </svg>
  );
}

/* Icon đầu mục — nét mảnh đều 1.75, thừa hưởng màu chữ nơi đặt vào. */
const khung = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const Icon = {
  MayAnh: (p) => (
    <svg {...khung} {...p}>
      <path d="M22 18.5a1.8 1.8 0 0 1-1.8 1.8H3.8A1.8 1.8 0 0 1 2 18.5V8.3a1.8 1.8 0 0 1 1.8-1.8h3.4l1.7-2.6h6.2l1.7 2.6h3.4A1.8 1.8 0 0 1 22 8.3z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  ),
  Muc: (p) => (
    <svg {...khung} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  ),
  Bat: (p) => (
    <svg {...khung} {...p}>
      <path d="M3.5 10.5h17a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-8.5-8.5z" />
      <path d="M12 10.5V6.2M9 7.6c0-1.2 1.3-2.2 3-2.2s3 1 3 2.2" />
    </svg>
  ),
  Lich: (p) => (
    <svg {...khung} {...p}>
      <rect x="3.2" y="5" width="17.6" height="15.5" rx="2" />
      <path d="M3.2 10h17.6M8.2 3v4M15.8 3v4" />
    </svg>
  ),
  Cot: (p) => (
    <svg {...khung} {...p}>
      <path d="M5 20V13M12 20V5M19 20v-4" />
    </svg>
  ),
  La: (p) => (
    <svg {...khung} {...p}>
      <path d="M20 4c0 8-4.7 12.5-11 12.5A5.5 5.5 0 0 1 20 4z" />
      <path d="M4 20c1.5-4.5 4-7.5 7.5-9.5" />
    </svg>
  ),
  Nguoi: (p) => (
    <svg {...khung} {...p}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  ),
  DongHo: (p) => (
    <svg {...khung} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3 1.8" />
    </svg>
  ),
  Lua: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c0 4-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3-2-4 0 1-1 2-2 2s-1-1-1-2c0-3 0-5 0-6z" />
    </svg>
  ),
};

/* Đầu mục dùng chung: icon + chữ, dùng thay cho .eyebrow trần */
export function DauMuc({ icon: I, children, phai }) {
  return (
    <div className="dau-muc">
      <span className="dm-trai">
        {I && <I />}
        <span className="dm-chu">{children}</span>
      </span>
      {phai}
    </div>
  );
}

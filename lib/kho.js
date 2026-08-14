const TIEN_TO = "mam:nhatky:";
const KHOA_MUC_TIEU = "mam:muctieu";

export const khoaNgay = (d = new Date()) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};

export const gioBayGio = () =>
  new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

export function docNgay(ngay = khoaNgay()) {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TIEN_TO + ngay) || "[]");
  } catch {
    return [];
  }
}

export function ghiNgay(ds, ngay = khoaNgay()) {
  try {
    localStorage.setItem(TIEN_TO + ngay, JSON.stringify(ds));
  } catch {}
}

export function docMucTieu() {
  if (typeof window === "undefined") return { calo: 2000, protein: 120 };
  try {
    return JSON.parse(localStorage.getItem(KHOA_MUC_TIEU)) || { calo: 2000, protein: 120 };
  } catch {
    return { calo: 2000, protein: 120 };
  }
}

export function ghiMucTieu(mt) {
  try {
    localStorage.setItem(KHOA_MUC_TIEU, JSON.stringify(mt));
  } catch {}
}

/** Tổng calo 7 ngày gần nhất, cũ → mới */
export function bayNgay() {
  const ra = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = docNgay(khoaNgay(d));
    ra.push({
      ngay: khoaNgay(d),
      thu: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()],
      calo: ds.reduce((t, m) => t + (m.calo || 0), 0),
    });
  }
  return ra;
}

/* ── hồ sơ người dùng ── */
const KHOA_HS = "mam:hoso";
const KHOA_TV = "mam:tuvan";

export function docHoSo() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KHOA_HS) || "null");
  } catch {
    return null;
  }
}

export function ghiHoSo(hs) {
  try {
    localStorage.setItem(KHOA_HS, JSON.stringify(hs));
  } catch {}
}

export function xoaHoSo() {
  try {
    localStorage.removeItem(KHOA_HS);
    localStorage.removeItem(KHOA_TV);
  } catch {}
}

export function docTuVan() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KHOA_TV) || "null");
  } catch {
    return null;
  }
}

export function ghiTuVan(tv) {
  try {
    localStorage.setItem(KHOA_TV, JSON.stringify(tv));
  } catch {}
}

/** Trung bình calo/đạm mỗi ngày trong N ngày gần nhất có ăn — để gửi kèm khi xin tư vấn. */
export function trungBinhGanDay(soNgay = 7) {
  const ra = [];
  for (let i = 0; i < soNgay; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = docNgay(khoaNgay(d));
    if (ds.length) {
      ra.push({
        calo: ds.reduce((t, m) => t + (m.calo || 0), 0),
        dam: ds.reduce((t, m) => t + (m.protein || 0), 0),
        mon: ds.map((m) => m.ten),
      });
    }
  }
  if (!ra.length) return null;
  return {
    soNgay: ra.length,
    calo: Math.round(ra.reduce((t, x) => t + x.calo, 0) / ra.length),
    dam: Math.round(ra.reduce((t, x) => t + x.dam, 0) / ra.length),
    mon: [...new Set(ra.flatMap((x) => x.mon))].slice(0, 25),
  };
}

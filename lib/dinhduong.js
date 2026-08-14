/* Toán dinh dưỡng — tính bằng công thức, không hỏi AI, để con số ổn định giữa các lần mở app. */

export const GIOI_TINH = [
  { ma: "nam", ten: "Nam" },
  { ma: "nu", ten: "Nữ" },
];

export const VAN_DONG = [
  { ma: "it", ten: "Ít vận động", mo: "Ngồi học/làm cả ngày, hầu như không tập", he_so: 1.2 },
  { ma: "nhe", ten: "Nhẹ", mo: "Đi bộ nhiều, tập 1–3 buổi/tuần", he_so: 1.375 },
  { ma: "vua", ten: "Vừa", mo: "Tập 3–5 buổi/tuần", he_so: 1.55 },
  { ma: "nhieu", ten: "Nhiều", mo: "Tập 6–7 buổi/tuần hoặc lao động chân tay", he_so: 1.725 },
];

export const MUC_TIEU = [
  {
    ma: "giam-can",
    ten: "Giảm cân",
    mo: "Giảm mỡ, chấp nhận xuống cân",
    chinh: -0.2,
    dam_g_kg: 1.8,
    beo_pc: 0.25,
  },
  {
    ma: "cat-mo",
    ten: "Cắt mỡ",
    mo: "Giảm mỡ nhưng giữ cơ, cân xuống chậm",
    chinh: -0.15,
    dam_g_kg: 2.0,
    beo_pc: 0.25,
  },
  {
    ma: "giu-dang",
    ten: "Giữ dáng",
    mo: "Giữ nguyên cân nặng hiện tại",
    chinh: 0,
    dam_g_kg: 1.4,
    beo_pc: 0.28,
  },
  {
    ma: "tang-co",
    ten: "Tăng cơ",
    mo: "Lên cơ, hạn chế lên mỡ",
    chinh: 0.1,
    dam_g_kg: 1.8,
    beo_pc: 0.25,
  },
  {
    ma: "tang-can",
    ten: "Tăng cân",
    mo: "Lên cân, đang quá nhẹ so với chiều cao",
    chinh: 0.15,
    dam_g_kg: 1.6,
    beo_pc: 0.3,
  },
];

/* Ngưỡng sàn calo. Dưới mức này thì rất khó đủ vi chất, nên app không hạ thấp hơn. */
const SAN_CALO = { nam: 1500, nu: 1200 };

export const tim = (ds, ma) => ds.find((x) => x.ma === ma) || ds[0];

export function tinhBMI(canNang, chieuCao) {
  const m = (chieuCao || 0) / 100;
  if (!m) return 0;
  return canNang / (m * m);
}

export function xepBMI(bmi) {
  if (bmi < 18.5) return { ma: "thieu", ten: "thiếu cân" };
  if (bmi < 23) return { ma: "binh-thuong", ten: "bình thường" };
  if (bmi < 25) return { ma: "thua", ten: "thừa cân" };
  return { ma: "beo", ten: "béo phì" };
}

/* Mifflin–St Jeor */
export function tinhBMR({ gioiTinh, canNang, chieuCao, tuoi }) {
  const nen = 10 * canNang + 6.25 * chieuCao - 5 * tuoi;
  return Math.round(gioiTinh === "nam" ? nen + 5 : nen - 161);
}

/**
 * Trả về mục tiêu calo/đạm/carb/béo mỗi ngày, kèm cảnh báo nếu có.
 * Luôn kẹp trong khoảng an toàn — không để mục tiêu tụt xuống mức thiếu ăn.
 */
export function tinhMucTieu(hs) {
  const { gioiTinh, canNang, chieuCao, tuoi, vanDong, mucTieu } = hs;
  const bmr = tinhBMR(hs);
  const hs_vd = tim(VAN_DONG, vanDong).he_so;
  const tdee = Math.round(bmr * hs_vd);
  const mt = tim(MUC_TIEU, mucTieu);
  const bmi = tinhBMI(canNang, chieuCao);
  const xep = xepBMI(bmi);

  let calo = Math.round(tdee * (1 + mt.chinh));
  const canhBao = [];

  // Đang thiếu cân mà chọn mục tiêu giảm: app không phát mức thâm hụt.
  // Đưa về mức giữ cân và nói rõ lý do — người dùng vẫn tự đổi mục tiêu được.
  if (xep.ma === "thieu" && mt.chinh < 0) {
    calo = tdee;
    canhBao.push(
      `BMI của bạn là ${bmi.toFixed(1)}, đang dưới ngưỡng bình thường, nên app đặt mức giữ cân thay vì mức giảm. Nếu bạn vẫn muốn giảm, hãy nói chuyện với bác sĩ hoặc chuyên gia dinh dưỡng trước — họ nhìn được những thứ mà chiều cao với cân nặng không nói lên hết.`
    );
  }

  // Sàn an toàn
  const san = SAN_CALO[gioiTinh] || 1200;
  if (calo < san) {
    calo = san;
    canhBao.push(
      `Mục tiêu đã được nâng lên ${san} kcal — đây là mức tối thiểu để cơ thể còn đủ vi chất.`
    );
  }

  // Đạm: g/kg cân nặng, kẹp trần để không thành con số vô lý
  const dam = Math.min(Math.round(canNang * mt.dam_g_kg), Math.round((calo * 0.35) / 4));
  const beo = Math.round((calo * mt.beo_pc) / 9);
  const carb = Math.max(0, Math.round((calo - dam * 4 - beo * 9) / 4));

  return { bmr, tdee, calo, dam, carb, beo, bmi, xep, canhBao };
}

/** Tốc độ thay đổi cân nặng ước tính mỗi tuần, từ chênh lệch calo. */
export function toDoTuan(tdee, calo) {
  const chenh = (calo - tdee) * 7;
  return chenh / 7700; // ~7700 kcal cho 1kg
}

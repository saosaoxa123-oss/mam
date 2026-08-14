"use client";

import { useEffect, useRef, useState } from "react";
import {
  bayNgay,
  docHoSo,
  docMucTieu,
  docNgay,
  docTuVan,
  ghiMucTieu,
  ghiNgay,
  gioBayGio,
} from "../lib/kho";
import { MUC_TIEU, tim } from "../lib/dinhduong";
import HoSo from "./HoSo";

const TOI_DA_ANH = 4;

const MAU = { dam: "#5E8F7E", carb: "#C4952F", beo: "#B8402C" };

const BUOI = [
  { ma: "sang", ten: "Sáng", tu: 4, den: 10 },
  { ma: "trua", ten: "Trưa", tu: 10, den: 14 },
  { ma: "chieu", ten: "Chiều", tu: 14, den: 17 },
  { ma: "toi", ten: "Tối", tu: 17, den: 28 },
];

const buoiCua = (gio) => {
  const h = Number((gio || "12:00").slice(0, 2));
  const gioThuc = h < 4 ? h + 24 : h;
  return BUOI.find((b) => gioThuc >= b.tu && gioThuc < b.den) || BUOI[3];
};

// nén ảnh ngay trên máy để gửi cho nhẹ
function nenAnh(file) {
  return new Promise((ok, loi) => {
    const doc = new FileReader();
    doc.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024;
        const ti = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * ti);
        c.height = Math.round(img.height * ti);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => loi(new Error("anh hong"));
      img.src = doc.result;
    };
    doc.onerror = () => loi(new Error("khong doc duoc"));
    doc.readAsDataURL(file);
  });
}

/* Vòng mâm: cung ngoài = calo, cung trong = đạm */
function VongMam({ pcCalo, pcDam, con, qua }) {
  const R1 = 74;
  const R2 = 58;
  const C1 = 2 * Math.PI * R1;
  const C2 = 2 * Math.PI * R2;
  const kt = 186;
  return (
    <div className="vong-boc" style={{ height: kt }}>
      <svg className="vong" width={kt} height={kt} viewBox="0 0 186 186" aria-hidden="true">
        <circle className="ray" cx="93" cy="93" r={R1} strokeWidth="9" />
        <circle
          className="chay"
          cx="93"
          cy="93"
          r={R1}
          strokeWidth="9"
          stroke={qua ? "#B8402C" : "#C4952F"}
          strokeDasharray={C1}
          strokeDashoffset={C1 - (C1 * Math.min(100, pcCalo)) / 100}
        />
        <circle className="ray" cx="93" cy="93" r={R2} strokeWidth="5" />
        <circle
          className="chay"
          cx="93"
          cy="93"
          r={R2}
          strokeWidth="5"
          stroke="#5E8F7E"
          strokeDasharray={C2}
          strokeDashoffset={C2 - (C2 * Math.min(100, pcDam)) / 100}
        />
      </svg>
      <div className="giua">
        <div className={"con" + (qua ? " qua" : "")}>{Math.abs(con)}</div>
        <div className="nhan-con">{qua ? "kcal vượt" : "kcal còn lại"}</div>
      </div>
    </div>
  );
}

/* Dải tỉ lệ calo đến từ đạm / carb / béo */
function DaiMacro({ p, c, f, chuThich }) {
  const kP = p * 4;
  const kC = c * 4;
  const kF = f * 9;
  const tong = kP + kC + kF;
  if (tong <= 0) return null;
  const pc = (x) => (x / tong) * 100 + "%";
  return (
    <>
      <div className="dai">
        <i style={{ width: pc(kP), background: MAU.dam }} />
        <i style={{ width: pc(kC), background: MAU.carb }} />
        <i style={{ width: pc(kF), background: MAU.beo }} />
      </div>
      {chuThich && (
        <div className="dai-chu">
          <span>
            <i className="dot" style={{ background: MAU.dam }} />
            {p}g đạm
          </span>
          <span>
            <i className="dot" style={{ background: MAU.carb }} />
            {c}g carb
          </span>
          <span>
            <i className="dot" style={{ background: MAU.beo }} />
            {f}g béo
          </span>
        </div>
      )}
    </>
  );
}

export default function Mam() {
  const [anhs, setAnhs] = useState([]);
  const [moTa, setMoTa] = useState("");
  const [trangThai, setTrangThai] = useState("cho"); // cho | soan | doc | xong
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState(null);
  const [phan, setPhan] = useState(1);
  const [nhatKy, setNhatKy] = useState([]);
  const [tuan, setTuan] = useState([]);
  const [mucTieu, setMucTieu] = useState({ calo: 2000, protein: 120 });
  const [daTai, setDaTai] = useState(false);
  const [hoSo, setHoSo] = useState(null);
  const [tuVan, setTuVan] = useState(null);
  const [moHoSo, setMoHoSo] = useState(false);
  const oFile = useRef(null);

  useEffect(() => {
    setNhatKy(docNgay());
    setMucTieu(docMucTieu());
    setTuan(bayNgay());
    setHoSo(docHoSo());
    setTuVan(docTuVan());
    setDaTai(true);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const capNhat = (ds) => {
    setNhatKy(ds);
    ghiNgay(ds);
    setTuan(bayNgay());
  };

  const themAnh = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setLoi("");
    const conCho = TOI_DA_ANH - anhs.length;
    if (conCho <= 0) return;
    if (files.length > conCho) setLoi(`Chỉ thêm được ${conCho} ảnh nữa, tối đa ${TOI_DA_ANH} ảnh một bữa.`);
    const nhan = files.slice(0, conCho);
    const xong = [];
    for (const f of nhan) {
      try {
        xong.push(await nenAnh(f));
      } catch {}
    }
    if (!xong.length) {
      setLoi("Không mở được ảnh vừa chọn. Thử ảnh khác nhé.");
      return;
    }
    setAnhs([...anhs, ...xong]);
    setTrangThai("soan");
  };

  const boAnh = (i) => {
    const con = anhs.filter((_, j) => j !== i);
    setAnhs(con);
    if (!con.length) {
      setTrangThai("cho");
      setMoTa("");
    }
  };

  const phanTich = async () => {
    if (!anhs.length) return;
    setLoi("");
    setTrangThai("doc");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ anhs, moTa }),
      });
      const kq = await res.json();
      if (!res.ok || kq.loi) throw new Error(kq.loi || "loi");
      setKetQua(kq);
      setPhan(1);
      setTrangThai("xong");
    } catch (err) {
      setLoi(err.message || "Không phân tích được. Chụp gần hơn, đủ sáng rồi thử lại.");
      setTrangThai("soan");
    }
  };

  const luuVaoNhatKy = () => {
    if (!ketQua?.mon?.length) return;
    const gio = gioBayGio();
    const them = ketQua.mon.map((m, i) => ({
      id: Date.now() + "-" + i,
      ten: m.ten,
      calo: Math.round((m.calo || 0) * phan),
      protein: Math.round((m.protein || 0) * phan),
      carb: Math.round((m.carb || 0) * phan),
      fat: Math.round((m.fat || 0) * phan),
      gio,
    }));
    capNhat([...nhatKy, ...them]);
    dungLai();
  };

  const nhanHoSo = ({ hoSo: hsMoi, mucTieu: mt, tuVan: tv }) => {
    setHoSo(hsMoi);
    if (tv) setTuVan(tv);
    if (mt) {
      const moi = { calo: mt.calo, protein: mt.dam };
      setMucTieu(moi);
      ghiMucTieu(moi);
    }
    setMoHoSo(false);
  };

  const dungLai = () => {
    setAnhs([]);
    setMoTa("");
    setKetQua(null);
    setLoi("");
    setTrangThai("cho");
  };

  const tongCalo = nhatKy.reduce((t, m) => t + m.calo, 0);
  const tongDam = nhatKy.reduce((t, m) => t + m.protein, 0);
  const tongCarb = nhatKy.reduce((t, m) => t + (m.carb || 0), 0);
  const tongFat = nhatKy.reduce((t, m) => t + (m.fat || 0), 0);
  const pcCalo = (tongCalo / (mucTieu.calo || 1)) * 100;
  const pcDam = (tongDam / (mucTieu.protein || 1)) * 100;
  const con = mucTieu.calo - tongCalo;
  const qua = con < 0;
  const dinhTuan = Math.max(...tuan.map((d) => d.calo), mucTieu.calo, 1);

  const hnay = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });

  const theoBuoi = BUOI.map((b) => ({
    ...b,
    mon: nhatKy.filter((m) => buoiCua(m.gio).ma === b.ma),
  })).filter((b) => b.mon.length);

  const kqTong = ketQua?.mon?.length
    ? ketQua.mon.reduce(
        (t, m) => ({
          calo: t.calo + Math.round((m.calo || 0) * phan),
          p: t.p + Math.round((m.protein || 0) * phan),
          c: t.c + Math.round((m.carb || 0) * phan),
          f: t.f + Math.round((m.fat || 0) * phan),
        }),
        { calo: 0, p: 0, c: 0, f: 0 }
      )
    : null;

  const mauTinCay = { cao: "#5E8F7E", "trung bình": "#C4952F", thấp: "#B8402C" };

  return (
    <div className="khung">
      <div className="dau">
        <div className="hieu">MÂM</div>
        <div className="ngay-chu">{hnay}</div>
      </div>

      {/* ── vòng mâm ── */}
      <div className="mam-tam">
        <VongMam pcCalo={daTai ? pcCalo : 0} pcDam={daTai ? pcDam : 0} con={daTai ? con : mucTieu.calo} qua={qua} />
        <div className="chu-thich">
          <div className="ct">
            <div className="nhan">Đã ăn</div>
            <div className="val">
              {tongCalo}
              <small> / {mucTieu.calo}</small>
            </div>
            <span className="gach" style={{ background: qua ? "#B8402C" : "#C4952F" }} />
          </div>
          <div className="ct">
            <div className="nhan">Đạm</div>
            <div className="val">
              {tongDam}
              <small>g / {mucTieu.protein}g</small>
            </div>
            <span className="gach" style={{ background: "#5E8F7E" }} />
          </div>
        </div>
      </div>

      {moHoSo ? (
        <HoSo banDau={hoSo} onXong={nhanHoSo} onHuy={() => setMoHoSo(false)} />
      ) : hoSo ? (
        <div className="tom-luoc">
          <span className="the-nho">{tim(MUC_TIEU, hoSo.mucTieu).ten}</span>
          <span className="the-nho">
            {hoSo.chieuCao}cm · {hoSo.canNang}kg
          </span>
          <button className="lien-ket" onClick={() => setMoHoSo(true)}>
            {tuVan ? "Xem gợi ý & sửa" : "Sửa hồ sơ"}
          </button>
        </div>
      ) : (
        <button className="moi" onClick={() => setMoHoSo(true)}>
          <div className="moi-chu">
            <div className="moi-ten">Đặt mục tiêu cho riêng bạn</div>
            <div className="moi-mo">
              Nhập chiều cao, cân nặng và điều bạn muốn — app tính lại mức calo và đạm hợp với bạn, kèm
              gợi ý nên ăn gì.
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      <input
        ref={oFile}
        type="file"
        accept="image/*"
        multiple
        onChange={themAnh}
        style={{ display: "none" }}
      />

      {trangThai === "cho" && (
        <button className="nut rong" onClick={() => oFile.current?.click()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Chụp món ăn
        </button>
      )}

      {loi && <div className="loi">{loi}</div>}

      {/* ── khay soạn ── */}
      {(trangThai === "soan" || trangThai === "doc") && anhs.length > 0 && (
        <div className="soan">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Bữa này · {anhs.length}/{TOI_DA_ANH} ảnh
          </div>
          <div className="day-anh">
            {anhs.map((a, i) => (
              <div className="o-anh" key={i}>
                <img src={a} alt={"Ảnh " + (i + 1)} />
                {trangThai === "soan" && (
                  <button className="bo-anh" aria-label={"Bỏ ảnh " + (i + 1)} onClick={() => boAnh(i)}>
                    ×
                  </button>
                )}
              </div>
            ))}
            {trangThai === "soan" && anhs.length < TOI_DA_ANH && (
              <button className="them-anh" onClick={() => oFile.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Thêm ảnh
              </button>
            )}
          </div>

          {trangThai === "soan" && (
            <>
              <div className="goc-nhac">
                Chụp thêm góc nghiêng hoặc cận cảnh giúp ước lượng khẩu phần sát hơn.
              </div>

              <div className="o-mota">
                <label className="eyebrow" htmlFor="mota">
                  Mô tả thêm — không bắt buộc
                </label>
                <textarea
                  id="mota"
                  value={moTa}
                  maxLength={500}
                  placeholder="vd: tô lớn, ít bún nhiều thịt, không ăn hết phần cơm"
                  onChange={(e) => setMoTa(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="nut mo" onClick={dungLai}>
                  Huỷ
                </button>
                <button className="nut" style={{ flex: 1 }} onClick={phanTich}>
                  Phân tích {anhs.length > 1 ? `${anhs.length} ảnh` : ""}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {trangThai === "doc" && (
        <div className="dang-doc-tam">
          <div className="vach">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="chu">
            Đang nhìn món{anhs.length > 1 ? ` trong ${anhs.length} ảnh` : ""}
            {moTa.trim() ? " và đọc mô tả của bạn" : ""}…
          </div>
        </div>
      )}

      {/* ── kết quả ── */}
      {trangThai === "xong" && ketQua && (
        <div style={{ marginTop: 24 }}>
          {ketQua.mon?.length ? (
            <>
              <div className="de-muc" style={{ margin: "0 0 2px" }}>
                <span className="eyebrow">Nhìn thấy</span>
                <span className="so" style={{ fontSize: 15, fontWeight: 700 }}>
                  {kqTong.calo} kcal
                </span>
              </div>

              {ketQua.mon.map((m, i) => (
                <div className="mon" key={i} style={{ animationDelay: i * 0.05 + "s" }}>
                  <div className="mon-tren">
                    <div>
                      <div className="mon-ten">{m.ten}</div>
                      <div className="mon-uoc">{m.uocluong}</div>
                    </div>
                    <div className="mon-calo">
                      {Math.round((m.calo || 0) * phan)}
                      <small>kcal</small>
                    </div>
                  </div>
                  <DaiMacro
                    p={Math.round((m.protein || 0) * phan)}
                    c={Math.round((m.carb || 0) * phan)}
                    f={Math.round((m.fat || 0) * phan)}
                    chuThich
                  />
                </div>
              ))}

              <div className="de-muc" style={{ margin: "22px 0 0" }}>
                <span className="eyebrow">Bạn ăn bao nhiêu phần</span>
              </div>
              <div className="khay">
                {[0.5, 1, 1.5, 2].map((p) => (
                  <button key={p} data-chon={phan === p ? 1 : 0} onClick={() => setPhan(p)}>
                    {p === 1 ? "1 phần" : p + "×"}
                  </button>
                ))}
              </div>

              {ketQua.tincay && (
                <div className="tin-cay">
                  <span
                    className="cham-tc"
                    style={{ background: mauTinCay[ketQua.tincay] || "#C4952F" }}
                  />
                  <span>
                    Độ tin cậy {ketQua.tincay}
                    {ketQua.luuy ? ` · ${ketQua.luuy}` : ""}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button className="nut mo" onClick={dungLai}>
                  Bỏ
                </button>
                <button className="nut than" style={{ flex: 1 }} onClick={luuVaoNhatKy}>
                  Lưu vào nhật ký
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="trong">{ketQua.luuy || "Không thấy đồ ăn trong ảnh."}</div>
              <button className="nut mo" onClick={dungLai}>
                Chụp lại
              </button>
            </>
          )}
        </div>
      )}

      {/* ── nhật ký theo buổi ── */}
      <div className="de-muc">
        <span className="eyebrow">Hôm nay đã ăn</span>
      </div>
      {nhatKy.length === 0 ? (
        <div className="trong">Chưa có món nào. Chụp bữa đầu tiên đi.</div>
      ) : (
        <>
          {theoBuoi.map((b) => (
            <div className="buoi" key={b.ma}>
              <div className="buoi-de">
                <span className="ten">{b.ten}</span>
                <span className="tong">{b.mon.reduce((t, m) => t + m.calo, 0)} kcal</span>
              </div>
              {b.mon.map((m) => (
                <div className="dong" key={m.id}>
                  <span className="gio">{m.gio}</span>
                  <div className="ten">
                    {m.ten}
                    <div className="dam">{m.protein}g đạm</div>
                  </div>
                  <span className="kcal">{m.calo}</span>
                  <button className="xoa" aria-label={"Xoá " + m.ten} onClick={() => capNhat(nhatKy.filter((x) => x.id !== m.id))}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))}

          <div style={{ marginTop: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Cả ngày lấy calo từ đâu
            </div>
            <DaiMacro p={tongDam} c={tongCarb} f={tongFat} chuThich />
          </div>
        </>
      )}

      {/* ── tuần ── */}
      <div className="de-muc">
        <span className="eyebrow">7 ngày qua</span>
      </div>
      <div className="tuan">
        {tuan.map((d, i) => (
          <div className="cot" key={d.ngay} data-nay={i === tuan.length - 1 ? 1 : 0}>
            <div className="thanh" style={{ height: (d.calo / dinhTuan) * 100 + "%" }} />
            <div className="thu">{d.thu}</div>
          </div>
        ))}
      </div>

      <div className="chan">
        Con số là ước tính từ ảnh — nước dùng, dầu mỡ và đường thường bị nhìn hụt. Thêm ảnh và mô tả thì
        sát hơn, nhưng vẫn nên dùng để thấy xu hướng trong tuần chứ đừng coi là số đo chính xác. Dữ liệu
        lưu ngay trên máy bạn.
      </div>
    </div>
  );
}

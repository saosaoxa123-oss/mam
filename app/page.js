"use client";

import { useEffect, useRef, useState } from "react";

const TIEN_TO = "mam:nhatky:";
const KHOA_MUC_TIEU = "mam:muctieu";

const khoaNgay = (d = new Date()) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};

const gioBayGio = () =>
  new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

function docNgay(ngay = khoaNgay()) {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TIEN_TO + ngay) || "[]");
  } catch {
    return [];
  }
}

function ghiNgay(ds, ngay = khoaNgay()) {
  try {
    localStorage.setItem(TIEN_TO + ngay, JSON.stringify(ds));
  } catch {}
}

function docMucTieu() {
  if (typeof window === "undefined") return { calo: 2000, protein: 120 };
  try {
    return JSON.parse(localStorage.getItem(KHOA_MUC_TIEU)) || { calo: 2000, protein: 120 };
  } catch {
    return { calo: 2000, protein: 120 };
  }
}

function ghiMucTieu(mt) {
  try {
    localStorage.setItem(KHOA_MUC_TIEU, JSON.stringify(mt));
  } catch {}
}

function bayNgay() {
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

export default function Page() {
  const [anh, setAnh] = useState(null);
  const [trangThai, setTrangThai] = useState("cho");
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState(null);
  const [phan, setPhan] = useState(1);
  const [nhatKy, setNhatKy] = useState([]);
  const [tuan, setTuan] = useState([]);
  const [mucTieu, setMucTieu] = useState({ calo: 2000, protein: 120 });
  const [suaMucTieu, setSuaMucTieu] = useState(false);
  const [daTai, setDaTai] = useState(false);
  const oFile = useRef(null);

  useEffect(() => {
    setNhatKy(docNgay());
    setMucTieu(docMucTieu());
    setTuan(bayNgay());
    setDaTai(true);
  }, []);

  const capNhat = (ds) => {
    setNhatKy(ds);
    ghiNgay(ds);
    setTuan(bayNgay());
  };

  const chonAnh = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setLoi("");
    setKetQua(null);
    setPhan(1);
    try {
      const data = await nenAnh(f);
      setAnh(data);
      phanTich(data);
    } catch {
      setAnh(null);
      setLoi("Ảnh này không mở được. Chọn ảnh khác nhé.");
      setTrangThai("loi");
    }
  };

  const phanTich = async (dataURL) => {
    setTrangThai("doc");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ anh: dataURL }),
      });
      const kq = await res.json();
      if (!res.ok || kq.loi) throw new Error(kq.loi || "loi");
      setKetQua(kq);
      setTrangThai("xong");
    } catch (err) {
      setLoi(err.message || "Không phân tích được ảnh. Chụp gần hơn và đủ sáng rồi thử lại.");
      setTrangThai("loi");
    }
  };

  const luuVaoNhatKy = () => {
    if (!ketQua?.mon?.length) return;
    const them = ketQua.mon.map((m, i) => ({
      id: Date.now() + "-" + i,
      ten: m.ten,
      calo: Math.round((m.calo || 0) * phan),
      protein: Math.round((m.protein || 0) * phan),
      gio: gioBayGio(),
    }));
    capNhat([...nhatKy, ...them]);
    boQua();
  };

  const boQua = () => {
    setAnh(null);
    setKetQua(null);
    setLoi("");
    setTrangThai("cho");
  };

  const tongCalo = nhatKy.reduce((t, m) => t + m.calo, 0);
  const tongDam = nhatKy.reduce((t, m) => t + m.protein, 0);
  const pcCalo = Math.min(100, (tongCalo / (mucTieu.calo || 1)) * 100);
  const pcDam = Math.min(100, (tongDam / (mucTieu.protein || 1)) * 100);
  const conLai = Math.max(0, mucTieu.calo - tongCalo);
  const dinhTuan = Math.max(...tuan.map((d) => d.calo), mucTieu.calo, 1);

  const hnay = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });

  return (
    <div className="khung">
      <div className="dau">
        <div className="hieu">MÂM</div>
        <div className="phu">chụp món — biết calo &amp; đạm</div>
      </div>

      <div className="son-mai-tam">
        <div className="son-mai-trong">
          <div className="nhan">{hnay}</div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "flex-end" }}>
            <div className="so-lon">{daTai ? tongCalo : 0}</div>
            <div className="don-vi">kcal</div>
          </div>
          <div className="muc-tieu-chu">
            {conLai > 0 ? `còn ${conLai} kcal trong mục tiêu` : "đã qua mục tiêu hôm nay"}
          </div>

          <div className="kham">
            <i style={{ width: pcCalo + "%" }} />
          </div>
          <div className="dong-nho">
            <span>Năng lượng</span>
            <span>
              <b>{tongCalo}</b> / {mucTieu.calo} kcal
            </span>
          </div>

          <div className="kham dam" style={{ marginTop: 16 }}>
            <i style={{ width: pcDam + "%" }} />
          </div>
          <div className="dong-nho">
            <span>Đạm</span>
            <span>
              <b>{tongDam}</b> / {mucTieu.protein} g
            </span>
          </div>
        </div>
      </div>

      <div className="hang-muc-tieu">
        {suaMucTieu ? (
          <>
            <input
              className="o-nhap"
              type="number"
              inputMode="numeric"
              value={mucTieu.calo}
              onChange={(e) => setMucTieu({ ...mucTieu, calo: +e.target.value })}
            />
            <span>kcal</span>
            <input
              className="o-nhap"
              type="number"
              inputMode="numeric"
              value={mucTieu.protein}
              onChange={(e) => setMucTieu({ ...mucTieu, protein: +e.target.value })}
            />
            <span>g đạm</span>
            <button
              className="lien-ket"
              onClick={() => {
                ghiMucTieu(mucTieu);
                setSuaMucTieu(false);
              }}
            >
              Xong
            </button>
          </>
        ) : (
          <button className="lien-ket" onClick={() => setSuaMucTieu(true)}>
            Đổi mục tiêu
          </button>
        )}
      </div>

      <input
        ref={oFile}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={chonAnh}
        style={{ display: "none" }}
      />

      {trangThai !== "doc" && !ketQua && (
        <button className="nut-chinh" onClick={() => oFile.current?.click()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Chụp món ăn
        </button>
      )}

      {loi && <div className="loi">{loi}</div>}

      {anh && (
        <div className="anh-hop">
          <img src={anh} alt="Món vừa chụp" />
          {trangThai === "doc" && (
            <>
              <div className="quet" />
              <div className="dang-doc">Đang nhìn món…</div>
            </>
          )}
        </div>
      )}

      {ketQua && trangThai === "xong" && (
        <div>
          {ketQua.mon?.length ? (
            <>
              <div className="tieu-de-muc">Nhìn thấy trong ảnh</div>
              {ketQua.mon.map((m, i) => (
                <div className="the-mon" key={i} style={{ animationDelay: i * 0.06 + "s" }}>
                  <div>
                    <div className="ten-mon">{m.ten}</div>
                    <div className="uoc">
                      {m.uocluong} · {Math.round((m.protein || 0) * phan)}g đạm ·{" "}
                      {Math.round((m.carb || 0) * phan)}g carb · {Math.round((m.fat || 0) * phan)}g béo
                    </div>
                  </div>
                  <div className="so-mon">
                    <b>{Math.round((m.calo || 0) * phan)}</b>
                    <span>kcal</span>
                  </div>
                </div>
              ))}

              <div className="tieu-de-muc">Bạn ăn bao nhiêu phần?</div>
              <div className="khay">
                {[0.5, 1, 1.5, 2].map((p) => (
                  <button key={p} data-chon={phan === p ? 1 : 0} onClick={() => setPhan(p)}>
                    {p === 1 ? "1 phần" : p + "×"}
                  </button>
                ))}
              </div>

              {ketQua.luuy && (
                <div className="uoc" style={{ marginTop: 12 }}>
                  Độ tin cậy: {ketQua.tincay}. {ketQua.luuy}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button className="nut-phu" onClick={boQua}>
                  Bỏ
                </button>
                <button className="nut-phu dam" onClick={luuVaoNhatKy}>
                  Lưu vào nhật ký
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="trong">{ketQua.luuy || "Không thấy đồ ăn trong ảnh."}</div>
              <button className="nut-phu" onClick={boQua}>
                Chụp lại
              </button>
            </>
          )}
        </div>
      )}

      <div className="tieu-de-muc">Hôm nay đã ăn</div>
      {nhatKy.length === 0 ? (
        <div className="trong">Chưa có món nào. Chụp bữa đầu tiên đi.</div>
      ) : (
        nhatKy.map((m) => (
          <div className="nhat-ky-dong" key={m.id}>
            <div className="gio">{m.gio}</div>
            <div className="ten">{m.ten}</div>
            <div className="n">{m.calo}</div>
            <div className="uoc" style={{ width: 48, textAlign: "right", marginTop: 0 }}>
              {m.protein}g đạm
            </div>
            <button
              className="xoa"
              aria-label={"Xoá " + m.ten}
              onClick={() => capNhat(nhatKy.filter((x) => x.id !== m.id))}
            >
              ×
            </button>
          </div>
        ))
      )}

      <div className="tieu-de-muc">7 ngày qua</div>
      <div className="tuan">
        {tuan.map((d, i) => (
          <div className="cot" key={d.ngay} data-nay={i === tuan.length - 1 ? 1 : 0}>
            <div className="thanh" style={{ height: (d.calo / dinhTuan) * 100 + "%" }} />
            <div className="thu">{d.thu}</div>
          </div>
        ))}
      </div>

      <div className="chan">
        Con số là ước tính từ ảnh — nước dùng, dầu mỡ và đường thường bị nhìn hụt. Dùng để thấy xu hướng
        trong tuần, đừng coi là số đo chính xác. Dữ liệu lưu ngay trên máy bạn.
      </div>
    </div>
  );
}

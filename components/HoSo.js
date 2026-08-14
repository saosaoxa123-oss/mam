"use client";

import { useState } from "react";
import {
  GIOI_TINH,
  MUC_TIEU,
  VAN_DONG,
  tim,
  tinhMucTieu,
  toDoTuan,
} from "../lib/dinhduong";
import { ghiHoSo, ghiTuVan, trungBinhGanDay } from "../lib/kho";

const RONG = {
  gioiTinh: "nam",
  tuoi: 20,
  chieuCao: 170,
  canNang: 60,
  vanDong: "nhe",
  mucTieu: "giu-dang",
  moTaAn: "",
};

export default function HoSo({ banDau, onXong, onHuy }) {
  const [hs, setHs] = useState(banDau || RONG);
  const [buoc, setBuoc] = useState("nhap"); // nhap | xem | doc | tuvan
  const [ketQua, setKetQua] = useState(null);
  const [tuVan, setTuVan] = useState(null);
  const [loi, setLoi] = useState("");

  const dat = (k, v) => setHs({ ...hs, [k]: v });

  const hopLe =
    hs.tuoi >= 13 &&
    hs.tuoi <= 100 &&
    hs.chieuCao >= 120 &&
    hs.chieuCao <= 220 &&
    hs.canNang >= 30 &&
    hs.canNang <= 250;

  const tinh = () => {
    if (!hopLe) {
      setLoi("Kiểm tra lại tuổi, chiều cao và cân nặng giúp mình.");
      return;
    }
    setLoi("");
    setKetQua(tinhMucTieu(hs));
    setBuoc("xem");
  };

  const luuVaXinTuVan = async () => {
    const mt = ketQua;
    ghiHoSo(hs);
    setBuoc("doc");
    setLoi("");
    try {
      const res = await fetch("/api/tuvan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hoSo: {
            ...hs,
            vanDongTen: tim(VAN_DONG, hs.vanDong).ten,
            mucTieuTen: tim(MUC_TIEU, hs.mucTieu).ten,
          },
          mucTieu: mt,
          ganDay: trungBinhGanDay(7),
          moTaAn: hs.moTaAn,
        }),
      });
      const kq = await res.json();
      if (!res.ok || kq.loi) throw new Error(kq.loi || "loi");
      ghiTuVan(kq);
      setTuVan(kq);
      setBuoc("tuvan");
    } catch (e) {
      setLoi(e.message || "Chưa lấy được tư vấn, nhưng mục tiêu đã lưu rồi.");
      setBuoc("xem");
    }
  };

  const xong = () => onXong({ hoSo: hs, mucTieu: ketQua, tuVan });

  /* ── bước 1: nhập ── */
  if (buoc === "nhap") {
    return (
      <div className="hoso">
        <div className="hoso-de">
          <span className="eyebrow">Đặt mục tiêu cho riêng bạn</span>
          <button className="lien-ket" onClick={onHuy}>
            Đóng
          </button>
        </div>

        <div className="truong">
          <label className="eyebrow">Giới tính</label>
          <div className="khay">
            {GIOI_TINH.map((g) => (
              <button
                key={g.ma}
                data-chon={hs.gioiTinh === g.ma ? 1 : 0}
                onClick={() => dat("gioiTinh", g.ma)}
              >
                {g.ten}
              </button>
            ))}
          </div>
        </div>

        <div className="ba-o">
          <div className="truong">
            <label className="eyebrow" htmlFor="tuoi">
              Tuổi
            </label>
            <input
              id="tuoi"
              className="o-so"
              type="number"
              inputMode="numeric"
              value={hs.tuoi}
              onChange={(e) => dat("tuoi", +e.target.value)}
            />
          </div>
          <div className="truong">
            <label className="eyebrow" htmlFor="cao">
              Chiều cao
            </label>
            <div className="o-don">
              <input
                id="cao"
                className="o-so"
                type="number"
                inputMode="numeric"
                value={hs.chieuCao}
                onChange={(e) => dat("chieuCao", +e.target.value)}
              />
              <span>cm</span>
            </div>
          </div>
          <div className="truong">
            <label className="eyebrow" htmlFor="nang">
              Cân nặng
            </label>
            <div className="o-don">
              <input
                id="nang"
                className="o-so"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={hs.canNang}
                onChange={(e) => dat("canNang", +e.target.value)}
              />
              <span>kg</span>
            </div>
          </div>
        </div>

        <div className="truong">
          <label className="eyebrow">Mức vận động</label>
          <div className="cot-chon">
            {VAN_DONG.map((v) => (
              <button
                key={v.ma}
                className="the-chon"
                data-chon={hs.vanDong === v.ma ? 1 : 0}
                onClick={() => dat("vanDong", v.ma)}
              >
                <span className="tc-ten">{v.ten}</span>
                <span className="tc-mo">{v.mo}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="truong">
          <label className="eyebrow">Bạn muốn gì</label>
          <div className="cot-chon">
            {MUC_TIEU.map((m) => (
              <button
                key={m.ma}
                className="the-chon"
                data-chon={hs.mucTieu === m.ma ? 1 : 0}
                onClick={() => dat("mucTieu", m.ma)}
              >
                <span className="tc-ten">{m.ten}</span>
                <span className="tc-mo">{m.mo}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="truong">
          <label className="eyebrow" htmlFor="an">
            Dạo này bạn ăn uống thế nào — không bắt buộc
          </label>
          <textarea
            id="an"
            className="o-chu"
            maxLength={600}
            value={hs.moTaAn}
            placeholder="vd: hay bỏ bữa sáng, trưa ăn cơm quán, tối hay ăn mì gói và uống trà sữa"
            onChange={(e) => dat("moTaAn", e.target.value)}
          />
        </div>

        {loi && <div className="loi">{loi}</div>}

        <button className="nut rong" onClick={tinh}>
          Tính mục tiêu
        </button>
      </div>
    );
  }

  /* ── bước 2: xem con số ── */
  if (buoc === "xem" || buoc === "doc") {
    const toc = toDoTuan(ketQua.tdee, ketQua.calo);
    return (
      <div className="hoso">
        <div className="hoso-de">
          <span className="eyebrow">Mục tiêu mỗi ngày của bạn</span>
          <button className="lien-ket" onClick={() => setBuoc("nhap")}>
            Sửa
          </button>
        </div>

        <div className="bang-so">
          <div className="bs-chinh">
            <div className="bs-lon so">{ketQua.calo}</div>
            <div className="bs-nhan">kcal mỗi ngày</div>
          </div>
          <div className="bs-phu">
            <div>
              <span className="bs-ten">Đạm</span>
              <span className="bs-val so">{ketQua.dam}g</span>
            </div>
            <div>
              <span className="bs-ten">Carb</span>
              <span className="bs-val so">{ketQua.carb}g</span>
            </div>
            <div>
              <span className="bs-ten">Béo</span>
              <span className="bs-val so">{ketQua.beo}g</span>
            </div>
          </div>
        </div>

        <div className="giai-thich">
          Cơ thể bạn đốt khoảng <b>{ketQua.tdee} kcal</b> mỗi ngày kể cả lúc nghỉ (BMR {ketQua.bmr}).
          BMI hiện tại <b>{ketQua.bmi.toFixed(1)}</b> — {ketQua.xep.ten}.
          {Math.abs(toc) > 0.05 && (
            <>
              {" "}
              Với mức này, cân nặng thay đổi khoảng{" "}
              <b>
                {toc > 0 ? "+" : "−"}
                {Math.abs(toc).toFixed(2)}kg mỗi tuần
              </b>{" "}
              nếu bạn theo đều.
            </>
          )}
        </div>

        {ketQua.canhBao.map((c, i) => (
          <div className="canh-bao" key={i}>
            {c}
          </div>
        ))}

        {loi && <div className="loi">{loi}</div>}

        {buoc === "doc" ? (
          <div className="dang-doc-tam" style={{ marginTop: 16 }}>
            <div className="vach">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="chu">Đang soạn gợi ý ăn uống cho bạn…</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              className="nut mo"
              onClick={() => {
                ghiHoSo(hs);
                xong();
              }}
            >
              Lưu thôi
            </button>
            <button className="nut" style={{ flex: 1 }} onClick={luuVaXinTuVan}>
              Xin gợi ý ăn uống
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── bước 3: tư vấn ── */
  return (
    <div className="hoso">
      <div className="hoso-de">
        <span className="eyebrow">Gợi ý cho mục tiêu {tim(MUC_TIEU, hs.mucTieu).ten.toLowerCase()}</span>
        <button className="lien-ket" onClick={() => setBuoc("xem")}>
          Xem số
        </button>
      </div>

      {tuVan.tomTat && <div className="tom-tat">{tuVan.tomTat}</div>}

      {tuVan.nenAn?.length > 0 && (
        <div className="muc-tv">
          <div className="tv-de nen">Nên ăn thêm</div>
          {tuVan.nenAn.map((x, i) => (
            <div className="tv-dong" key={i}>
              <div className="tv-ten">{x.ten}</div>
              <div className="tv-vi">{x.viSao}</div>
            </div>
          ))}
        </div>
      )}

      {tuVan.hanChe?.length > 0 && (
        <div className="muc-tv">
          <div className="tv-de han">Nên bớt lại</div>
          {tuVan.hanChe.map((x, i) => (
            <div className="tv-dong" key={i}>
              <div className="tv-ten">{x.ten}</div>
              <div className="tv-vi">{x.viSao}</div>
            </div>
          ))}
        </div>
      )}

      {tuVan.buaMau && (
        <div className="muc-tv">
          <div className="tv-de mau">Một ngày ăn mẫu</div>
          {[
            ["Sáng", tuVan.buaMau.sang],
            ["Trưa", tuVan.buaMau.trua],
            ["Tối", tuVan.buaMau.toi],
            ["Phụ", tuVan.buaMau.phu],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div className="bua-dong" key={k}>
                <span className="bua-ten">{k}</span>
                <span className="bua-noi">{v}</span>
              </div>
            ))}
        </div>
      )}

      {tuVan.thoiQuen?.length > 0 && (
        <div className="muc-tv">
          <div className="tv-de">Thói quen nhỏ</div>
          <ul className="thoi-quen">
            {tuVan.thoiQuen.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {tuVan.luuY && <div className="canh-bao">{tuVan.luuY}</div>}

      <div className="tv-chan">
        Gợi ý này dựa trên con số bạn nhập, không thay được lời khuyên của bác sĩ hay chuyên gia dinh
        dưỡng — nhất là khi bạn đang có bệnh nền, đang dùng thuốc, hoặc thấy cơ thể khác lạ.
      </div>

      <button className="nut rong than" onClick={xong}>
        Dùng mục tiêu này
      </button>
    </div>
  );
}

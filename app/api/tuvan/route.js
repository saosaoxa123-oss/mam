export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ loi: "Chưa cấu hình GEMINI_API_KEY." }, { status: 500 });
  }

  let hoSo, mucTieu, ganDay, moTaAn;
  try {
    ({ hoSo, mucTieu, ganDay, moTaAn } = await req.json());
  } catch {
    return Response.json({ loi: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (!hoSo || !mucTieu) {
    return Response.json({ loi: "Thiếu thông tin hồ sơ." }, { status: 400 });
  }

  const anGanDay = ganDay
    ? `App đã ghi nhận ${ganDay.soNgay} ngày gần đây: trung bình ${ganDay.calo} kcal và ${ganDay.dam}g đạm mỗi ngày. Các món hay ăn: ${ganDay.mon.join(", ")}.`
    : "Chưa có dữ liệu ăn uống được ghi lại trong app.";

  const tuKe = (moTaAn || "").trim().slice(0, 600);

  const loiNhac = `Bạn là chuyên gia dinh dưỡng người Việt, đang tư vấn cho một người dùng app ghi calo. Viết bằng tiếng Việt, giọng thân thiện và thực tế, dành cho người sống ở Việt Nam với ngân sách sinh viên.

Hồ sơ:
- Giới tính: ${hoSo.gioiTinh === "nam" ? "Nam" : "Nữ"}, ${hoSo.tuoi} tuổi
- Cao ${hoSo.chieuCao}cm, nặng ${hoSo.canNang}kg, BMI ${mucTieu.bmi.toFixed(1)} (${mucTieu.xep.ten})
- Mức vận động: ${hoSo.vanDongTen}
- Mục tiêu: ${hoSo.mucTieuTen}

Mục tiêu mỗi ngày ĐÃ ĐƯỢC TÍNH SẴN bằng công thức, bạn KHÔNG được tính lại hay đề xuất con số khác:
- ${mucTieu.calo} kcal, ${mucTieu.dam}g đạm, ${mucTieu.carb}g carb, ${mucTieu.beo}g béo
- TDEE ước tính ${mucTieu.tdee} kcal

${anGanDay}
${tuKe ? `Người dùng tự mô tả chế độ ăn gần đây: """${tuKe}"""` : ""}

Trả về JSON đúng dạng:
{"tomTat":"","nenAn":[{"ten":"","viSao":""}],"hanChe":[{"ten":"","viSao":""}],"buaMau":{"sang":"","trua":"","toi":"","phu":""},"thoiQuen":["",""],"luuY":""}

Quy tắc:
- "tomTat": 2–3 câu nói thẳng điều quan trọng nhất người này cần thay đổi. Nếu có dữ liệu ăn gần đây, nhận xét dựa trên đó chứ đừng nói chung chung.
- "nenAn": 4–6 món hoặc nhóm thực phẩm CỤ THỂ, dễ mua ở Việt Nam (chợ, tạp hoá, quán cơm). Ưu tiên đồ rẻ. "viSao" một câu ngắn.
- "hanChe": 3–4 thứ nên giảm, gắn với thói quen ăn uống thực tế của người Việt. "viSao" một câu ngắn.
- "buaMau": gợi ý một ngày ăn mẫu, mỗi bữa một câu, dùng món Việt quen thuộc, tổng lượng khớp với mục tiêu calo ở trên. "phu" là bữa phụ, có thể để chuỗi rỗng nếu không cần.
- "thoiQuen": 2–3 thói quen nhỏ dễ làm, không phải lời khuyên sáo rỗng.
- "luuY": một câu. Nếu có gì cần cẩn thận về sức khoẻ thì nói ở đây, kèm gợi ý gặp bác sĩ hoặc chuyên gia dinh dưỡng khi cần. Không có thì để chuỗi rỗng.
- Không doạ nạt, không phán xét cân nặng, không hứa hẹn kết quả nhanh. Không nhắc tới việc nhịn ăn kéo dài hay cắt hẳn một nhóm chất.`;

  const model = process.env.MAM_MODEL || "gemini-flash-latest";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: loiNhac }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      const chiTiet = await res.text();
      console.error("Gemini loi:", res.status, chiTiet);
      if (res.status === 429) {
        return Response.json(
          { loi: "Hết lượt miễn phí hôm nay. Mục tiêu đã lưu rồi, mai xin tư vấn cũng được." },
          { status: 429 }
        );
      }
      let mo = chiTiet;
      try {
        mo = JSON.parse(chiTiet)?.error?.message || chiTiet;
      } catch {}
      return Response.json({ loi: `Lỗi ${res.status}: ${mo}` }, { status: 502 });
    }

    const data = await res.json();
    const chu = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    if (!chu) return Response.json({ loi: "Không nhận được tư vấn. Thử lại nhé." }, { status: 502 });
    return Response.json(JSON.parse(chu));
  } catch (e) {
    console.error(e);
    return Response.json({ loi: "Không đọc được kết quả tư vấn." }, { status: 500 });
  }
}

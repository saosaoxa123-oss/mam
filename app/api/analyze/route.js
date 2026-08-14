export const runtime = "nodejs";
export const maxDuration = 60;

const CO_BAN = `Bạn là chuyên gia dinh dưỡng người Việt. Ước tính các món ăn/thức uống trong ảnh. Ưu tiên nhận diện đúng món Việt (cơm tấm, bún bò, phở, bánh mì, hủ tiếu, bánh cuốn, gỏi cuốn, chè, trà sữa...). Ước lượng khẩu phần bằng mắt thường, lấy bát/đĩa/thìa/lon nước trong ảnh làm mốc so sánh.

Trả về JSON đúng dạng sau:
{"mon":[{"ten":"","uocluong":"","calo":0,"protein":0,"carb":0,"fat":0}],"tincay":"cao","luuy":""}

Quy tắc:
- calo tính kcal, protein/carb/fat tính gram, tất cả là số nguyên.
- "uocluong" ví dụ "~250g" hoặc "1 tô vừa".
- "tincay" là một trong: cao, trung bình, thấp.
- "luuy" là 1 câu tiếng Việt ngắn về thứ dễ làm con số sai lệch (nước dùng, dầu chiên, đường trong nước chấm...). Không có gì đáng nói thì để chuỗi rỗng.
- Nếu không có đồ ăn: "mon" là mảng rỗng, "luuy" ghi "Không thấy đồ ăn trong ảnh".`;

const NHIEU_ANH = `

Các ảnh dưới đây chụp CÙNG MỘT BỮA ăn từ nhiều góc hoặc nhiều khoảng cách khác nhau. Hãy gộp thông tin từ tất cả các ảnh để ước tính chính xác hơn, KHÔNG cộng dồn thành nhiều phần. Mỗi món chỉ liệt kê một lần, kể cả khi nó xuất hiện trong nhiều ảnh.`;

const coMoTa = (moTa) => `

Người ăn mô tả thêm về bữa này. Thông tin này do chính người ăn cung cấp nên ĐÁNG TIN HƠN những gì bạn đoán từ ảnh — ưu tiên dùng nó khi có mâu thuẫn:
"""
${moTa}
"""`;

export async function POST(req) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ loi: "Chưa cấu hình GEMINI_API_KEY." }, { status: 500 });
  }

  let anhs, moTa;
  try {
    ({ anhs, moTa } = await req.json());
  } catch {
    return Response.json({ loi: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (!Array.isArray(anhs) || anhs.length === 0) {
    return Response.json({ loi: "Chưa có ảnh nào." }, { status: 400 });
  }
  if (anhs.length > 4) {
    return Response.json({ loi: "Mỗi lần tối đa 4 ảnh." }, { status: 400 });
  }

  const ghiChu = typeof moTa === "string" ? moTa.trim().slice(0, 500) : "";

  let loiNhac = CO_BAN;
  if (anhs.length > 1) loiNhac += NHIEU_ANH;
  if (ghiChu) loiNhac += coMoTa(ghiChu);

  const parts = anhs.map((a) => ({
    inline_data: {
      mime_type: "image/jpeg",
      data: typeof a === "string" && a.includes(",") ? a.split(",")[1] : a,
    },
  }));
  parts.push({ text: loiNhac });

  const model = process.env.MAM_MODEL || "gemini-flash-latest";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      const chiTiet = await res.text();
      console.error("Gemini loi:", res.status, chiTiet);
      if (res.status === 429) {
        return Response.json(
          { loi: "Hết lượt miễn phí hôm nay hoặc bấm quá nhanh. Đợi một lát rồi thử lại." },
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

    if (!chu) {
      return Response.json({ loi: "Ảnh này bị từ chối xử lý. Thử ảnh khác nhé." }, { status: 502 });
    }

    return Response.json(JSON.parse(chu));
  } catch (e) {
    console.error(e);
    return Response.json({ loi: "Không đọc được kết quả phân tích." }, { status: 500 });
  }
}

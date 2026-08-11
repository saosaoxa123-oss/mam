export const runtime = "nodejs";
export const maxDuration = 60;

const LOI_NHAC = `Bạn là chuyên gia dinh dưỡng người Việt. Nhìn ảnh và ước tính các món ăn/thức uống có trong ảnh. Ưu tiên nhận diện đúng món Việt (cơm tấm, bún bò, phở, bánh mì, hủ tiếu, bánh cuốn, chè, trà sữa...). Ước lượng khẩu phần bằng mắt thường, lấy bát/đĩa/thìa/lon nước trong ảnh làm mốc so sánh.

Trả về JSON đúng dạng sau:
{"mon":[{"ten":"","uocluong":"","calo":0,"protein":0,"carb":0,"fat":0}],"tong":{"calo":0,"protein":0,"carb":0,"fat":0},"tincay":"cao","luuy":""}

Quy tắc:
- calo tính kcal, protein/carb/fat tính gram, tất cả là số nguyên.
- "uocluong" ví dụ "~250g" hoặc "1 tô vừa".
- "tincay" là một trong: cao, trung bình, thấp.
- "luuy" là 1 câu tiếng Việt ngắn về thứ dễ làm con số sai lệch.
- Nếu ảnh không có đồ ăn: "mon" là mảng rỗng, mọi số bằng 0, "luuy" ghi "Không thấy đồ ăn trong ảnh".`;

export async function POST(req) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ loi: "Chưa cấu hình GEMINI_API_KEY." }, { status: 500 });
  }

  let anh;
  try {
    ({ anh } = await req.json());
  } catch {
    return Response.json({ loi: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (!anh || typeof anh !== "string") {
    return Response.json({ loi: "Thiếu ảnh." }, { status: 400 });
  }

  const dulieu = anh.includes(",") ? anh.split(",")[1] : anh;
  const model = process.env.MAM_MODEL || "gemini-2.5-flash";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: "image/jpeg", data: dulieu } },
                { text: LOI_NHAC },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      const chiTiet = await res.text();
      console.error("Gemini loi:", res.status, chiTiet);
      let mo = chiTiet;
      try {
        mo = JSON.parse(chiTiet)?.error?.message || chiTiet;
      } catch {}
      if (res.status === 429) {
        return Response.json(
          { loi: "Hết lượt miễn phí trong hôm nay hoặc bấm quá nhanh. Đợi một lát rồi thử lại." },
          { status: 429 }
        );
      }
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

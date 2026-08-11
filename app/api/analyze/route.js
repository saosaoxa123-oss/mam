export const runtime = "nodejs";
export const maxDuration = 60;

const LOI_NHAC = `Bạn là chuyên gia dinh dưỡng người Việt. Nhìn ảnh và ước tính các món ăn/thức uống có trong ảnh. Ưu tiên nhận diện đúng món Việt (cơm tấm, bún bò, phở, bánh mì, hủ tiếu, bánh cuốn, chè, trà sữa...). Ước lượng khẩu phần bằng mắt thường, lấy bát/đĩa/thìa/lon nước trong ảnh làm mốc so sánh.

Chỉ trả về JSON thuần, không markdown, không giải thích, đúng dạng sau:
{"mon":[{"ten":"","uocluong":"","calo":0,"protein":0,"carb":0,"fat":0}],"tong":{"calo":0,"protein":0,"carb":0,"fat":0},"tincay":"cao","luuy":""}

Quy tắc:
- calo tính kcal, protein/carb/fat tính gram, tất cả là số nguyên.
- "uocluong" ví dụ "~250g" hoặc "1 tô vừa".
- "tincay" là một trong: cao, trung bình, thấp.
- "luuy" là 1 câu tiếng Việt ngắn về thứ dễ làm con số sai lệch.
- Nếu ảnh không có đồ ăn: "mon" là mảng rỗng, mọi số bằng 0, "luuy" ghi "Không thấy đồ ăn trong ảnh".`;

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({ loi: "Chưa cấu hình ANTHROPIC_API_KEY." }, { status: 500 });
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

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.MAM_MODEL || "claude-sonnet-5",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: dulieu },
              },
              { type: "text", text: LOI_NHAC },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const chiTiet = await res.text();
      console.error("Anthropic loi:", res.status, chiTiet);
      let mo = chiTiet;
      try {
        mo = JSON.parse(chiTiet)?.error?.message || chiTiet;
      } catch {}
      return Response.json({ loi: `Lỗi ${res.status}: ${mo}` }, { status: 502 });
    }

    const data = await res.json();
    const chu = (data.content || [])
      .map((i) => (i.type === "text" ? i.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    return Response.json(JSON.parse(chu));
  } catch (e) {
    console.error(e);
    return Response.json({ loi: "Không đọc được kết quả phân tích." }, { status: 500 });
  }
}

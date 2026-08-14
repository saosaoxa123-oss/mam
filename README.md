# MÂM

Chụp một hoặc nhiều ảnh bữa ăn, thêm mô tả nếu muốn → AI ước tính calo, đạm, carb, béo → lưu vào nhật ký theo ngày.

Next.js 14 (App Router). API key nằm ở server, trình duyệt không thấy được. Cài lên màn hình chính điện thoại là dùng như app thật (PWA), không cần lên chợ ứng dụng.

---

## Chạy trên máy

Cần Node.js 18 trở lên.

```bash
npm install
cp .env.example .env.local
```

Mở `.env.local`, dán API key vào:

```
GEMINI_API_KEY=AIza...
```

Lấy key ở https://aistudio.google.com/apikey → Create API key. Miễn phí, không cần thẻ.

```bash
npm run dev
```

Mở http://localhost:3000

Muốn thử bằng điện thoại khi đang dev: chạy `npm run dev -- -H 0.0.0.0` rồi vào `http://<IP-máy-tính>:3000` trên điện thoại cùng Wi-Fi. Lưu ý camera chỉ mở được trên `localhost` hoặc HTTPS — nên trên điện thoại hãy đợi deploy xong rồi thử.

---

## Đưa lên mạng (Vercel, miễn phí)

1. Đẩy code lên GitHub:

```bash
git init
git add .
git commit -m "Mâm"
git remote add origin <link-repo-của-bạn>
git push -u origin main
```

2. Vào https://vercel.com → **Add New → Project** → chọn repo vừa đẩy.
3. Ở bước cấu hình, mở **Environment Variables**, thêm:
   - Name: `GEMINI_API_KEY`
   - Value: key của bạn
4. Bấm **Deploy**. Khoảng 1 phút là xong, được link dạng `mam-abc.vercel.app`.

---

## Cài lên màn hình chính

- **Android (Chrome):** mở link → menu ⋮ → *Thêm vào Màn hình chính*
- **iPhone (Safari):** mở link → nút Chia sẻ → *Thêm vào MH chính*

Sau đó mở lên là chạy toàn màn hình, có icon riêng, không thấy thanh địa chỉ.

---

## Cách dùng

1. Bấm **Chụp món ăn** — chọn hoặc chụp ảnh.
2. Muốn chính xác hơn thì bấm **Thêm ảnh**: một góc nghiêng hoặc một tấm cận cảnh giúp AI ước lượng khẩu phần sát hơn. Tối đa 4 ảnh cho một bữa.
3. Ô **Mô tả thêm** để trống cũng được. Nếu điền, AI sẽ tin mô tả hơn những gì nó đoán từ ảnh — hữu ích khi ảnh dễ gây hiểu nhầm: "tô lớn", "ít bún nhiều thịt", "không ăn hết phần cơm".
4. Bấm **Phân tích**, xem kết quả, chỉnh số phần nếu cần, rồi **Lưu vào nhật ký**.

Nhiều ảnh của cùng một bữa được gộp lại thành một kết quả, không bị cộng dồn thành nhiều phần.

---

## Mục tiêu cá nhân & gợi ý ăn uống

Bấm **Đặt mục tiêu cho riêng bạn** trên màn hình chính. Nhập giới tính, tuổi, chiều cao, cân nặng, mức vận động và điều bạn muốn (giảm cân, cắt mỡ, giữ dáng, tăng cơ, tăng cân). Ô mô tả chế độ ăn gần đây để trống cũng được.

**Con số tính bằng công thức, không hỏi AI.** BMR theo Mifflin–St Jeor, nhân hệ số vận động ra TDEE, rồi điều chỉnh theo mục tiêu. Cùng một hồ sơ luôn ra cùng một con số. Toàn bộ nằm trong `lib/dinhduong.js`, không gọi mạng.

**AI chỉ lo phần lời khuyên**: nên ăn gì, bớt gì, một ngày ăn mẫu bằng món Việt. Nếu app đã có dữ liệu vài ngày, nó gửi kèm mức calo/đạm trung bình và các món hay ăn để lời khuyên bám vào thực tế thay vì nói chung chung.

### Ngưỡng an toàn đã cài sẵn

| Tình huống | App làm gì |
| --- | --- |
| Mục tiêu tính ra dưới 1500 kcal (nam) hoặc 1200 kcal (nữ) | Nâng lên đúng mức sàn, kèm giải thích |
| BMI dưới 18.5 nhưng chọn mục tiêu giảm | Đặt mức giữ cân thay vì mức giảm, khuyên gặp bác sĩ |
| Đạm tính ra quá cao so với tổng calo | Kẹp trần ở 35% tổng năng lượng |

Sửa các ngưỡng này ở `SAN_CALO` và hàm `tinhMucTieu` trong `lib/dinhduong.js`. Đổi hệ số vận động hay mức tăng/giảm theo mục tiêu thì sửa mảng `VAN_DONG` và `MUC_TIEU` cùng file.

---

## Cấu trúc

```
app/
  layout.js              khai báo PWA, font, meta
  page.js                trang chính
  globals.css            toàn bộ giao diện
  api/analyze/route.js   gọi Anthropic API (chạy ở server)
components/Mam.js        màn hình chính: chụp, phân tích, nhật ký
lib/kho.js               đọc/ghi dữ liệu trên máy (localStorage)
public/                  icon, manifest, service worker
```

---

## Chỉnh những thứ hay đụng tới

| Muốn đổi | Sửa ở đâu |
| --- | --- |
| Cách AI ước tính, thêm món Việt cần nhận đúng | `LOI_NHAC` trong `app/api/analyze/route.js` |
| Đổi model | biến `MAM_MODEL` trong `.env.local` |
| Màu sắc, font | khối `:root` đầu file `app/globals.css` |
| Mục tiêu calo/đạm mặc định | `docMucTieu()` trong `lib/kho.js` |
| Chất lượng/kích thước ảnh gửi đi | hàm `nenAnh()` trong `components/Mam.js` |

**Model**: mặc định `gemini-flash-latest` — tên này luôn trỏ tới bản Flash mới nhất nên không bị lỗi 404 khi Google ngừng một model cũ. Muốn cố định thì đặt `MAM_MODEL=gemini-3.6-flash`.

Gói miễn phí của Google có hạn mức theo ngày. Đụng trần thì đợi hôm sau, hoặc đổi sang `gemini-flash-lite-latest`.

Lưu ý: gửi nhiều ảnh một lúc thì tốn hạn mức nhiều hơn một chút, nhưng vẫn tính là một lượt gọi.

---

## Muốn đi xa hơn

Dữ liệu hiện lưu trên máy, xoá app là mất, đổi máy không thấy. Nếu cần đồng bộ và đăng nhập:

1. Tạo project Supabase (free), bật Auth.
2. Tạo bảng `bua_an` với các cột: `id`, `user_id`, `ngay`, `gio`, `ten`, `calo`, `protein`.
3. Thay các hàm trong `lib/kho.js` bằng lệnh gọi Supabase — phần còn lại của app không phải sửa gì, vì mọi thao tác đọc/ghi đều đi qua file đó.

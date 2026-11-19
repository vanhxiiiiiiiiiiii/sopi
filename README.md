# Sopi — Frontend

Giao diện Vue 3 cho bài tập lớn cơ sở dữ liệu thương mại điện tử. Backend Laravel/MySQL nằm tại [sopi-backend](https://github.com/vanhxiiiiiiiiiiii/sopi-backend).

## Chức năng

- Tìm kiếm, lọc sản phẩm, biến thể, giỏ hàng và checkout COD.
- Theo dõi đơn hàng, mua lại, đánh giá, voucher và thông tin tài khoản.
- Kênh người bán: sản phẩm, cửa hàng, xác nhận và chuẩn bị đơn hàng.
- Ba vai trò quản trị: Super Admin, Admin mua bán, Admin vận chuyển.
- Kênh nhân viên vận chuyển: tiến độ giao nhận, lịch sử và xác nhận thu COD.
- Số sao sản phẩm theo điểm thực tế, hỗ trợ điểm lẻ.

## Chạy local

Cần Node.js 22 và pnpm 9.15.9. Khởi động backend tại `http://127.0.0.1:9000` trước.

```powershell
git clone https://github.com/vanhxiiiiiiiiiiii/sopi.git
cd sopi
Copy-Item .env.example .env.local
npx pnpm@9.15.9 install --frozen-lockfile
npx pnpm@9.15.9 dev
```

`VITE_BASE_DOMAIN` trong `.env.local` là địa chỉ backend. Khi triển khai, cấu hình biến này theo địa chỉ API thật.

| Trang | Đường dẫn |
| --- | --- |
| Trang chủ | http://127.0.0.1:3333/buyer/home |
| Đăng nhập admin | http://127.0.0.1:3333/admin/login |
| Phân quyền | http://127.0.0.1:3333/admin/administrators |
| Admin mua bán | http://127.0.0.1:3333/admin/commerce |
| Admin vận chuyển | http://127.0.0.1:3333/admin/shipping/shipments |
| Nhân viên giao hàng | http://127.0.0.1:3333/delivery/login |

Tài khoản chuyên môn được Super Admin tạo trong trang phân quyền; dữ liệu tài khoản local không được đưa lên GitHub.

## Build

```powershell
npx pnpm@9.15.9 build
```

GitHub Actions cài dependencies theo lockfile và build frontend. Không commit `.env.local`, dependencies hoặc thư mục `dist`.

## Nguồn gốc

Phát triển từ [thuongtruong1009/e-shopee](https://github.com/thuongtruong1009/e-shopee). Thông tin tác giả và giấy phép MIT của mã nguồn gốc được giữ trong dự án.

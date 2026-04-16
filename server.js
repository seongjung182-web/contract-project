const express = require("express");
const QRCode = require("qrcode");

const app = express();
const PORT = process.env.PORT || 3000;

// ⭐ 중요: Render용 URL
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// 메인 페이지
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중");
});

// QR 생성
app.get("/qr/:name", async (req, res) => {
  const name = req.params.name;

  const url = `${BASE_URL}/contract/${encodeURIComponent(name)}`;

  try {
    const qr = await QRCode.toDataURL(url);

    res.send(`
      <h2>${name} 계약서 QR</h2>
      <img src="${qr}" />
      <p>${url}</p>
    `);
  } catch (err) {
    res.send("QR 생성 오류");
  }
});

// 계약서 페이지
app.get("/contract/:name", (req, res) => {
  const name = req.params.name;

  res.send(`
    <h1>근로계약서</h1>
    <p>이름: ${name}</p>
    <p>서명: __________________</p>
  `);
});

app.listen(PORT, () => {
  console.log("서버 실행중");
});
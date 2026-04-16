const express = require('express');
const xlsx = require('xlsx');
const fs = require('fs');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;


// ✅ 메인 페이지 (NOT FOUND 방지)
app.get('/', (req, res) => {
    res.send('서버 정상 작동 중');
});


// 엑셀 읽기
function getEmployees() {
    const workbook = xlsx.readFile('employees.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
}


// 계약서 페이지
app.get('/contract/:name', (req, res) => {
    const emp = getEmployees().find(e => e.name === req.params.name);
    if (!emp) return res.send('직원 없음');

    let html = fs.readFileSync('template.html', 'utf8');

    html = html.replace('{{name}}', emp.name)
               .replace('{{rrn}}', emp.rrn)
               .replace('{{address}}', emp.address)
               .replace('{{phone}}', emp.phone)
               .replace('{{bank}}', emp.bank)
               .replace('{{account}}', emp.account)
               .replace('{{site}}', emp.site)
               .replace('{{job}}', emp.job)
               .replace('{{daily_pay}}', emp.daily_pay)
               .replace('{{signature}}', '');

    res.send(html);
});


// QR 코드 생성
app.get('/qr/:name', async (req, res) => {
    const url = `${BASE_URL}/contract/${req.params.name}`;
    const qr = await QRCode.toDataURL(url);

    res.send(`
        <h2>${req.params.name}</h2>
        <img src="${qr}" />
        <p>${url}</p>
    `);
});


// 서명 + PDF 저장
app.post('/sign', async (req, res) => {
    const { name, signature } = req.body;

    const emp = getEmployees().find(e => e.name === name);

    let html = fs.readFileSync('template.html', 'utf8');

    html = html.replace('{{name}}', emp.name)
               .replace('{{rrn}}', emp.rrn)
               .replace('{{address}}', emp.address)
               .replace('{{phone}}', emp.phone)
               .replace('{{bank}}', emp.bank)
               .replace('{{account}}', emp.account)
               .replace('{{site}}', emp.site)
               .replace('{{job}}', emp.job)
               .replace('{{daily_pay}}', emp.daily_pay)
               .replace('{{signature}}', signature);

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html);

    await page.pdf({
        path: `contract_${name}.pdf`,
        format: 'A4'
    });

    await browser.close();

    res.send('완료');
});


// 서버 실행
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버 실행됨: ${BASE_URL}`);
});
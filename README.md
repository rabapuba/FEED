# FEED PRO: Ultra-Low Latency Polymarket Up/Down 5M & Chainlink TWAP Trading Terminal

Terminal trading profesional berlatensi ultra-rendah untuk pasar **Polymarket Up / Down 5 Menit** (BTC, ETH, SOL) dengan visualisasi multi-timeframe (`5s`, `15s`, `30s`, `1m`, `5m`, `15m`), pelacakan matematis real-time **Chainlink TWAP**, buku order CLOB kedalaman penuh, dan antarmuka responsif optimal untuk layar PC maupun Android/smartphone.

---

## Fitur Utama

### 1. Chart TradingView Profesional Multi-Timeframe
- **Multi-Resolusi Standar Crypto**: Pilihan timeframe lengkap dari mikro-candlestick `5s`, `15s`, `30s` (krusial untuk mengamati momentum detik-detik akhir penutupan ronde), hingga `1m`, `5m`, dan `15m`.
- **Dukungan Tipe Chart Fleksibel**: Beralih instan antara **Candlestick**, **Heikin Ashi** (trend smoothed), dan **Area Line**.
- **Dynamic Strike Zone & Baseline**: Garis strike price presisi tinggi dengan indikator profit zone di atas strike dan loss zone di bawah strike.
- **Overlay Chainlink TWAP**: Garis akumulasi real-time TWAP (warna ungu neon) yang berjalan bersama candlestick.
- **Volume Histogram**: Baris volume terintegrasi di bagian bawah chart.
- **Interactive Legend**: Tooltip melayang responsif yang menampilkan nilai Open, High, Low, Close, Volume, dan Delta Strike saat cursor digerakkan atau layar disentuh.

### 2. Mesin Akumulasi Chainlink TWAP & Breakeven Flip Calculator
- Pasar 5-menit Polymarket diselesaikan berdasarkan benchmark **Chainlink TWAP 60s Stream**.
- Menghitung secara real-time:
  - **Strike Benchmark ($)**: Harga pembukaan persis pada detik `00:00` jendela 5 menit.
  - **Running TWAP ($)**: Rata-rata terbobot waktu yang terakumulasi setiap detiknya.
  - **Strike & TWAP Delta ($\Delta$)**: Selisih nominal ($) dan persentase (%) terhadap harga strike.
  - **Target Harga Balik (Price to Flip)**:
    $$\text{Target} = \frac{\text{Strike} \times 300 - \text{TWAP}_{\text{elapsed}} \times t_{\text{elapsed}}}{300 - t_{\text{elapsed}}}$$
    Mengetahui secara matematis harga rata-rata yang harus dijaga spot selama sisa detik agar kontrak berbalik arah.

### 3. Arsitektur Latensi Ultra-Rendah (Zero-Lag Pipeline)
- **Direct Binance AggTrade WebSocket Stream**: Mengalirkan tick harga spot dengan delay < 20ms langsung dari server bursa.
- **Polymarket CLOB WebSocket & REST Fallback**: Sinkronisasi kontinu buku order L2 dan live executed trades tape.
- **RAF Rendering Throttling**: Pemisahan update memori tick dengan antarmuka React via `requestAnimationFrame` untuk menjamin animasi 60 FPS tanpa frame drop pada smartphone Android.

### 4. Desain Responsif & Ramah Layar PC dan Android
- **PC Layout**: Grid bursa pro (TradingView / Binance Pro style) dengan panel chart utama, probabilitas ringkas, order book CLOB, tape transaksi, dan analitik settlement.
- **Android / Mobile Layout**: Tab navigasi bawah (`CHART`, `BOOK`, `TRADES`, `TWAP`), header countdown sticky yang tidak tertutup keyboard, dan optimasi gestur sentuh (pinch-to-zoom & pan).

---

## Cara Menjalankan Secara Lokal

Pastikan Anda memiliki [Bun](https://bun.sh) atau Node.js v18+:

```bash
# Clone repositori
git clone https://github.com/rabapuba/polymarket-feed-pro.git
cd polymarket-feed-pro

# Install dependensi
bun install
# atau: npm install

# Jalankan server development
bun run dev
# atau: npm run dev
```

Buka peramban di `http://localhost:5173`.

---

## Panduan Deploy ke Vercel

Repositori ini sudah siap untuk di-deploy ke Vercel tanpa konfigurasi tambahan:

1. Buka [Vercel Dashboard](https://vercel.com/new).
2. Impor repositori **`rabapuba/polymarket-feed-pro`**.
3. Framework Preset: **Vite**.
4. Build Command: `bun run build` atau `npm run build`.
5. Output Directory: `dist`.
6. Klik **Deploy**.

---

## Lisensi
MIT License - Dibuat untuk ekosistem analitik Polymarket berkecepatan tinggi.

# ⚠️ Concentra — Risiko Teknis & Strategi Mitigasi

## 1. Daftar Risiko

### 🔴 Risiko Tinggi (High Impact / High Probability)

---

#### R1: Performance Degradation dari Face Detection
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | MediaPipe Face Landmarker berjalan di setiap frame dapat memperlambat browser secara signifikan, terutama pada device low-end |
| **Impact** | Tinggi — UX buruk, browser lag, user abandon |
| **Probability** | Tinggi — Face detection membutuhkan resource komputasi besar |
| **Mitigasi** | |
| | 1. **Frame skipping**: Deteksi hanya 1-2x per detik, bukan setiap frame |
| | 2. **Adaptive quality**: Kurangi resolusi video berdasarkan CPU usage |
| | 3. **Web Worker**: Pindahkan face detection ke Web Worker/OffscreenCanvas |
| | 4. **Model selection**: Gunakan model `lite` untuk device low-end |
| | 5. **Performance monitoring**: Pantau FPS dan auto-adjust |

---

#### R2: MediaPipe WASM Loading di Content Script
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | MediaPipe Tasks Vision membutuhkan WASM module yang harus di-load di content script, dapat terblokir oleh CSP halaman host |
| **Impact** | Tinggi — Face detection gagal total |
| **Probability** | Tinggi — Banyak website memiliki CSP ketat |
| **Mitigasi** | |
| | 1. Bundle WASM files sebagai `web_accessible_resources` di extension |
| | 2. Gunakan `wasm-unsafe-eval` di extension CSP |
| | 3. Load MediaPipe di sandbox iframe jika CSP halaman menghalangi |
| | 4. Fallback: load di offscreen document (Chrome API) |

---

#### R3: Chrome Extension Manifest V3 Service Worker Limitations
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Background Service Worker di MV3 bersifat event-driven dan bisa di-terminate setelah 30 detik idle |
| **Impact** | Tinggi — Data sync terganggu, session state hilang |
| **Probability** | Sedang — Terjadi saat user tidak aktif di popup |
| **Mitigasi** | |
| | 1. Gunakan `chrome.alarms` untuk keep-alive setiap 25 detik |
| | 2. Persist session state di `chrome.storage.session` |
| | 3. Content script handle data buffering secara mandiri |
| | 4. Re-initialize state saat service worker restart |
| | 5. Gunakan `chrome.offscreen` API untuk persistent processing jika diperlukan |

---

#### R4: Camera Permission Issues
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Browser dapat menolak camera access dari content script, atau user menolak permission. Beberapa site seperti Google Meet sudah menggunakan camera |
| **Impact** | Tinggi — Face detection tidak bisa dimulai |
| **Probability** | Sedang — Tergantung konteks halaman |
| **Mitigasi** | |
| | 1. Minta permission dari popup/extension page terlebih dahulu |
| | 2. Handle `NotAllowedError` dan `NotFoundError` dengan UI yang jelas |
| | 3. Untuk site yang sudah pakai camera: gunakan screen-shared video atau overlay hint |
| | 4. Sediakan panduan troubleshooting permission |
| | 5. Gunakan `navigator.permissions.query()` untuk pre-check |

---

### 🟡 Risiko Sedang (Medium Impact / Medium Probability)

---

#### R5: Data Loss pada Sinkronisasi
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Focus log data bisa hilang jika browser crash, extension di-unload, atau koneksi internet terputus saat batch sync |
| **Impact** | Sedang — Data sesi tidak lengkap |
| **Probability** | Sedang — Terutama pada koneksi tidak stabil |
| **Mitigasi** | |
| | 1. Buffer data di `chrome.storage.local` sebelum sync |
| | 2. Implement retry dengan exponential backoff (3x) |
| | 3. Offline queue yang sync otomatis saat online |
| | 4. Checksum/sequence numbering untuk detect missing data |
| | 5. Toleransi data gap di report generation |

---

#### R6: Cross-site Content Script Compatibility
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Content script mungkin conflict dengan JavaScript framework atau DOM structure site tertentu (Google Meet, Zoom, Coursera masing-masing berbeda) |
| **Impact** | Sedang — Extension tidak berfungsi di beberapa site |
| **Probability** | Sedang — Setiap site punya struktur berbeda |
| **Mitigasi** | |
| | 1. Gunakan Shadow DOM untuk overlay UI (isolasi CSS) |
| | 2. Namespace semua global variables dan CSS class |
| | 3. Test secara khusus di top 5 platform target |
| | 4. Site-specific adapter pattern untuk handle perbedaan |
| | 5. Graceful fallback jika injection gagal |

---

#### R7: JWT Token Management di Extension
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Mengelola JWT refresh token di extension environment yang berbeda dari web app biasa. Token bisa expire saat sesi panjang |
| **Impact** | Sedang — User harus re-login di tengah sesi |
| **Probability** | Sedang — Supabase JWT default expire 1 jam |
| **Mitigasi** | |
| | 1. Implement token refresh di background SW |
| | 2. Set Supabase JWT expiry lebih panjang (6 jam) |
| | 3. Auto-refresh token sebelum expire (5 menit sebelum) |
| | 4. Queue API calls saat token sedang di-refresh |
| | 5. Share auth state antara web app dan extension via `chrome.storage` |

---

#### R8: Database Performance pada Scale
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Tabel `focus_logs` akan berkembang sangat cepat (~10K entries/user/hari). Query analytics bisa lambat |
| **Impact** | Sedang — API response time meningkat |
| **Probability** | Rendah (MVP) → Tinggi (setelah scale) |
| **Mitigasi** | |
| | 1. Index strategy yang tepat (sudah direncanakan) |
| | 2. Table partitioning berdasarkan `recorded_at` (monthly) |
| | 3. Data retention: hapus detail logs > 90 hari |
| | 4. Pre-compute aggregates di report (avoid re-calculation) |
| | 5. Connection pooling dengan pgbouncer/sqlalchemy pool |
| | 6. Read replica untuk analytics queries |

---

### 🟢 Risiko Rendah (Low Impact / Low Probability)

---

#### R9: Head Pose Estimation Accuracy
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Estimasi arah kepala dari 2D landmarks mungkin tidak akurat, terutama pada lighting buruk, occlusion (tangan menutupi wajah), atau posisi kamera ekstrem |
| **Impact** | Rendah — Focus score menjadi kurang akurat |
| **Probability** | Sedang |
| **Mitigasi** | |
| | 1. Kalibrasikan saat awal sesi (record "posisi normal") |
| | 2. Gunakan EMA smoothing untuk mengurangi noise |
| | 3. Set threshold yang generous (bukan terlalu sensitif) |
| | 4. Sediakan opsi manual adjustment di settings |
| | 5. Tampilkan confidence level estimasi |

---

#### R10: Supabase Auth Rate Limiting / Downtime
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Supabase free tier memiliki rate limit dan potensi downtime |
| **Impact** | Rendah — User tidak bisa login sementara |
| **Probability** | Rendah |
| **Mitigasi** | |
| | 1. Cache auth state secara lokal |
| | 2. Offline mode: extension tetap bisa menjalankan detection |
| | 3. Retry logic untuk auth calls |
| | 4. Monitor Supabase status page |
| | 5. Fallback: bisa migrate ke self-hosted auth nanti |

---

#### R11: Chrome Web Store Review & Approval
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Chrome Web Store review bisa menolak extension karena `<all_urls>` permission atau camera usage |
| **Impact** | Rendah (MVP) — Hanya affect distribusi |
| **Probability** | Sedang |
| **Mitigasi** | |
| | 1. Dokumentasikan justifikasi setiap permission |
| | 2. Gunakan `activeTab` + `optional_permissions` untuk minimize upfront permissions |
| | 3. Privacy policy yang jelas |
| | 4. Screenshot dan video demo yang menjelaskan fungsi |
| | 5. MVP: distribusi manual via developer mode |

---

#### R12: CORS & Security Configuration
| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Konfigurasi CORS yang salah bisa menyebabkan API calls gagal dari extension atau frontend |
| **Impact** | Rendah — Mudah diperbaiki |
| **Probability** | Sedang |
| **Mitigasi** | |
| | 1. Whitelist origins: frontend domain + extension origin |
| | 2. Test CORS di development sebelum deploy |
| | 3. Gunakan FastAPI CORSMiddleware dengan konfigurasi eksplisit |
| | 4. Handle preflight OPTIONS requests |

---

## 2. Risk Matrix

```
Impact ▲
       │
High   │  R4     R1  R2
       │         R3
       │
Medium │  R8  R5  R6  R7
       │
Low    │  R12 R10 R9  R11
       │
       └──────────────────►
         Low    Med   High
              Probability
```

## 3. Monitoring & Contingency

| Aspek | Tool/Metode |
|-------|-------------|
| **Error Tracking** | Sentry (free tier) |
| **Performance Monitoring** | Chrome DevTools Performance API |
| **API Monitoring** | FastAPI built-in logging + Railway metrics |
| **Database Monitoring** | Neon dashboard + slow query log |
| **Uptime Monitoring** | UptimeRobot (free) |
| **User Feedback** | In-app feedback form |

## 4. Decision Log

Keputusan teknis yang sudah diambil untuk mitigasi risiko:

| # | Keputusan | Alasan | Trade-off |
|---|-----------|--------|-----------|
| D1 | MediaPipe di client, bukan server | Privacy & latency | CPU usage di browser |
| D2 | Batch sync setiap 30 detik | Balance antara data freshness & API calls | Data delay 30 detik |
| D3 | Supabase Auth, bukan custom auth | Faster development, Google OAuth built-in | Vendor dependency |
| D4 | PostgreSQL over MongoDB | Strong consistency, relational queries, analytics | Schema rigidity |
| D5 | Monorepo over polyrepo | Shared types, easier development | Larger repo size |
| D6 | TailwindCSS | Rapid UI development | Larger CSS bundle (purged) |
| D7 | Zustand over Redux | Simpler API, less boilerplate | Smaller community |
| D8 | FastAPI over Express | Python ecosystem, auto-docs, Pydantic | Different language from frontend |

# รายงานสรุปการตรวจสอบและการเปลี่ยนแปลงโครงการ Rohn-Runner
**ไฟล์อ้างอิง:** `2026-09-06-rohn-runner-1.md`  
**วันที่บันทึก:** 6 กันยายน 2026  
**ขอบเขตโครงการ:** `D:\Tiw\Project_Trail_Running_Hub\Rohn-Runner`  
**สถานะการทำงาน:** ผ่านการผสานโค้ด (Merge), แก้ไข Conflicts, เชื่อมต่อ Supabase และทดสอบ Build สำเร็จ 100%

---

## 1. ภาพรวมการเปลี่ยนแปลง (Executive Summary)

โครงการ **Rohn-Runner** ได้รับการยกระดับครั้งสำคัญ จากเดิมที่เป็นระบบต้นแบบที่แสดงข้อมูลจำลอง (Mock Data) สู่ **ระบบแสดงผลการแข่งขันและตรวจสอบสถานะนักวิ่งแบบเรียลไทม์ (Real-time Live Timing & Results System)** ที่เชื่อมต่อกับฐานข้อมูล Supabase ส่วนกลางโดยตรง พร้อมทั้งรองรับการทำงานร่วมกับระบบจัดการ **Rohn-Admin** ในส่วนของการยิงข้อมูลนักวิ่งขึ้นหน้าจอ Monitor

### ไฮไลท์การเปลี่ยนแปลงหลัก:
1. **เปลี่ยนผ่านสู่ Real-time Supabase**: ดึงข้อมูลผลการแข่งขันจาก View `public_results` และผูกกับ Supabase Realtime Broadcast ทำให้อัปเดตผลทันทีที่มีการสแกนโดยไม่ต้องกด Refresh
2. **ระบบ Race Splits & ไทม์ไลน์การแข่งขันจริง**: หน้า E-Slip แสดงเวลาจริงตั้งแต่ Check-in, เวลา Gun Start ทางการ, เวลาผ่านจุด Checkpoints แต่ละจุด และเวลาเข้าเส้นชัย
3. **ระบบ Cast สู่หน้าจอ Monitor ข้ามโปรเจกต์**: รองรับการรับข้อมูลนักวิ่งแบบเรียลไทม์จากหน้า CheckIn ของ Rohn-Admin ผ่านทั้ง `BroadcastChannel`, `window.postMessage` และ `localStorage`
4. **ความสมบูรณ์ในการนำส่งระบบ (Production Readiness)**: รองรับ SPA routing บน Vercel ผ่าน `vercel.json` และมีระบบตรวจสอบ Environment Variables ป้องกันปัญหาหน้าขาว (Blank Screen)

---

## 2. รายละเอียดการเปลี่ยนแปลงเชิงเทคนิค (Technical Architecture & Code Changes)

### 2.1 ฐานข้อมูลและการจัดการ State (`src/context/RunnerContext.jsx` & `src/lib/supabaseClient.js`)
- **การเชื่อมต่อ Supabase Anon Client** (`src/lib/supabaseClient.js`):
  - สร้าง Client ด้วย `@supabase/supabase-js` โดยใช้ค่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`
- **การแก้ไขข้อจำกัด 1,000 แถวของ PostgREST (`fetchAllPublicResults`)**:
  - ใช้ Loop ดึงข้อมูลแบบ Pagination ด้วย `.range(from, from + PAGE_SIZE - 1)` (PAGE_SIZE = 1000) จนกว่าข้อมูลจะหมด ทำให้สามารถโหลดนักวิ่งได้ครบถ้วนแม้ในงานที่มีนักวิ่งมากกว่า 1,000 คน
- **Realtime Broadcast Integration**:
  - สมัครรับข้อมูลผ่าน `supabase.channel('results:<CURRENT_EVENT_ID>')` ดักจับ Event จากช่องสัญญาณ เพื่อนำข้อมูลนักวิ่งที่อัปเดต (`normalizeRunner(row)`) ผสานเข้ากับ State `runners` ทันที
- **Window Focus Refetch Fallback**:
  - เพิ่ม Event Listener `window.addEventListener('focus', loadRunners)` เพื่อดึงข้อมูลล่าสุดอัตโนมัติเมื่อผู้ใช้สลับหน้าจอกลับมา ป้องกันกรณีสัญญาณ Broadcast ขาดหาย
- **ระบบรับข้อมูล Monitor ข้ามหน้าจอ (Cross-Window Casting)**:
  - รองรับ 3 ช่องทางพร้อมกัน:
    1. `BroadcastChannel('rohn_monitor_channel')` สำหรับสื่อสารระหว่างแท็บ/หน้าต่างเบราว์เซอร์
    2. `window.addEventListener('message')` สำหรับกรณีรันผ่าน iframe หรือ popup
    3. `storage` event ดักจับคีย์ `react_cast_event` และ `rohn_monitor_cast`
  - ฟังก์ชัน `castToMonitor()` ได้รับการปรับปรุงให้ยิงข้อมูลออกทุกช่องทางข้างต้น

---

### 2.2 โมดูลประมวลผลผลการแข่งขัน (`src/lib/results.js`)
- **`normalizeRunner(row)`**: แปลงข้อมูลดิบจากฐานข้อมูล `public_results` ให้เป็นโครงสร้างมาตรฐานของฝั่ง Frontend รองรับทั้ง BIB, ชื่อ, ระยะทาง, เพศ, รุ่นอายุ, สถานะการลงทะเบียน (`registration_status`), เวลา Check-in, Gun Start, เวลา Finish และจุด Checkpoint (`cps`)
- **`checkpointTimeline(cps, finish, checkedInAt, gunStartTime)`**:
  - คำนวณและเรียงลำดับจุดเวลาของนักวิ่งแต่ละคน:
    1. **Check-in**: เวลาที่มารายงานตัว
    2. **Start**: เวลา Gun Start ทางการของระยะนั้นๆ
    3. **Station CPs**: จุดตรวจเวลาแต่ละจุด (เช่น CP1, CP2)
    4. **Finish**: เวลาเข้าเส้นชัย
- **`computeRank(runner, allRunners)`**: คำนวณอันดับในกลุ่มอายุ/เพศ (Group Rank) อัตโนมัติจากนักวิ่งที่เข้าเส้นชัยแล้ว
- **`topNByGroup(runners, n)`**: จัดกลุ่มนักวิ่งตามระยะและรุ่นอายุ เพื่อส่งข้อมูลให้หน้า Leaderboard แสดงผล Top 5

---

### 2.3 การปรับปรุงหน้าแสดงผล (Pages & UI)

#### 1. หน้า E-Slip (`src/pages/ESlip.jsx`)
- ค้นหาข้อมูลนักวิ่งด้วย BIB จากฐานข้อมูลจริงผ่าน `getRunnerByBib(bib)`
- แสดงป้ายแสดงสถานะชัดเจน:
  - Official Time (เวลาทางการ) หากยังไม่จบจะขึ้น "ยังไม่เข้าเส้นชัย / Not finished yet"
  - Group Rank แสดงอันดับจริงในกลุ่ม
- แสดงตารางและกราฟิก **Race Splits** พร้อมจุดเวลาจริง และเวลาที่ผ่านแต่ละสเตชั่น หากยังไม่มีข้อมูลสแกนจะแสดง "No checkpoint data yet"
- รองรับ Loading state ขณะดึงข้อมูล และกรณีค้นหาไม่พบ (Runner Not Found)

#### 2. หน้าสรุปภาพรวม Dashboard (`src/pages/Dashboard.jsx`)
- ปรับจากการสุ่มตัวเลข Mockup มาเป็นการคำนวณสดจาก State `runners`:
  - **Total**: จำนวนนักวิ่งทั้งหมดในระบบ
  - **Check-in**: จำนวนนักวิ่งที่มารายงานตัวแล้ว พร้อมคิดเป็นเปอร์เซ็นต์
  - **Finished**: จำนวนนักวิ่งที่เข้าเส้นชัยแล้ว พร้อมคิดเป็นเปอร์เซ็นต์
  - **Not Yet Finished**: จำนวนนักวิ่งที่กำลังแข่งขันอยู่บนเส้นทาง
- ตารางนักวิ่งแสดงชื่อ, BIB, สถานะการแข่งขัน, เวลา Finish, รุ่นอายุ, จำนวน Checkpoint ที่ผ่าน และอันดับในกลุ่ม

#### 3. หน้าตารางผู้นำ Leaderboard (`src/pages/Leaderboard.jsx`)
- แสดงผล Top 5 ของแต่ละระยะและรุ่นอายุแบบเรียลไทม์
- เมื่อมีนักวิ่งสแกนเข้าเส้นชัย ข้อมูลจะขยับอันดับทันทีผ่านช่องทาง Realtime Broadcast
- แสดงระยะทาง, รุ่นอายุ, เพศ, ลำดับที่ 1-5, BIB, ชื่อ และเวลาทางการที่จัดรูปแบบแล้ว

#### 4. หน้าจอ Monitor (`src/pages/Monitor.jsx`)
- ปรับปรุงให้รองรับการรับข้อมูล Cast จากหน้า `CheckIn.jsx` ของระบบ Rohn-Admin
- รองรับการกรองตาม `monitorId` (เช่น จอ 1, จอ 2, จอ 3) หรือส่งเข้าทุกจอพร้อมกัน (`monitorId === 'all'`)
- มีระบบ Auto-hide แสดงผล 5 วินาทีแล้วซ่อนข้อมูล พร้อมรีเซ็ตเวลาใหม่หากมีนักวิ่งสแกนเข้ามาต่อเนื่อง

---

### 2.4 การตั้งค่าสภาพแวดล้อมและการ Build (Build & Config)
- **`vite.config.js`**:
  - เพิ่มการตรวจสอบตัวแปร Environment ที่จำเป็น (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) ก่อนเริ่ม Build หากขาดตัวใดตัวหนึ่ง ระบบจะแจ้งเตือนทันทีเพื่อป้องกันการนำไฟล์ Bundle ที่ใช้งานไม่ได้ไป Deploy
- **`vercel.json`**:
  - กำหนด Rewrite Rule สำหรับ Client-side routing เพื่อให้เข้าถึง URL เช่น `/eslip/1001` หรือ `/leaderboard` ได้โดยตรง ไม่ติด 404
- **`.env.local`**:
  - กำหนดค่า Supabase Project URL และ Publishable Anon Key สำหรับการรันในเครื่องและทดสอบระบบ

---

## 3. สรุปรายการไฟล์ที่มีการเปลี่ยนแปลง (Files Status Summary)

| ลำดับ | ไฟล์ | สถานะ | หน้าที่และรายละเอียดการแก้ไข |
|:---:|---|:---:|---|
| 1 | `src/context/RunnerContext.jsx` | **MODIFIED** | เชื่อมต่อ Supabase, จัดการ Realtime, Pagination >1000 แถว, และระบบ Monitor Cast |
| 2 | `src/lib/results.js` | **NEW** | ฟังก์ชันคำนวณผลการแข่งขัน, ไทม์ไลน์ Race Splits, อันดับ และการแปลงข้อมูล |
| 3 | `src/lib/supabaseClient.js` | **NEW** | ตัวจัดการการเชื่อมต่อ Supabase Anon Client |
| 4 | `src/lib/constants.js` | **NEW** | จัดเก็บค่าคงที่รหัสงานปัจจุบัน (`CURRENT_EVENT_ID`) |
| 5 | `src/pages/ESlip.jsx` | **MODIFIED** | ดึงข้อมูลผลจริง, คำนวณอันดับกลุ่ม และแสดงไทม์ไลน์จุดเวลา Race Splits |
| 6 | `src/pages/Dashboard.jsx` | **MODIFIED** | คำนวณสถิติสดจากฐานข้อมูล (Total, Check-in, Finished, Not Finished) |
| 7 | `src/pages/Leaderboard.jsx` | **MODIFIED** | จัดกลุ่ม Top 5 แยกตามระยะและรุ่นอายุแบบเรียลไทม์ |
| 8 | `src/pages/Monitor.jsx` | **MODIFIED** | รองรับ BroadcastChannel, window.message, และเลือกจอ Monitor ID |
| 9 | `src/LOGO/logo-BaanPong.jpg` | **NEW** | โลโก้งานวิ่งบ้านโป่ง |
| 10 | `src/LOGO/logo-maekhaning.jpg` | **NEW** | โลโก้งานวิ่งแม่ขะนิง |
| 11 | `vite.config.js` | **MODIFIED** | ตรวจสอบตัวแปร Environment บังคับก่อนการ Build |
| 12 | `vercel.json` | **NEW** | กฎ SPA Rewrites สำหรับ Vercel Hosting |
| 13 | `.env.example` / `.env.local` | **NEW/CONFIG** | กำหนดค่า URL และ Anon Key ของ Supabase |
| 14 | `package.json` / `package-lock.json` | **MODIFIED** | เพิ่ม Dependency `@supabase/supabase-js` |

---

## 4. ผลการตรวจสอบและการทดสอบระบบ (Verification & Build Results)

1. **การตรวจสอบการสร้างแพ็กเกจ (Production Build)**:
   - คำสั่ง: `npm run build`
   - ผลลัพธ์: **ผ่านเรียบร้อย (Exit Code 0)**
   - รายละเอียด Bundle:
     - `dist/index.html` (0.46 kB)
     - `dist/assets/index-*.css` (5.48 kB)
     - `dist/assets/index-*.js` (859.13 kB)
2. **ความเข้ากันได้กับ Rohn-Admin**:
   - หน้า `Monitor.jsx` ใน Rohn-Runner สามารถรับสัญญาณจาก Combo Box และปุ่มส่งจอในหน้า `CheckIn.jsx` ของ Rohn-Admin ได้สมบูรณ์
3. **สถานะ Source Control (Git)**:
   - Branch `main` รวมโค้ดครบถ้วน สถานะ Working Tree สะอาด (Clean)
   - มี Branch สำรอง `backup-local-runner-before-merge` เก็บไว้เพื่อความปลอดภัย

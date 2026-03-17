# MeetFlow

## Project Description

![](/public/banner.jpeg)

Meet Flow is a meeting availability finder built with Next.js. Add members, mark their free time on a weekly grid (Mon–Fri, 9–17), and see overlapping slots so you can pick meeting times that work for everyone.

## Project Startup

### Prerequisites

- Node.js (v18+ recommended)
- npm, yarn, pnpm, or bun

### Install & run

```bash
# Install dependencies
npm install
# or: yarn | pnpm install | bun install

# Start development server
npm run dev
# or: yarn dev | pnpm dev | bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts


- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
=======
## Contributing

### Branch practices

- Work on **feature branches**, not directly on `main`.
- Branch names: `feat/<short-description>` or `fix/<short-description>` (e.g. `feature/add-export`, `fix/calendar-timezone`).
- Keep branches short-lived and up to date with `main` (rebase or merge as agreed).

### Commit practices

- Write **clear, present-tense** messages (e.g. "Add export to CSV", "Fix slot highlight on mobile").
- Prefer one logical change per commit.
- Reference issues/PRs when relevant (e.g. "Fix #12: overlapping slots on narrow screens").

---

This project uses [Next.js](https://nextjs.org) and was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

=======
## SAD HW1 Feature Branch（feat/recommend-and-reschedule）

在 `feat/recommend-and-reschedule` 這個 feature branch 中，實作了作業中提及但原本不存在的幾個核心功能與其特色：

- **會議推薦與衝突檢查**  
  - 依參與者可出席率、忙碌衝突（含外部行事曆 busy）、時段偏好計算分數，輸出 Top 6 推薦時段。  
  - 支援會議性質（決策 / 同步 / 討論）與優先順序（高 / 中 / 低），自動建議 priority，並直接影響 scoring。

- **衝突偵測與改期流程**  
  - 偵測「不在空閒」與「已有會議 / 外部行程」兩種衝突原因。  
  - 提供替代時段推薦，PM 可先套用到草稿，再透過確認對話框「更新會議並同步通知」，降低來回協調成本。
  - 支援 **取消會議 / 刪除會議**：取消後不再阻擋可用性並從行事曆移除；刪除則永久移除會議資料（皆有確認對話框）。

- **團隊行事曆與變動紀錄**  
  - 以週視圖（週一～週五 × 9–17）呈現所有會議，點會議可一鍵跳到編輯改期。  
  - 點空白時段可直接新建會議並帶入該時段。  
  - 下方變動紀錄區塊收集建立 / 更新會議的 in-app 通知，作為簡化版 Activity log。

- **個人會議負載與壓力指標（Workload）**  
  - 顯示本週會議總量、每日會議密度、最長連續會議小時數。  
  - 基於可用時間減去會議與外部 busy，找出連續至少 2 小時的「專注時段」建議，協助避免過度排程。

這些功能主要對應作業中的 PM / 參與者 User Stories：自動推薦最佳會議時間、處理衝突與改期、在單一平台查看所有安排與變動，以及檢視個人會議負載與專注時間。

### 推薦時段（Top 6）分數公式與範例

- **分數公式（score）**  
  - 對於每一個候選時段 \(t\)，我們計算：
    \[
    score(t) = 出席人數(t) \times A - 忙碌衝突人數(t) \times B - 不可用人數(t) \times C - 晚間懲罰(t)
    \]
  - A / B / C 由會議優先順序決定：
    - 高優先：A = 14, B = 9, C = 4  
    - 中優先：A = 10, B = 6, C = 3  
    - 低優先：A = 7, B = 4, C = 2  
  - 「晚間懲罰」會依會議性質（決策 / 同步 / 討論）調整起算時間（決策型更避晚、討論型較寬鬆）。
- **Top 6 的產生方式**  
  - 對所有候選時段計算分數後，依 `score` 由高到低排序，取前 6 筆作為「推薦時段（Top 6）」。

- **簡單計算範例**（中優先、中性會議性質、忽略晚間懲罰）  
  - 假設有三個參與者 A、B、C，針對某個時段 \(t\)：
    - A 可出席、B 可出席、C 不可用（如不在 availability）  
    - 沒有人在這個時段有其他會議或 external busy  
  - 則：
    - 出席人數 = 2（A、B）  
    - 忙碌衝突人數 = 0  
    - 不可用人數 = 1（C）  
    - 使用「中優先」權重 A = 10, B = 6, C = 3  
    - 代入公式：
      \[
      score(t) = 2 \times 10 - 0 \times 6 - 1 \times 3 - 0 = 20 - 3 = 17
      \]
  - 若另一個時段 \(t'\) 有 3 人都可出席，則：
    \[
    score(t') = 3 \times 10 - 0 - 0 - 0 = 30
    \]
    因此 \(t'\) 的分數更高，會排在推薦清單的較前面。

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
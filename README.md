This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

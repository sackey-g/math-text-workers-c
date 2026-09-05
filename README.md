# 河合塾 数学テキスト・後期 (Kawaijuku Math Latter)

Markdown と LaTeX（KaTeX）を用いた河合塾・後期数学テキストのデジタル学習プラットフォームです。
Next.js (App Router / Static Export) をベースに構築され、Cloudflare Workers (Static Assets) 上で超高速・完全無料で動作するように設計されています。

`data/` には4科目×14講×3タブ分の空テンプレートを用意しています。教材本文を追加してから公開してください。

---

## 🛠 技術スタック

- **フロントエンド**: Next.js 16 (App Router / Static Export), React 19
- **スタイリング**: Pure CSS / CSS Modules (`globals.css`, `*.module.css`)
- **数式・Markdown レンダリング**:
  - `react-markdown` (Markdown パース)
  - `remark-math` (数式構文 `$ ... $` / `$$ ... $$` のパース)
  - `rehype-katex` & `katex` (高速・美麗な数式 HTML レンダリング)
  - `gray-matter` (Frontmatter 解析)
- **インフラ・ホスティング**:
  - **ホスティング**: Cloudflare Workers (Static Assets)
- **データ永続化（メモ・解答）**: Cloudflare R2 (`mathmatics-latter` バケット)
  - **CI/CD**: Cloudflare Git Integration

---

## 🏗 アーキテクチャと動作原理 (Architecture)

### 1. ビルド時データ集約パイプライン (`prebuild`)
Cloudflare Workers などのサーバーレス（V8 Isolates）環境では、実行時にローカルファイルシステム（`fs.readFileSync` や `data/` フォルダ）が存在しません。
そのため、**ビルド時にすべての教材データをメモリ上に埋め込む（Bakeする）設計** を採用しています。

```text
[ data/ 配下の .md ファイル群 ]
             ↓ (npm run build / npm run dev 実行時)
[ scripts/generate_data.js (prebuild) ]
             ↓
[ lib/subjectsData.js (JSON/JSモジュールとして一元管理) ]
             ↓
[ Next.js generateStaticParams() による完全静的生成 (SSG) ]
             ↓
[ ./out/ フォルダに全講義ページの HTML/CSS/JS を事前出力 ]
             ↓
[ Cloudflare Workers Static Assets から CDN 経由で 0ms 配信 ]
```

### 2. Cloudflare CPU 制限（1102 エラー）の完全回避
Next.js Static Export (`output: 'export'`) + Cloudflare Workers Static Assets を組み合わせることで、**サーバー計算時間 0ms で CDN から直接 HTML を配信** します。無料プランの 10ms CPU 制限に引っかかることはありません。

### 3. 解答・メモ保存の仕組み (`worker.js` + Cloudflare R2)
- 各講義ページ下部にある「解答・解説」「メモ」コンポーネント (`components/EditableAccordion.js`) は、`/api/content` エンドポイントを fetch します。
- `worker.js` が軽量なリクエストハンドラとして機能し、Cloudflare R2（`mathmatics-latter` バケット）に直接 Markdown テキストを取得・保存します。

---

## 📁 ディレクトリ・ファイル構成

```text
math-text-latter/
├── app/
│   ├── globals.css                   # 全体スタイル、KaTeX 表示調整、カラー変数
│   ├── layout.js                     # RootLayout (フォント・ローカルKaTeX CSS)
│   ├── page.js                       # トップページ（科目一覧カード）
│   ├── page.module.css
│   ├── shared.module.css             # 共通コンテナ・戻るボタン・空状態スタイル
│   ├── [subject]/
│   │   ├── page.js                   # 科目別講義一覧ページ
│   │   └── page.module.css
│   └── [subject]/[lecture]/
│       ├── page.js                   # 講義ページ (完全SSG)
│       └── page.module.css
├── components/
│   ├── LectureView.js                # タブ切り替え（自習/例題/演習）＆アコーディオン連動UI
│   ├── MathRenderer.js               # KaTeX + ReactMarkdown 数式描画ラッパー
│   ├── MathRenderer.module.css
│   ├── ExerciseContent.js            # 大問分割 (## 見出し) ＆ コピーボタン配置
│   ├── ExerciseContent.module.css
│   ├── EditableAccordion.js          # 解答・メモ編集アコーディオンUI (R2連携)
│   └── EditableAccordion.module.css
├── data/                             # 【マスターデータ】講義別 Markdown ファイル群
│   ├── math1/ (lec01〜lec14)
│   ├── math2/
│   ├── math3/
│   └── science_math/
├── lib/
│   ├── data.js                       # 科目メタ情報、講義一覧取得、コンテンツ取得ロジック
│   └── subjectsData.js               # 【自動生成】全講義の本文を集約したJSモジュール
├── scripts/
│   ├── generate_data.js              # data/ の .md を lib/subjectsData.js にコンパイル
│   ├── format_data.js                # 教材のTeX記法を機械的に整形
│   └── validate_data.js              # frontmatter・見出し・TeX記法を検証
├── worker.js                         # Cloudflare Workers エントリーポイント (Static Assets + /api/content)
├── wrangler.json                     # Cloudflare Workers 設定 (assets: ./out, R2 バインディング)
├── next.config.mjs                   # output: 'export' (静的エクスポート設定)
├── package.json
└── README.md
```

---

## 💻 開発・ビルドコマンド

```bash
# 依存関係インストール
npm install

# ローカル開発サーバー起動 (http://localhost:3000)
# (scripts/generate_data.js が自動実行されてから起動します)
npm run dev

# 静的エクスポートビルド (./out フォルダに出力)
npm run build

# 本番相当のローカルプレビュー（R2 APIを含む）
npm run preview

# 教材記法の整形・検証
npm run format:data
npm run validate:data

# ビルド後にCloudflare Workersへデプロイ
npm run deploy
```

---

## ☁️ Cloudflare Workers / R2 設定

- **Cloudflare Build Settings**:
  - **Build command**: `npm run build`
  - **Deploy command**: `npx wrangler deploy`
- **R2 Bucket Binding**:
  - バインディング名: `R2_BUCKET`
  - バケット名: `mathmatics-latter`

初回デプロイ前に、前期版とデータが混ざらないよう専用バケットを作成します。

```bash
npx wrangler r2 bucket create mathmatics-latter
```

> 解答・メモAPIは認証やユーザー分離を行わず、同じ講義・タブを開いた利用者間で内容を共有する仕様です。必要に応じてCloudflare Accessでサイトまたは `/api/*` を保護してください。

# Java Lab Pro - Automated Examination & Proctoring Platform

A comprehensive Java Online Laboratory and Automated Examination System featuring a **Faculty Control Dashboard**, **Student IDE with Live Proctoring & Anti-Cheating Guards**, **Automated Test Case Grading**, **Class Leaderboard**, and a **Sandboxed Java Execution Container on Render**.

---

## 🏛 System Architecture Overview

```
                                  ┌───────────────────────────────┐
                                  │      Static Frontend Host     │
                                  │   (GitHub Pages / Vercel)     │
                                  └───────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │                                                                 │
                 ▼                                                                 ▼
   https://.../#/faculty                                             https://.../#/student
┌──────────────────────────────┐                                  ┌──────────────────────────────┐
│    Faculty Control Center    │                                  │     Student Examination      │
│  - Exercise Scheduler        │                                  │   - Java 17 IDE              │
│  - Public & Hidden Tests     │                                  │   - Proctoring HUD           │
│  - Live Cheating Log Stream  │                                  │   - Public Test Runner       │
│  - Submissions & Code Audit  │                                  │   - Hidden Test Case Submit  │
│  - Student Roster Manager    │                                  │   - Real-Time Leaderboard    │
└──────────────┬───────────────┘                                  └──────────────┬───────────────┘
               │                                                                 │
               │   Method A: Web App REST API Bridge                             │
               └──────────────────────────┬──────────────────────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
     ┌────────────────────────────┐               ┌─────────────────────────────┐
     │  Google Apps Script & DB   │               │   Docker Runner on Render   │
     │  (Headless REST API /exec) │               │   (OpenJDK 17 Temurin)      │
     │  - Exercises Tab           │               │   - Sandboxed Linux User    │
     │  - Submissions Tab         │               │   - 5-Second CPU Timeout    │
     │  - Violations Tab          │               │   - p-queue Concurrency     │
     │  - Students & Faculty Tabs │               │   - x-api-key Auth Header   │
     └────────────────────────────┘               └─────────────────────────────┘
```

---

## 🔗 Dedicated Portal URLs (Strictly Separated)

When deployed to GitHub Pages or any hosting provider, direct students and faculty to their respective isolated entry points:

- **Student Exam Workspace URL**:
  ```
  https://<your-username>.github.io/<repo-name>/#/student
  ```
  *(Share **only** this URL with students. The Faculty Management tabs are completely hidden from this view).*

- **Faculty Management Portal URL**:
  ```
  https://<your-username>.github.io/<repo-name>/#/faculty
  ```
  *(Restricted faculty URL to schedule exercises, audit student submissions, view proctoring flags, and manage roster).*

---

## ⚙️ Connecting Frontend to Google Apps Script & Render (Method A - Followed)

You followed **Method A: In-App UI Configuration**. This allows you to connect your live Google Apps Script Web App URL and your Render execution runner directly through the browser without needing to modify code or trigger rebuilds.

### Step 1: Open System Settings in the Frontend
1. Open the frontend in your browser (e.g., `https://<your-username>.github.io/<repo-name>/#/faculty` or your local development URL).
2. Click the **⚙️ Settings** icon located on the top right in the navigation bar.

### Step 2: Configure the Endpoints
In the modal that opens:
1. **Execution Backend Engine**:
   - Choose **External Docker / Render** to evaluate student Java code on your live Render container.
   - *(Optional: You can switch back to **Built-in JVM Sandbox** anytime for instant client-side testing without waiting for container spin-ups).*
2. **Render / Docker Runner URL**:
   - Paste your live Render service URL with `/execute` at the end:
     ```
     https://<your-service-name>.onrender.com/execute
     ```
3. **Docker Container API Secret**:
   - Enter your `API_SECRET` configured in Render (e.g. `MY_SECURE_LAB_KEY_123`).
4. **Google Apps Script Database API URL**:
   - Paste your Google Apps Script Web App URL ending with `/exec`:
     ```
     https://script.google.com/macros/s/AKfycbx.../exec
     ```

### Step 3: Test Connections
1. Click **Test Remote Runner Ping**:
   - Sends a test compilation request to Render.
   - Expect a green status: `Runner Online`.
2. Click **Test Sheet API Connection**:
   - Sends a lightweight ping to your Google Apps Script Web App.
   - Expect a green status: `Connected! Google Sheet responded successfully (X exercises active)`.

### Step 4: Save & Automatic Browser Persistence
- Click **Save Settings**.
- The configuration is saved to the browser's persistent `localStorage` under `javalab_pro_settings`.
- **How it works automatically**:
  - The frontend automatically queries `?action=getActiveExercises` to fetch all currently active exercises from your Google Sheet's `Exercises` tab.
  - When faculty adds or edits an exercise, it syncs to Google Sheets via `action=saveExercise`.
  - When students submit their code, their results and proctoring violations sync to the `Submissions` and `Violations` tabs via `action=submit`.

---

## 🌐 Alternative: Environment Variables for Student Pre-Configuration (Method B)

If you are distributing the static site to hundreds of students and want the URLs to work **out-of-the-box without students having to open Settings**:

1. In your local repository root, create a file named `.env.production`:
   ```bash
   VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbx.../exec"
   VITE_RENDER_SERVICE_URL="https://<your-service-name>.onrender.com/execute"
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Deploy the compiled `dist/` folder. The built files will automatically embed these endpoints as default fallbacks for all users.

---

## 🚀 Complete Step-by-Step Deployment Reference

### Phase 1: Deploy Docker Execution Runner to Render

1. **GitHub Repository for Runner**:
   - Ensure your `java-runner` folder is pushed to GitHub with:
     - `Dockerfile` (using `FROM eclipse-temurin:17-jdk-jammy`)
     - `server.js` (Express + `p-queue` sequential queue)
     - `package.json`
2. **Create Render Web Service**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) > **New +** > **Web Service**.
   - Connect your GitHub repository.
   - **Runtime**: Select `Docker`.
   - **Instance Type**: Select `Free` (512 MB RAM).
3. **Set Environment Variables on Render**:
   - `API_SECRET` = `MY_SECURE_LAB_KEY_123`
   - `PORT` = `3000`
4. **Deploy & Copy URL**:
   - Once the service status displays **Live**, copy:
     `https://your-service-name.onrender.com/execute`

---

### Phase 2: Deploy Google Apps Script Web App

1. **Open Google Apps Script**:
   - In your Google Sheet (`Java_Lab_Database`), go to:
     `Extensions > Apps Script`.
2. **Verify `Code.gs`**:
   - Copy the script from `apps_script/Code.gs` into the editor.
3. **Deploy as Web App**:
   - Click **Deploy** > **New deployment**.
   - Select type: **Web app**.
   - Settings:
     - **Execute as**: `Me (your-email@gmail.com)` *(Critical: gives script permission to edit the sheet)*
     - **Who has access**: `Anyone` *(Critical: allows GitHub Pages to send GET/POST requests without CORS redirect blocks)*
   - Click **Deploy**.
4. **Authorize Access**:
   - Click **Authorize access**, choose your account, click **Advanced** > **Go to Java Lab (unsafe)** > **Allow**.
5. **Copy Web App URL**:
   - Copy the URL ending in `/exec`:
     `https://script.google.com/macros/s/AKfycbx.../exec`

---

### Phase 3: Deploy Frontend to GitHub Pages

1. **Install gh-pages (optional) or push `dist/`**:
   ```bash
   npm run build
   ```
2. **Publish to GitHub Pages**:
   - If using GitHub Actions or a static `gh-pages` branch, point your Pages setting in the GitHub repository (`Settings > Pages > Build and deployment`) to `Deploy from a branch` (e.g. `gh-pages` or `/docs`).
3. **Verify Links**:
   - Faculty: `https://<your-username>.github.io/<repo-name>/#/faculty`
   - Student: `https://<your-username>.github.io/<repo-name>/#/student`

---

## 📋 Database Schema Reference (Google Sheet Tabs)

Ensure your `Java_Lab_Database` Google Sheet contains these 5 tabs with exact row 1 column headers:

### Tab 1: `Exercises`
| Column | Header | Description |
|---|---|---|
| A | `ID` | Unique ID (e.g. `EX_101`) |
| B | `Title` | Problem Title |
| C | `Description` | Problem description and constraints |
| D | `OpenTime` | Start datetime (ISO string) |
| E | `CloseTime` | Expiry datetime (ISO string) |
| F | `PublicInput` | Standard input for sample test |
| G | `PublicOutput` | Expected output for sample test |
| H | `PrivateInput` | Hidden grading input |
| I | `PrivateOutput` | Expected hidden output |

### Tab 2: `Submissions`
| Column | Header | Description |
|---|---|---|
| A | `Timestamp` | Submission date and time |
| B | `StudentEmail` | Student email address |
| C | `RegNo` | Student registration number |
| D | `ExerciseID` | Exercise identifier |
| E | `Code` | Source Java code |
| F | `Status` | `ALL TEST CASES PASSED` \| `PARTIAL PASS` \| `FAILED` |
| G | `PublicResult` | Log of public test case |
| H | `PrivateResult` | Log of hidden test case |

### Tab 3: `Violations`
| Column | Header | Description |
|---|---|---|
| A | `Timestamp` | Time of incident |
| B | `StudentEmail` | Student email |
| C | `RegNo` | Registration number |
| D | `ExerciseID` | Exercise identifier |
| E | `ViolationType` | `TAB_SWITCH` \| `FULLSCREEN_EXIT` \| `PASTE` |
| F | `Details` | Description of intercepted action |

### Tab 4: `Students`
| Column | Header | Description |
|---|---|---|
| A | `Email` | Student email |
| B | `RegNo` | Registration number (e.g. `21BCE0001`) |
| C | `Name` | Student full name |

### Tab 5: `Faculty`
| Column | Header | Description |
|---|---|---|
| A | `Email` | Faculty email |
| B | `Name` | Faculty name and title |

---

## 🛡 Anti-Cheating & Proctoring Safeguards

The student exam interface includes active client-side proctoring guards:
- **Tab Switching Detector (`blur`)**: Flags when focus leaves the exam tab.
- **Enforced Fullscreen (`fullscreenchange`)**: Detects and warns when a student minimizes the browser or exits full-screen mode.
- **Clipboard Paste Interceptor (`paste`)**: Blocks external paste into the code editor and records character count as a violation.
- **Batch Violation Sync**: Violations are buffered during the session and synchronized directly to the `Violations` sheet upon submission to prevent Google Apps Script rate-limiting.

---

## 🔧 Key Troubleshooting Tips

| Issue | Cause | Fix |
|---|---|---|
| `#2 ERROR: docker.io/library/openjdk:17-jdk-slim: not found` | Official `openjdk` Docker image deprecated | Use `FROM eclipse-temurin:17-jdk-jammy` in `Dockerfile`. |
| `HTTP 403: Unauthorized` on Render | API Secret mismatch | Ensure the `x-api-key` header matches `process.env.API_SECRET`. |
| CORS Error when pinging Render | Missing CORS headers | Verify `res.header("Access-Control-Allow-Origin", "*")` in `server.js`. |
| Google Sheet connection failed | Apps Script Web App permissions | Ensure the Web App is deployed with **Execute as: Me** and **Who has access: Anyone**. |
| Settings reset after refresh | Browser incognito or clear cache | Settings are stored in `localStorage` under `javalab_pro_settings`. In incognito, settings persist for the session. |
| Render container sleeps | Free tier inactivity sleep | Free tier containers sleep after 15 minutes of inactivity; the first request takes ~30-50 seconds to cold boot. Use the built-in sandbox if instant feedback is required. |

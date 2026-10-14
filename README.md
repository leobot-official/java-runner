# Java Lab Pro - Automated Examination & Proctoring Platform

A comprehensive Java Online Laboratory and Automated Examination System featuring a **Faculty Control Dashboard**, **Student IDE with Live Proctoring & Anti-Cheating Guards**, **Automated Test Case Grading**, **Student Leaderboard**, and a **Sandboxed Java Execution Container**.

---

## 🏛 System Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Google Account Login   │
                          └─────────────┬────────────┘
                                        │
                         Google Apps Script / Database
                         ┌──────────────┴─────────────┐
                         │                            │
                  (Role = FACULTY)             (Role = STUDENT)
                         ▼                            ▼
            ┌────────────────────────┐   ┌────────────────────────┐
            │ Faculty Control Center │   │  Student Lab IDE &     │
            │  - Schedule Exercises  │   │  Proctoring Guardian   │
            │  - Hidden Test Cases   │   │  - Syntax IDE          │
            │  - Live Cheating Log   │   │  - Anti-Cheating HUD   │
            │  - Submissions Audit   │   │  - Public Tests Run    │
            │  - Student Roster      │   │  - Class Leaderboard   │
            └───────────┬────────────┘   └───────────┬────────────┘
                        │                            │
                        └──────────────┬─────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
         ┌─────────────────────────┐       ┌─────────────────────────┐
         │  Google Sheet Database  │       │  Docker Runner (Render) │
         │  - Exercises            │       │  - OpenJDK 17 (Temurin) │
         │  - Submissions          │       │  - Sandbox User         │
         │  - Violations           │       │  - 5-Second Timeout     │
         │  - Students & Faculty   │       │  - Sequential Queue     │
         └─────────────────────────┘       └─────────────────────────┘
```

---

## 🔗 Dedicated Portal URLs (Strictly Separated for Faculty and Students)

When deployed to GitHub Pages (or any hosting provider), the portal routes are completely separated:

- **Student Exam Workspace URL**:
  ```
  https://<your-username>.github.io/<repo-name>/#/student
  ```
  *(Give **only** this URL to your students. In student mode, the Faculty Management tab is completely hidden and inaccessible).*

- **Faculty Management Portal URL**:
  ```
  https://<your-username>.github.io/<repo-name>/#/faculty
  ```
  *(Keep this URL for faculty/evaluator access to schedule exercises, view submissions, monitor anti-cheating logs, and manage the student roster).*

---

## 🚀 Complete Step-by-Step Deployment Guide

You have already completed **Step 1** (Google Sheet setup), **Step 2** (Docker runner code), and **Step 3** (Apps Script `Code.gs`). Follow these steps to finish deployment:

---

### Phase 1: Deploy Docker Execution Runner to Render

1. **Commit and Push to GitHub**:
   - Make sure your `java-runner` folder is pushed to a GitHub repository with these 3 files:
     - `Dockerfile` (using `FROM eclipse-temurin:17-jdk-jammy`)
     - `server.js` (Express + `p-queue` sequential execution)
     - `package.json`

2. **Create Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and sign in.
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository containing `java-runner`.
   - **Runtime**: Select `Docker`.
   - **Instance Type**: Select `Free` (512 MB RAM).

3. **Set Environment Variables on Render**:
   - In the service configuration, scroll down to **Environment Variables**:
     - `API_SECRET` = `MY_SECURE_LAB_KEY_123` (or your chosen custom secret).
     - `PORT` = `3000` (Render defaults to 10000 or 3000; either works if EXPOSE matches).

4. **Deploy Service & Copy Endpoint**:
   - Click **Create Web Service**.
   - Render will build using Adoptium Temurin JDK 17.
   - Once the status shows **Live**, copy your service URL:
     ```
     https://your-service-name.onrender.com
     ```
   - Your execution endpoint will be:
     ```
     https://your-service-name.onrender.com/execute
     ```

---

### Phase 2: Deploy Google Apps Script Web App

1. **Open Google Apps Script**:
   - In your Google Sheet (`Java_Lab_Database`), go to:
     `Extensions > Apps Script`.

2. **Verify Code.gs**:
   - Ensure `Code.gs` contains the complete script with:
     - `doGet(e)`
     - `loginUser(regNo)`
     - `saveExercise(data)`
     - `getActiveExercises()`
     - `saveSubmissionAndViolations(payload)`

3. **Deploy as Web App**:
   - Click the blue **Deploy** button (top right) > **New deployment**.
   - Click the gear icon next to *Select type* > Choose **Web app**.
   - Fill in the deployment settings:
     - **Description**: `Java Lab Web App v1`
     - **Execute as**: `Me (your-email@gmail.com)` *(Important: allows the script to read/write the sheet)*
     - **Who has access**: `Anyone with Google account` *(Ensures students authenticate with their institutional or personal Google account)*
   - Click **Deploy**.

4. **Authorize the Application**:
   - Click **Authorize access**.
   - Choose your Google account.
   - If prompted with *"Google hasn't verified this app"*, click **Advanced** > **Go to Java Lab (unsafe)** > **Allow**.

5. **Copy the Web App URL**:
   - Copy the generated URL ending with `/exec`:
     ```
     https://script.google.com/macros/s/AKfycbx.../exec
     ```
   - This is the live URL you can distribute to students and faculty.

---

### Phase 3: Connect Frontend to Render Runner

In your frontend application:
1. Open the **System Settings** modal (gear icon in the top right).
2. Enter your Render service URL:
   ```
   https://your-service-name.onrender.com/execute
   ```
3. Enter your `API_SECRET` (matching what you set on Render):
   ```
   MY_SECURE_LAB_KEY_123
   ```
4. Click **Test Remote Runner Ping**:
   - If it displays `Runner Online`, your frontend is successfully communicating with the sandboxed Docker container!
   - *Note: If you leave the built-in sandbox enabled, students can also test code immediately in the browser without waiting for container spin-up.*

---

### Phase 4: Deploying the Web App (Standalone / Cloud)

If you want to host this web application independently on Vercel, Netlify, Cloud Run, or GitHub Pages:

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
2. The compiled assets are placed in the `/dist` directory.
3. Deploy `/dist` to any static or full-stack host:
   - **Vercel**: Run `npx vercel deploy --prod`
   - **Netlify**: Drag and drop the `/dist` folder or connect your repo
   - **Cloud Run / Docker**: Package with standard Node/Nginx container

---

## 📋 Database Schema Reference (Google Sheet Tabs)

Create these 5 tabs in `Java_Lab_Database` with row 1 headers:

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
| B | `StudentEmail` | Google login email |
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
| A | `Email` | Student Google email |
| B | `RegNo` | Registration number (e.g. `21BCE0001`) |
| C | `Name` | Student full name |

### Tab 5: `Faculty`
| Column | Header | Description |
|---|---|---|
| A | `Email` | Faculty Google email |
| B | `Name` | Faculty name and title |

---

## 🛡 Anti-Cheating & Proctoring Safeguards

The student exam interface includes active client-side proctoring guards:
- **Tab Switching Detector (`blur`)**: Flags when focus leaves the exam tab to browse external answers or chat assistants.
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
| Student receives "Unauthorized mismatch" | Email or RegNo does not match sheet | Confirm student is listed in the `Students` tab with matching email and registration number. |
| Render container spins down | Free tier inactivity sleep | Free tier containers sleep after 15 minutes of inactivity; the first request takes ~30-50 seconds to cold boot. |

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const pQueue = require('p-queue');

const app = express();
app.use(express.json());

// Enable CORS for Google Apps Script Web App access
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-api-key");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Single-concurrency queue to fit within 512MB RAM
const queue = new pQueue.default({ concurrency: 1 });
const API_SECRET = process.env.API_SECRET || "MY_SECURE_LAB_KEY_123";

// Authentication middleware
function checkAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_SECRET) {
    return res.status(403).json({ error: "Unauthorized: Invalid API key" });
  }
  next();
}

app.post('/execute', checkAuth, async (req, res) => {
  const { code, input, expectedOutput } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  // Queue tasks sequentially
  queue.add(async () => {
    return new Promise((resolve) => {
      const runId = Date.now() + '_' + Math.floor(Math.random() * 1000);
      const workDir = path.join('/tmp', runId);

      fs.mkdirSync(workDir, { recursive: true });

      // Match public class name or fallback to Main
      const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';

      const codePath = path.join(workDir, `${className}.java`);
      const inputPath = path.join(workDir, 'input.txt');

      fs.writeFileSync(codePath, code);
      fs.writeFileSync(inputPath, input || "");

      // Execute inside sandbox user with a 5-second hard timeout
      const command = `su - sandbox -c "cd ${workDir} && javac ${className}.java && timeout 5s java ${className} < input.txt"`;

      exec(command, { timeout: 7000 }, (error, stdout, stderr) => {
        const actualOutput = (stdout || "").trim();
        const compileErr = (stderr || "").trim();

        // Clean up temp folder
        try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (e) {}

        if (compileErr) {
          resolve(res.json({ passed: false, log: "Compilation/Runtime Error:\n" + compileErr }));
          return;
        }

        const expected = (expectedOutput || "").trim();
        const passed = (actualOutput === expected);

        resolve(res.json({
          passed: passed,
          log: passed ? "PASSED" : `FAILED\nExpected:\n${expected}\nGot:\n${actualOutput}`
        }));
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Execution server running on port ${PORT}`));
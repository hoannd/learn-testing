# Complete Testing & DevOps Training Guide

> **Build a comprehensive testing laboratory from scratch with modern automated testing practices and enterprise DevOps workflows**

This guide demonstrates how to create a complete testing ecosystem using a simple web application, covering all testing levels and enterprise DevOps practices.

## 🎯 What You'll Learn

- **Full-stack demo app** - Simple Express.js server with button click functionality
- **Comprehensive testing** - Unit, Integration, E2E (Playwright), and BDD (Gauge) testing
- **Dev/QA workflow** - ReleaseFlow branching strategy with automated quality gates
- **Enterprise DevOps** - Docker, dual CI/CD pipelines (GitHub Actions/CircleCI), SonarQube, ReportPortal

## 📋 Prerequisites

**Development Environment:**
- [Node.js](https://nodejs.org/) (version 22+)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Visual Studio Code](https://code.visualstudio.com/)

## 🎯 **Choose Your Services** (Pick One from Each):

### **CI/CD Pipeline** (Choose One):
- **Option A**: GitHub Actions (recommended for beginners)
- **Option B**: CircleCI (more advanced features)

### **Deployment Platform** (Choose One):
- **Option A**: Render (easier setup, free tier)
- **Option B**: Heroku (more features, requires credit card)

### **Required Services** (Set up all):
- **GitHub** account for repository hosting
- **SonarCloud** account (free tier) - for code quality
- **ReportPortal Demo** (https://demo.reportportal.io) - for test reporting

## 🚀 Part 1: Project Setup & Simple App

### Step 1: Initialize Project Structure

```bash
# Create project directory
mkdir learn-testing
cd learn-testing

# Initialize Git repository
git init
git branch -M main

# Initialize Node.js project
npm init -y

# Create project structure (no public folder needed - HTML is inline)
mkdir -p server tests specs/steps script .github/workflows .circleci
```

### Step 2: Install Dependencies

```bash
# Production dependencies
npm install tsx

# Development dependencies
npm install --save-dev \
  @getgauge/cli \
  @reportportal/agent-js-vitest \
  @sonar/scan \
  @types/node \
  @vitest/coverage-v8 \
  gauge-ts \
  playwright \
  typescript \
  vitest \
  vitest-sonar-reporter

# Override glob version for compatibility
npm pkg set overrides.glob="^11.0.3"
```

### Step 3: Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["server/**/*", "tests/**/*", "specs/**/*"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

### Step 4: Build Ultra-Simple Express.js Server

Create `server/main.ts` with the most minimal web application possible:

```typescript
import * as http from "node:http";

// Simple business logic function (for unit testing)
export function greet(name: string): string {
    return name ? `Hello, ${name}!` : "Hello, World!";
}

// Create server
export function createServer() {
    return http.createServer((req, res) => {
        const url = req.url || "";

        if (url === "/" && req.method === "GET") {
            // Serve simple HTML page
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>Test App</title></head>
                <body>
                    <h1>Test App</h1>
                    <button onclick="fetch('/api/hello').then(r=>r.text()).then(t=>document.getElementById('result').innerText=t)">
                        Click Me
                    </button>
                    <div id="result"></div>
                </body>
                </html>
            `);
        } else if (url === "/api/hello" && req.method === "GET") {
            // API endpoint
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(greet("User"));
        } else {
            // 404
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
        }
    });
}

export function startServer(port = 3000) {
    const server = createServer();
    server.listen(port, () => console.log(`Server at http://localhost:${port}`));
    return server;
}

if (require.main === module) {
    startServer();
}
```

### Step 5: Test Your Application

Add a start script to `package.json`:

```json
{
  "scripts": {
    "start": "tsx server/main.ts"
  }
}
```

Now test your ultra-simple application:

```bash
# Start the server
npm start

# Open browser and go to http://localhost:3000
# Click the button to see "Hello, User!" appear
# Test the API directly: curl http://localhost:3000/api/hello
```

That's it! You now have a complete ultra-simple web application:
- **1 HTML page** (inline) with 1 button that calls 1 API
- **1 API endpoint** that returns a simple greeting
- **1 business function** to test
- **Total**: ~40 lines of code in a single file

## 🧪 Part 2: Comprehensive Testing Implementation

### Step 6: Configure Vitest for Unit Testing

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
        },
    },
});
```

### Step 7: Write Unit Tests

Create `tests/server.unit.test.ts` to test the business logic:

```typescript
import { describe, expect, test } from "vitest";
import { greet } from "../server/main";

describe("Unit Tests", () => {
    test("greet with name returns personalized greeting", () => {
        expect(greet("John")).toBe("Hello, John!");
    });

    test("greet without name returns default greeting", () => {
        expect(greet("")).toBe("Hello, World!");
        expect(greet(null as any)).toBe("Hello, World!");
    });
});
```

### Step 8: Write Integration Tests

Create `tests/server.integration.test.ts` to test HTTP endpoints:

```typescript
import * as http from "node:http";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createServer } from "../server/main";

describe("Integration Tests", () => {
    let server: http.Server;

    beforeAll(async () => {
        server = createServer();
        return new Promise<void>((resolve) => {
            server.listen(3001, () => resolve());
        });
    });

    afterAll(async () => {
        if (server) {
            return new Promise<void>((resolve) => {
                server.close(() => resolve());
            });
        }
    });

    test("GET / returns HTML page", async () => {
        const response = await makeRequest("GET", "/");
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain("Test App");
        expect(response.body).toContain("Click Me");
    });

    test("GET /api/hello returns greeting", async () => {
        const response = await makeRequest("GET", "/api/hello");
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe("Hello, User!");
    });

    test("GET /nonexistent returns 404", async () => {
        const response = await makeRequest("GET", "/nonexistent");
        expect(response.statusCode).toBe(404);
        expect(response.body).toBe("Not Found");
    });
});

function makeRequest(method: string, path: string): Promise<{
    statusCode: number; body: string;
}> {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: "localhost", port: 3001, path, method }, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => resolve({ statusCode: res.statusCode || 0, body }));
        });
        req.on("error", reject);
        req.end();
    });
}
```

### Step 9: Implement BDD with Gauge

Create `specs/app.spec`:

```markdown
# Simple App Testing

## Button Click Test
* Navigate to app
* Click button
* Verify greeting appears
```

Create `specs/steps/app.ts`:

```typescript
import { Step } from "gauge-ts";
import { chromium, Browser, Page } from "playwright";

let browser: Browser;
let page: Page;

Step("Navigate to app", async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
});

Step("Click button", async () => {
    await page.click('button');
});

Step("Verify greeting appears", async () => {
    const result = await page.locator('#result');
    const text = await result.textContent();
    if (!text?.includes("Hello")) {
        throw new Error("Greeting not found");
    }
    await browser.close();
});
```

### Step 10: Add Playwright for E2E Testing

Create `tests/e2e.test.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("should display app and handle button click", async ({ page }) => {
    await page.goto("/");

    // Check page loads
    await expect(page.locator('h1')).toContainText('Test App');
    await expect(page.locator('button')).toBeVisible();

    // Click button and check result
    await page.click('button');
    await expect(page.locator('#result')).toContainText('Hello, User!');
});
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm start',
    port: 3000,
  },
});
```

## 🔧 Part 3: Automation Scripts

### Step 11: Create Development Scripts

Create executable scripts in `script/`:

1. **Setup Development** (`script/setup-dev`):
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   cd "$(dirname "${BASH_SOURCE[0]}")/.."

   echo '==> Install dependencies…'
   npm install
   ```

2. **Run Tests** (`script/test-dev`):
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   cd "$(dirname "${BASH_SOURCE[0]}")/.."

   echo '==> Running tests...'
   npx vitest run --coverage
   ```

3. **Acceptance Tests** (`script/test-acceptance`):
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   cd "$(dirname "${BASH_SOURCE[0]}")/.."

   echo '==> Running acceptance tests...'
   NODE_OPTIONS=--disable-warning=DEP0190 npx gauge run specs
   ```

Make scripts executable:
```bash
chmod +x script/*
```

## 📊 Part 4: Code Quality & Analysis

### Step 12: Set Up SonarCloud for Code Quality

#### **SonarCloud Account Setup:**

1. **Create SonarCloud Account**:
   - Go to [sonarcloud.io](https://sonarcloud.io)
   - Click "Log in" → "With GitHub"
   - Authorize SonarCloud to access your GitHub account

2. **Import Your Repository**:
   - Click "+" → "Analyze new project"
   - Select your `learn-testing` repository
   - Choose "With GitHub Actions" (if using GitHub Actions) or "With other CI tools" (if using CircleCI)

3. **Get Your Tokens**:
   - Go to "My Account" → "Security" → "Generate Tokens"
   - Create token named "learn-testing-token"
   - **Copy and save this token** - you'll need it later

4. **Configure Project Settings**:
   - In your SonarCloud project, go to "Administration" → "General Settings"
   - Set "Project Key": `your-github-username_learn-testing`
   - Set "Organization Key": your GitHub username

#### **Local Configuration:**

Create `sonar-project.properties`:
```properties
sonar.projectKey=your-github-username_learn-testing
sonar.organization=your-github-username
sonar.projectName=Learn Testing
sonar.projectVersion=1.0
sonar.sources=server
sonar.tests=tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=reports/test-results.xml
```

Create analysis script `script/sonarscan`:
```bash
#!/usr/bin/env bash
npx sonar-scanner \
  -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.host.url=https://sonarcloud.io
```

### Step 13: Ready for CI/CD

Your tests are now ready to run in CI/CD pipelines!

## 🐳 Part 5: Containerization

### Step 14: Create Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/ ./server/
COPY tsconfig.json ./

# Install tsx for running TypeScript
RUN npm install -g tsx

# Expose port
EXPOSE 3000

# Start the server
CMD ["tsx", "server/main.ts"]
```

### Step 15: Test Container Locally

```bash
# Build image
docker build -t learn-testing .

# Run container
docker run -p 3000:3000 learn-testing

# Test endpoints
curl http://localhost:3000/health
```

## 🔄 Part 6: CI/CD Pipeline Setup

**Choose ONE of the following CI/CD options:**

### Option A: GitHub Actions Pipeline (Recommended for Beginners)

#### **Setup Instructions:**

1. **Enable GitHub Actions**:
   - Push your code to GitHub repository
   - Go to your repo → "Actions" tab
   - GitHub Actions is enabled by default

2. **Add Repository Secrets**:
   - Go to repo "Settings" → "Secrets and variables" → "Actions"
   - Add these secrets:
     - `RENDER_API_KEY`: Your Render API key (if using Render)
     - `RENDER_SERVICE_ID`: Your Render service ID (if using Render)
     - `RENDER_APP_URL`: Your deployed app URL (e.g., https://your-app.onrender.com)

#### **GitHub Actions Configuration:**

### Step 15A: GitHub Actions Pipeline

Create `.github/workflows/main.yml`:

```yaml
name: Simple CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Install Render CLI
        run: |
          curl \
            -L "https://github.com/render-oss/cli/releases/download/v${VERSION}/cli_${VERSION}_linux_amd64.zip" \
            -o render.zip
          unzip render.zip
          sudo mv "cli_v${VERSION}" /usr/local/bin/render
        env:
          VERSION: '2.1.4'

      - name: Deploy to Render and wait for completion
        run: |
          render deploys create ${{ secrets.RENDER_SERVICE_ID }} --output json --confirm --wait
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          CI: true

      - name: Setup Node.js for acceptance tests
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run acceptance tests against deployed app
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.RENDER_APP_URL }}
```

### Option B: CircleCI Pipeline (Advanced Features)

#### **Setup Instructions:**

1. **Create CircleCI Account**:
   - Go to [circleci.com](https://circleci.com)
   - Sign up with your GitHub account
   - Authorize CircleCI to access your repositories

2. **Set Up Project**:
   - Click "Set Up Project" for your `learn-testing` repo
   - Choose "Fastest" setup option
   - CircleCI will detect your `.circleci/config.yml` file

3. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add these variables:
     - `HEROKU_API_KEY`: Your Heroku API key (if using Heroku)
     - `HEROKU_APP_NAME`: Your Heroku app name (if using Heroku)

#### **CircleCI Configuration:**

### Step 15B: CircleCI Pipeline

Create `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  node: circleci/node@7.1.1
  sonarcloud: sonarsource/sonarcloud@3.0.0
  heroku: circleci/heroku@2.0.0

jobs:
  test:
    docker:
      - image: cimg/node:24.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run tests
          command: npm test

  deploy:
    docker:
      - image: cimg/node:24.0
    steps:
      - checkout
      - heroku/deploy-via-git:
          app-name: $HEROKU_APP_NAME

  acceptance-test:
    docker:
      - image: cimg/node:24.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Wait for deployment
          command: sleep 60
      - run:
          name: Run acceptance tests
          command: npx playwright test
          environment:
            BASE_URL: https://$HEROKU_APP_NAME.herokuapp.com

workflows:
  simple-pipeline:
    jobs:
      - test
      - deploy:
          requires: [test]
          filters:
            branches:
              only: main
      - acceptance-test:
          requires: [deploy]
          filters:
            branches:
              only: main
```

## 🚀 Part 7: Run Your Complete Pipeline

### Step 16: Test Everything Works

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add testing lab setup"
   git push origin main
   ```

2. **Check CI/CD Pipeline**:
   - **GitHub Actions**: Go to your repo → "Actions" tab
   - **CircleCI**: Go to CircleCI dashboard → your project
   - Watch the pipeline run: Install → Test → Deploy → Acceptance Test

3. **Verify Results**:
   - **Unit/Integration Tests**: Should pass and show coverage
   - **SonarCloud**: Check code quality at sonarcloud.io
   - **ReportPortal**: Check test results at demo.reportportal.io
   - **Deployment**: Visit your deployed app URL
   - **Acceptance Tests**: Should pass against the deployed app

## 🚀 Part 9: Deployment Platform Setup

**Choose ONE of the following deployment platforms:**

### Option A: Render (Easier Setup, Free Tier)

#### **Setup Instructions:**

1. **Create Render Account**:
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account
   - Authorize Render to access your repositories

2. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect your `learn-testing` repository
   - Configure service:
     - **Name**: `learn-testing-[your-name]`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Configure Environment Variables**:
   - In service settings → "Environment"
   - Add: `NODE_ENV=production`
   - Add: `PORT=10000` (Render's default)

4. **Get API Key and Service ID**:
   - Go to Account Settings → API Keys
   - Create new API key
   - Save this for CI/CD integration
   - **Get Service ID**: In your service dashboard, the Service ID is in the URL: `https://dashboard.render.com/web/srv-XXXXXXXXX` (the `srv-XXXXXXXXX` part)

### Option B: Heroku (More Features, Requires Credit Card)

#### **Setup Instructions:**

1. **Create Heroku Account**:
   - Go to [heroku.com](https://heroku.com)
   - Sign up and verify with credit card (required even for free tier)
   - Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

2. **Create Application**:
   ```bash
   # Login to Heroku
   heroku login

   # Create app
   heroku create learn-testing-[your-name]

   # Add Node.js buildpack
   heroku buildpacks:set heroku/nodejs
   ```

3. **Configure Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set NPM_CONFIG_PRODUCTION=false
   ```

4. **Get API Key**:
   ```bash
   # Get your API key
   heroku auth:token
   ```

## 🎯 **Congratulations!**

You now have a complete testing lab with:

### ✅ **What You Built:**
- **Ultra-simple web app** (1 button, 1 API)
- **4 types of tests**: Unit, Integration, E2E, BDD
- **Code quality analysis** with SonarCloud
- **Test reporting** with ReportPortal
- **Automated CI/CD** pipeline
- **Containerized deployment**

### ✅ **What You Learned:**
- How to structure tests properly
- How to integrate testing tools
- How to set up CI/CD pipelines
- How to use enterprise DevOps tools
- How to deploy applications automatically

### 🚀 **Next Steps:**
1. **Experiment**: Try adding new features and tests
2. **Scale**: Apply these patterns to larger applications
3. **Explore**: Try other testing frameworks and tools
4. **Share**: Use this knowledge in your projects

### 📚 **Key Takeaways:**
- **Testing is essential** for reliable software
- **Automation saves time** and reduces errors
- **Simple tools** can create powerful workflows
- **Enterprise practices** start with good foundations
## 🛠️ Quick Troubleshooting

### Tests Not Running
```bash
# Check Node.js version
node --version  # Should be 22+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests manually
npm test
```

### CI/CD Pipeline Failing
1. **Check secrets**: Make sure all tokens are set correctly
2. **Check logs**: Look at the pipeline logs for specific errors
3. **Test locally**: Run `npm test` locally first

### Can't Access Deployed App
1. **Check deployment logs** in your platform (Render/Heroku)
2. **Verify environment variables** are set correctly
3. **Check if app is actually running** on the correct port

---

**🎉 You've completed the Testing Lab setup! Your trainees now have hands-on experience with modern testing and DevOps practices.**

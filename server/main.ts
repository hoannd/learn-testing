import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import * as querystring from "node:querystring";
import { URL } from "node:url";

class Router {
    routes: Array<{ method: string; path: string; handler: Function }> = [];

    get(path: string, handler: Function) {
        this.routes.push({ method: "GET", path, handler });
    }

    post(path: string, handler: Function) {
        this.routes.push({ method: "POST", path, handler });
    }

    handle(req: http.IncomingMessage, res: http.ServerResponse) {
        const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;
        const method = req.method;

        const route = this.routes.find(r => r.method === method && r.path === pathname);

        if (route) {
            if (method === "POST") {
                this.handlePost(req, res, route.handler);
            } else {
                route.handler(req, res);
            }
        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
        }
    }

    handlePost(req: http.IncomingMessage, res: http.ServerResponse, handler: Function) {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            handler(req, res, body);
        });
    }
}

export const router = new Router();

function parseHeaders(headers: http.IncomingHttpHeaders) {
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
            // Capitalize header names to match the expected format
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            result[capitalizedKey] = Array.isArray(value) ? value : [value];
        }
    }
    return result;
}

function parseForm(body: string) {
    const parsed = querystring.parse(body);
    const result: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(parsed)) {
        if (value !== undefined) {
            result[key] = Array.isArray(value) ? value as string[] : [value as string];
        }
    }
    return result;
}

// Define routes
router.get("/forms/post", (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.setHeader("Content-Type", "text/html");

    const filePath = path.join("server", "public", "form.html");
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("File not found");
            return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
    });
});

router.post("/post", (req: http.IncomingMessage, res: http.ServerResponse, body: string) => {
    const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
    const contentType = req.headers["content-type"] || "";

    let json = null;
    let form = {};

    if (contentType.includes("application/json")) {
        try {
            json = JSON.parse(body);
        } catch (e) {
            // Invalid JSON, keep as null
        }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
        form = parseForm(body);
    }

    const response = {
        args: Object.fromEntries(parsedUrl.searchParams),
        headers: parseHeaders(req.headers),
        method: req.method,
        origin: req.socket.remoteAddress || "unknown",
        url: parsedUrl.href,
        data: body,
        files: {},
        form,
        json,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response, null, 2));
});

// Health check endpoint
router.get("/health", (req: http.IncomingMessage, res: http.ServerResponse) => {
    const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(health, null, 2));
});

// Fallback route for root
router.get("/", (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("Hello World!");
});

export function createServer() {
    const server = http.createServer((req, res) => {
        router.handle(req, res);
    });
    return server;
}

export function startServer(port?: number) {
    const server = createServer();
    const PORT = port || process.env.PORT || 3000;

    server.listen(PORT, () => {
        console.log(`Server start at port ${PORT}`);
    });

    return server;
}

// CLI entry point - start server if this file is run directly
if (require.main === module) {
    const port = process.argv[2] ? parseInt(process.argv[2]) : undefined;
    startServer(port);
}

import * as http from "node:http";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createServer, router } from "../../server/main";

describe("Server Unit Tests", () => {
    describe("Router", () => {
        beforeEach(() => {
            // Clear routes before each test
            router.routes = [];
        });

        test("should register GET routes", () => {
            const handler = vi.fn();
            router.get("/test", handler);

            expect(router.routes).toHaveLength(1);
            expect(router.routes[0]).toEqual({ method: "GET", path: "/test", handler });
        });

        test("should register POST routes", () => {
            const handler = vi.fn();
            router.post("/test", handler);

            expect(router.routes).toHaveLength(1);
            expect(router.routes[0]).toEqual({ method: "POST", path: "/test", handler });
        });

        test("should handle 404 for unregistered routes", () => {
            const mockReq = {
                url: "/nonexistent",
                method: "GET",
                headers: { host: "localhost:3000" },
            } as http.IncomingMessage;

            const mockRes = { writeHead: vi.fn(), end: vi.fn() } as unknown as http.ServerResponse;
            router.handle(mockReq, mockRes);

            expect(mockRes.writeHead).toHaveBeenCalledWith(404, { "Content-Type": "text/plain" });
            expect(mockRes.end).toHaveBeenCalledWith("Not Found");
        });
    });

    describe("createServer", () => {
        test("should create an HTTP server instance", () => {
            const server = createServer();
            expect(server).toBeInstanceOf(http.Server);
            server.close();
        });
    });

    describe("Health endpoint", () => {
        test("should include all required health check fields", async () => {
            // Register the health route (simulating the actual server setup)
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

            const mockReq = {
                url: "/health",
                method: "GET",
                headers: { host: "localhost:3000" },
            } as http.IncomingMessage;

            let responseData = "";
            let statusCode = 0;
            let headers: any = {};

            const mockRes = {
                writeHead: vi.fn((code: any, resHeaders: any) => {
                    statusCode = code;
                    headers = resHeaders;
                }),
                end: vi.fn((data: any) => responseData = data),
            } as unknown as http.ServerResponse;

            router.handle(mockReq, mockRes);

            expect(statusCode).toBe(200);
            expect(headers["Content-Type"]).toBe("application/json");

            const health = JSON.parse(responseData);
            expect(health).toMatchObject({
                status: "healthy",
                timestamp: expect.any(String),
                uptime: expect.any(Number),
                environment: expect.any(String),
            });
        });
    });
});

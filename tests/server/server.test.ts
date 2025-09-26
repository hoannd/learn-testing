import * as http from "node:http";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createServer } from "../../server/main";

const PORT = process.env.PORT || 3000;

describe("Server Tests", () => {
    let server: http.Server;

    beforeAll(async () => {
        server = createServer();

        return new Promise<void>((resolve) => {
            server.listen(PORT, () => {
                console.log(`Test server running on port ${PORT}`);
                resolve();
            });
        });
    });

    afterAll(async () => {
        if (server) {
            return new Promise<void>((resolve) => {
                server.close(() => resolve());
            });
        }
    });
    test("GET / returns Hello World", async () => {
        const response = await makeRequest("GET", "/");

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe("Hello World!");
        expect(response.headers["content-type"]).toBe("text/html");
    });

    test("GET /forms/post returns HTML form", async () => {
        const response = await makeRequest("GET", "/forms/post");

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.body).toContain("<form");
        expect(response.body).toContain("method=\"post\"");
        expect(response.body).toContain("action=\"/post\"");
    });

    test("POST /post with form data returns correct JSON structure", async () => {
        const postData =
            "custname=John+Doe&custtel=123456789&custemail=john@example.com&size=large&topping=bacon&topping=cheese";

        const response = await makeRequest("POST", "/post", postData, {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData).toString(),
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");

        const responseData = JSON.parse(response.body);

        // Check response structure matches expected format
        expect(typeof responseData.args).toBe("object");
        expect(typeof responseData.headers).toBe("object");
        expect(responseData.method).toBe("POST");
        expect(typeof responseData.origin).toBe("string");
        expect(typeof responseData.url).toBe("string");
        expect(responseData.data).toBe(postData);
        expect(typeof responseData.files).toBe("object");
        expect(typeof responseData.form).toBe("object");
        expect(responseData.json).toBeNull();

        // Check form data parsing - values should be arrays
        expect(Array.isArray(responseData.form.custname)).toBe(true);
        expect(responseData.form.custname[0]).toBe("John Doe");
        expect(Array.isArray(responseData.form.topping)).toBe(true);
        expect(responseData.form.topping).toContain("bacon");
        expect(responseData.form.topping).toContain("cheese");

        // Check headers format - keys should be capitalized
        expect(responseData.headers["Content-type"]).toBeDefined();
        expect(Array.isArray(responseData.headers["Content-type"])).toBe(true);
    });

    test("POST /post with JSON data returns correct structure", async () => {
        const postData = JSON.stringify({
            name: "Jane Doe",
            email: "jane@example.com",
            preferences: ["pizza", "salad"],
        });

        const response = await makeRequest("POST", "/post", postData, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData).toString(),
        });

        expect(response.statusCode).toBe(200);

        const responseData = JSON.parse(response.body);

        // Check that JSON data is parsed correctly
        expect(typeof responseData.json).toBe("object");
        expect(responseData.json.name).toBe("Jane Doe");
        expect(responseData.json.email).toBe("jane@example.com");
        expect(Array.isArray(responseData.json.preferences)).toBe(true);

        // Check that raw data is also available
        expect(responseData.data).toBe(postData);

        // Form should be empty object for JSON requests
        expect(responseData.form).toEqual({});
    });

    test("POST /post with query parameters includes them in args", async () => {
        const postData = "test=data";

        const response = await makeRequest("POST", "/post?param1=value1&param2=value2", postData, {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData).toString(),
        });

        expect(response.statusCode).toBe(200);

        const responseData = JSON.parse(response.body);

        // Check query parameters
        expect(typeof responseData.args).toBe("object");
        expect(responseData.args.param1).toBe("value1");
        expect(responseData.args.param2).toBe("value2");
    });

    test("GET /nonexistent returns 404", async () => {
        const response = await makeRequest("GET", "/nonexistent");

        expect(response.statusCode).toBe(404);
        expect(response.body).toBe("Not Found");
    });

    test("Response includes correct headers and metadata format", async () => {
        const response = await makeRequest("POST", "/post", "test=data", {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Test-Agent",
            "X-Custom-Header": "test-value",
        });

        expect(response.statusCode).toBe(200);

        const responseData = JSON.parse(response.body);

        // Check that request headers are included and properly formatted
        expect(typeof responseData.headers).toBe("object");

        // Headers should have capitalized keys and array values
        for (const [key, value] of Object.entries(responseData.headers)) {
            expect(Array.isArray(value)).toBe(true);
        }

        // Check URL format
        expect(responseData.url).toContain("http://localhost:");
        expect(responseData.url).toContain("/post");

        // Check origin
        expect(typeof responseData.origin).toBe("string");
    });

    test("GET /health returns health status", async () => {
        const response = await makeRequest("GET", "/health");

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");

        const healthData = JSON.parse(response.body);
        expect(healthData).toMatchObject({
            status: "healthy",
            timestamp: expect.any(String),
            uptime: expect.any(Number),
            environment: expect.stringMatching(/development|test|production/),
        });
    });

    test("POST /post with invalid JSON returns null json field", async () => {
        const invalidJson = "{\"invalid\": json}";

        const response = await makeRequest("POST", "/post", invalidJson, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(invalidJson).toString(),
        });

        expect(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        expect(responseData.json).toBeNull();
        expect(responseData.data).toBe(invalidJson);
    });

    test("POST /post with mixed content type defaults to form parsing", async () => {
        const postData = "key=value&another=test";

        const response = await makeRequest("POST", "/post", postData, {
            "Content-Type": "text/plain",
            "Content-Length": Buffer.byteLength(postData).toString(),
        });

        expect(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        expect(responseData.form).toEqual({});
        expect(responseData.json).toBeNull();
        expect(responseData.data).toBe(postData);
    });


});

// Helper function to make HTTP requests
function makeRequest(method: string, path: string, data?: string, headers: Record<string, string> = {}): Promise<{
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: string;
}> {
    return new Promise((resolve, reject) => {
        const options: http.RequestOptions = { hostname: "localhost", port: PORT, path, method, headers };

        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => resolve({ statusCode: res.statusCode || 0, headers: res.headers, body }));
        });
        req.on("error", reject);
        if (data) req.write(data);
        req.end();
    });
}

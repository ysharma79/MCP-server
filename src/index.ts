import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Universal API Gateway",
		version: "1.0.0",
	});

	async init() {
		// System tools
		this.server.tool("system.listTools", {}, async () => {
			const tools = [
				"add",
				"calculate",
				"callApi",
				"system.listTools"
			];
			return { content: [{ type: "text", text: JSON.stringify(tools) }] };
		});

		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);

		// Universal API Caller
		this.server.tool(
			"callApi",
			{
				url: z.string().url(),
				method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]).default("GET"),
				headers: z.record(z.string()).optional(),
				body: z.any().optional(),
				queryParams: z.record(z.string()).optional(),
			},
			async ({ url, method, headers, body, queryParams }) => {
				try {
					// Build URL with query parameters if provided
					const targetUrl = new URL(url);
					if (queryParams) {
						Object.entries(queryParams).forEach(([key, value]) => {
							targetUrl.searchParams.append(key, value);
						});
					}

					// Prepare fetch options
					const fetchOptions: RequestInit = {
						method,
						headers: headers || {},
					};

					// Add body for non-GET requests if provided
					if (method !== "GET" && method !== "HEAD" && body) {
						if (typeof body === "object") {
							fetchOptions.body = JSON.stringify(body);
							// Set content-type to JSON if not specified
							if (fetchOptions.headers && !Object.keys(fetchOptions.headers).some(h => h.toLowerCase() === "content-type")) {
								(fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
							}
						} else {
							fetchOptions.body = String(body);
						}
					}

					// Make the API call
					const response = await fetch(targetUrl.toString(), fetchOptions);
					
					// Get response data
					let responseData: any;
					const contentType = response.headers.get("content-type");
					
					if (contentType?.includes("application/json")) {
						try {
							responseData = await response.json();
						} catch (e) {
							responseData = await response.text();
						}
					} else {
						responseData = await response.text();
					}

					// Prepare response object
					const result = {
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						data: responseData
					};

					return { 
						content: [{ 
							type: "text", 
							text: JSON.stringify(result, null, 2) 
						}] 
					};
				} catch (error) {
					return { 
						content: [{ 
							type: "text", 
							text: `Error calling API: ${error instanceof Error ? error.message : String(error)}` 
						}] 
					};
				}
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Handle CORS preflight requests
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id",
					"Access-Control-Max-Age": "86400",
				},
			});
		}

		// Handle SSE endpoints
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			const response = MyMCP.serveSSE("/sse").fetch(request, env, ctx);
			
			// Add CORS headers to the response
			return response.then(originalResponse => {
				const newHeaders = new Headers(originalResponse.headers);
				newHeaders.set("Access-Control-Allow-Origin", "*");
				newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
				newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, mcp-session-id");
				
				return new Response(originalResponse.body, {
					status: originalResponse.status,
					statusText: originalResponse.statusText,
					headers: newHeaders,
				});
			});
		}

		// Handle MCP endpoint
		if (url.pathname === "/mcp") {
			const response = MyMCP.serve("/mcp").fetch(request, env, ctx);
			
			// Add CORS headers to the response
			return response.then(originalResponse => {
				const newHeaders = new Headers(originalResponse.headers);
				newHeaders.set("Access-Control-Allow-Origin", "*");
				newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
				newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, mcp-session-id");
				
				return new Response(originalResponse.body, {
					status: originalResponse.status,
					statusText: originalResponse.statusText,
					headers: newHeaders,
				});
			});
		}

		// Handle 404 with CORS headers
		return new Response("Not found", { 
			status: 404,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id",
			}
		});
	},
};

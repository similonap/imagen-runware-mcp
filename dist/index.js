#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const sdk_js_1 = require("@runware/sdk-js");
dotenv_1.default.config();
const RUNWARE_API = process.env.RUNWARE_API;
if (!RUNWARE_API) {
    console.error('Error: RUNWARE_API environment variable is not set.');
    process.exit(1);
}
const runware = new sdk_js_1.Runware({ apiKey: RUNWARE_API });
const server = new mcp_js_1.McpServer({
    name: 'imagen-runware-server',
    version: '1.0.0'
});
server.registerTool('generateImage', {
    title: 'Generate Image',
    description: 'Generate image from text prompt using Runware',
    inputSchema: { prompt: zod_1.z.string(), width: zod_1.z.number().optional(), height: zod_1.z.number().optional() },
    outputSchema: { imageURL: zod_1.z.string() }
}, async ({ prompt, width = 1024, height = 1024 }) => {
    try {
        const images = await runware.requestImages({
            positivePrompt: prompt,
            model: "runware:97@3",
            width: width,
            height: height,
        });
        if (images === undefined || images.length === 0) {
            throw new Error('No images generated');
        }
        if (images[0].imageURL === undefined) {
            throw new Error('Generated image has no URL');
        }
        return {
            content: [{ type: 'text', text: images[0].imageURL }],
            structuredContent: { imageURL: images[0].imageURL }
        };
    }
    catch (err) {
        const error = err;
        console.log(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`
                }
            ],
            isError: true
        };
    }
});
(async () => {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
})();

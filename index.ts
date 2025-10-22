#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import dotenv from 'dotenv';
import { Runware } from "@runware/sdk-js";
dotenv.config();

const RUNWARE_API = process.env.RUNWARE_API;
if (!RUNWARE_API) {
    console.error('Error: RUNWARE_API environment variable is not set.');
    process.exit(1);
}

const runware = new Runware({ apiKey: RUNWARE_API });

const server = new McpServer({
    name: 'imagen-runware-server',
    version: '1.0.0'
});

server.registerTool(
    'generateImage',
    {
        title: 'Generate Image',
        description: 'Generate image from text prompt using Runware',
        inputSchema: { prompt: z.string(), width: z.number().optional(), height: z.number().optional() },
        outputSchema: { imageURL: z.string() }
    },
    async ({ prompt,width = 1024, height = 1024 }) => {
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
                structuredContent: {imageURL: images[0].imageURL}
            };
        } catch (err) {
            const error = err as Error;
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
    }
);

(async() => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
})();

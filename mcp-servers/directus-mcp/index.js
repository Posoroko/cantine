/**
 * MCP Server for Directus Database - Cantinification Project
 * Uses stdio transport (no port needed).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ============================================================================
// Environment & Safety Checks
// ============================================================================

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL?.replace(/\/+$/, '');
const DIRECTUS_MCP_TOKEN = process.env.DIRECTUS_MCP_TOKEN;

if (!DIRECTUS_URL) {
    console.error('ERROR: DIRECTUS_URL environment variable is not set.');
    process.exit(1);
}

if (!DIRECTUS_MCP_TOKEN) {
    console.error('ERROR: DIRECTUS_MCP_TOKEN is not set.');
    process.exit(1);
}

// ============================================================================
// Directus API Client
// ============================================================================

async function directusFetch(endpoint, options = {}) {
    const url = `${DIRECTUS_URL}${endpoint}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${DIRECTUS_MCP_TOKEN}`,
            'Content-Type': 'application/json',
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`Directus API error ${response.status}`);
    }

    const body = await response.json();
    return body?.data ?? body;
}

// ============================================================================
// Data Fetchers
// ============================================================================

async function getAllCollections() {
    const collections = await directusFetch('/collections');
    // Filter out system collections except users/files
    return collections.filter(c => 
        !c.collection.startsWith('directus_') || 
        ['directus_users', 'directus_files'].includes(c.collection)
    ).map(c => ({
        name: c.collection,
        icon: c.meta?.icon,
        note: c.meta?.note
    }));
}

async function getCollectionSchema(collectionName) {
    const fields = await directusFetch(`/fields/${collectionName}`);
    return fields.map(f => ({
        field: f.field,
        type: f.type,
        interface: f.meta?.interface,
        required: f.schema?.is_nullable === false,
        note: f.meta?.note
    }));
}

async function getRelationships() {
    return await directusFetch('/relations');
}

async function getPermissions() {
    return await directusFetch('/permissions');
}

async function getSampleData(collectionName, limit = 5) {
    const items = await directusFetch(`/items/${collectionName}?limit=${Math.min(limit, 5)}`);
    // Optionally redact sensitive fields here
    return items;
}

async function createItem(collectionName, itemData) {
    return await directusFetch(`/items/${collectionName}`, {
        method: 'POST',
        body: JSON.stringify(itemData)
    });
}

// ============================================================================
// MCP Server Setup
// ============================================================================

const server = new Server(
    { name: 'cantinification-directus-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'get_all_collections',
            description: 'List all Directus collections with basic info',
            inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
            name: 'get_collection_schema',
            description: 'Get detailed schema for a specific collection',
            inputSchema: {
                type: 'object',
                properties: {
                    collection: { type: 'string', description: 'Collection name' }
                },
                required: ['collection']
            }
        },
        {
            name: 'get_relationships',
            description: 'Get all relationships between collections',
            inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
            name: 'get_permissions',
            description: 'Get permissions for all collections and roles',
            inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
            name: 'get_sample_data',
            description: 'Fetch sample records from a collection (max 5)',
            inputSchema: {
                type: 'object',
                properties: {
                    collection: { type: 'string', description: 'Collection name' },
                    limit: { type: 'number', description: 'Max 5', default: 5 }
                },
                required: ['collection']
            }
        },
        {
            name: 'create_item',
            description: 'Create a new item in a collection',
            inputSchema: {
                type: 'object',
                properties: {
                    collection: { type: 'string', description: 'Collection name' },
                    data: { type: 'object', description: 'Item data to create' }
                },
                required: ['collection', 'data']
            }
        }
    ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;
        switch (name) {
            case 'get_all_collections':
                result = await getAllCollections();
                break;
            case 'get_collection_schema':
                result = await getCollectionSchema(args.collection);
                break;
            case 'get_relationships':
                result = await getRelationships();
                break;
            case 'get_permissions':
                result = await getPermissions();
                break;
            case 'get_sample_data':
                result = await getSampleData(args.collection, args.limit);
                break;
            case 'create_item':
                result = await createItem(args.collection, args.data);
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
});

// Start server
async function main() {
    console.error('Starting Cantinification Directus MCP Server...');
    console.error(`Directus URL: ${DIRECTUS_URL}`);
    console.error(`Token configured: ${DIRECTUS_MCP_TOKEN ? 'Yes' : 'No'}`);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('MCP Server connected and ready.');
}

main().catch(console.error);

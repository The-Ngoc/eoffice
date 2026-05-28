const fs = require('fs/promises');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { DocxLoader } = require('@langchain/community/document_loaders/fs/docx');
const { TextLoader } = require('@langchain/classic/document_loaders/fs/text');

const DEFAULT_CHAT_MODEL = String(process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash').trim();
const DEFAULT_EMBEDDING_MODEL = String(process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001').trim();
const DEFAULT_TOP_K = Number(process.env.RAG_TOP_K || 3);
const MAX_GENERATE_RETRIES = Number(process.env.RAG_MAX_GENERATE_RETRIES || 2);
const VECTOR_STORE_PATH = path.resolve(__dirname, '../data/vectors.json');
const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.pdf', '.docx']);

function getApiKey() {
    return String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

function getChatModelName() {
    return DEFAULT_CHAT_MODEL || 'gemini-2.5-flash';
}

function getEmbeddingModelName() {
    return DEFAULT_EMBEDDING_MODEL || 'gemini-embedding-001';
}

function cosineSimilarity(leftVector, rightVector) {
    const length = Math.min(Array.isArray(leftVector) ? leftVector.length : 0, Array.isArray(rightVector) ? rightVector.length : 0);
    let dot = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < length; index += 1) {
        const leftValue = Number(leftVector[index]) || 0;
        const rightValue = Number(rightVector[index]) || 0;
        dot += leftValue * rightValue;
        leftMagnitude += leftValue * leftValue;
        rightMagnitude += rightValue * rightValue;
    }

    if (leftMagnitude === 0 || rightMagnitude === 0) {
        return 0;
    }

    return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function loadVectorStore(vectorStorePath = VECTOR_STORE_PATH) {
    try {
        const raw = await fs.readFile(vectorStorePath, 'utf8');
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(
            (item) => item && typeof item.content === 'string' && Array.isArray(item.vector)
        );
    } catch {
        return [];
    }
}

async function getVectorCount() {
    const vectorStore = await loadVectorStore();
    return vectorStore.length;
}

async function retrieveContext(question, vectorStore, topK = DEFAULT_TOP_K) {
    if (!Array.isArray(vectorStore) || vectorStore.length === 0) {
        return [];
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Khong tim thay GEMINI_API_KEY hoac GOOGLE_API_KEY trong .env');
    }

    const embeddingModel = new GoogleGenerativeAIEmbeddings({
        apiKey,
        modelName: getEmbeddingModelName()
    });

    const questionVector = await embeddingModel.embedQuery(question);

    return vectorStore
        .map((chunk) => ({
            ...chunk,
            score: cosineSimilarity(questionVector, chunk.vector)
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, topK);
}

function buildSystemInstruction(contextChunks) {
    const contextText =
        contextChunks.length > 0
            ? contextChunks
                .map(
                    (chunk, index) =>
                        `[${index + 1}] score=${chunk.score.toFixed(4)}\nNguon: ${chunk.source || 'unknown'}\n${chunk.content}`
                )
                .join('\n\n')
            : 'Khong co nguyen van ban nao duoc tim thay tu vector database.';

    return [
        'Ban la chatbot RAG tieng Viet.',
        'Hay chi dua ra cau tra loi duoc suy ra tu ngung canh duoc cung cap.',
        'Neu thong tin khong du trong ngung canh, hay noi ro la ban khong du du lieu de ket luan.',
        'Khong tu bau ra thong tin moi.',
        `Ngu canh tham khao:\n${contextText}`
    ].join('\n\n');
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelayMs(error) {
    const retryInfo = error?.error?.details?.find(
        (detail) => detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    );

    const retryDelay = retryInfo?.retryDelay;
    if (typeof retryDelay === 'string') {
        const match = retryDelay.match(/^(\d+(?:\.\d+)?)s$/);
        if (match) {
            return Math.ceil(Number(match[1]) * 1000);
        }
    }

    const message = String(error?.message || '');
    const messageMatch = message.match(/Please retry in ([\d.]+)s/i);
    if (messageMatch) {
        return Math.ceil(Number(messageMatch[1]) * 1000);
    }

    return null;
}

function isQuotaOrRateLimitError(error) {
    const statusCode = error?.status || error?.error?.code;
    if (statusCode === 429) {
        return true;
    }

    const message = String(error?.message || error?.error?.message || '');
    return /quota|rate limit|resource_exhausted/i.test(message);
}

function isTransientGeminiError(error) {
    if (isQuotaOrRateLimitError(error)) {
        return true;
    }

    const statusCode = error?.status || error?.error?.code || error?.response?.status;
    if (typeof statusCode === 'number' && statusCode >= 500) {
        return true;
    }

    const message = String(error?.message || error?.error?.message || '').toLowerCase();
    return [
        'econnreset',
        'etimedout',
        'timeout',
        'fetch failed',
        'network error',
        'temporarily unavailable'
    ].some((token) => message.includes(token));
}

function getChatClient(systemInstruction) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Khong tim thay GEMINI_API_KEY hoac GOOGLE_API_KEY trong .env');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: getChatModelName(),
        systemInstruction
    });
}

async function generateWithRetry(request) {
    let attempt = 0;

    while (true) {
        try {
            const client = getChatClient(request.systemInstruction);
            const result = await client.generateContent({
                contents: request.contents,
                generationConfig: request.generationConfig
            });
            const response = result?.response || result;
            const text = typeof response?.text === 'function' ? response.text() : String(response?.text || '');

            return { text };
        } catch (error) {
            if (!isTransientGeminiError(error) || attempt >= MAX_GENERATE_RETRIES) {
                throw error;
            }

            const retryDelayMs = extractRetryDelayMs(error) ?? 5000 * (attempt + 1);
            await sleep(retryDelayMs);
            attempt += 1;
        }
    }
}

function normalizeHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history.filter((item) => item && typeof item === 'object' && typeof item.role === 'string' && Array.isArray(item.parts));
}

async function chatWithMessage({ message, history = [], topK = DEFAULT_TOP_K }) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
        const error = new Error('Message is required.');
        error.statusCode = 400;
        throw error;
    }

    const vectorStore = await loadVectorStore();
    let relevantChunks = [];

    try {
        relevantChunks = await retrieveContext(cleanMessage, vectorStore, topK);
    } catch (error) {
        console.warn('RAG retrieveContext failed, fallback to no-context chat:', error?.message || error);
    }

    const systemInstruction = buildSystemInstruction(relevantChunks);
    const contents = [
        ...normalizeHistory(history),
        { role: 'user', parts: [{ text: cleanMessage }] }
    ];

    try {
        const response = await generateWithRetry({
            contents,
            systemInstruction,
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024
            }
        });

        return {
            messages: response.text || '(Khong co noi dung phan hoi)',
            sources: relevantChunks.map((chunk) => ({
                source: chunk.source,
                type: chunk.type,
                score: chunk.score
            }))
        };
    } catch (error) {
        const quotaError = isQuotaOrRateLimitError(error);
        const retryAfterMs = extractRetryDelayMs(error);
        const transientError = isTransientGeminiError(error);

        const responseError = new Error(
            error?.message ||
            (quotaError ? 'Gemini API da vuot quota. Hay thu lai sau.' : transientError ? 'Gemini API tam thoi khong san sang. Hay thu lai sau.' : 'Khong the xu ly yeu cau.')
        );
        responseError.statusCode = quotaError ? 429 : transientError ? 503 : 500;
        responseError.retryAfterSeconds = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : null;
        throw responseError;
    }
}

async function extractTextFromFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.pdf') {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        return docs.map((doc) => doc.pageContent || '').join('\n');
    }

    if (extension === '.docx') {
        const loader = new DocxLoader(filePath);
        const docs = await loader.load();
        return docs.map((doc) => doc.pageContent || '').join('\n');
    }

    const loader = new TextLoader(filePath);
    const docs = await loader.load();
    return docs.map((doc) => doc.pageContent || '').join('\n');
}

async function collectInputFiles(targetPath) {
    const stats = await fs.stat(targetPath);

    if (stats.isFile()) {
        const extension = path.extname(targetPath).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(extension)) {
            throw new Error(`Dinh dang file khong duoc ho tro: ${extension || '(khong co dinh dang)'}`);
        }

        return [targetPath];
    }

    if (!stats.isDirectory()) {
        throw new Error(`Duong dan khong hop le: ${targetPath}`);
    }

    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(targetPath, entry.name);

        if (entry.isDirectory()) {
            const nestedFiles = await collectInputFiles(entryPath);
            files.push(...nestedFiles);
            continue;
        }

        const extension = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(extension)) {
            files.push(entryPath);
        }
    }

    return files;
}

async function buildVectorStoreFromPath(inputPath, outputPath) {
    const apiKey = getApiKey();
    if (!apiKey) {
        const error = new Error('Khong tim thay GEMINI_API_KEY hoac GOOGLE_API_KEY trong .env');
        error.statusCode = 500;
        throw error;
    }

    const absoluteInputPath = path.resolve(inputPath);
    const absoluteOutputPath = path.resolve(outputPath);
    const inputFiles = await collectInputFiles(absoluteInputPath);

    if (inputFiles.length === 0) {
        return { inputFiles: 0, chunks: 0, outputPath: absoluteOutputPath };
    }

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 70
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey,
        modelName: getEmbeddingModelName()
    });

    const allChunks = [];

    for (const filePath of inputFiles) {
        const text = await extractTextFromFile(filePath);
        const chunks = await splitter.splitText(text);

        for (const chunk of chunks) {
            if (String(chunk || '').trim()) {
                allChunks.push({
                    source: path.relative(process.cwd(), filePath),
                    type: path.extname(filePath).toLowerCase().replace(/^\./, ''),
                    content: chunk
                });
            }
        }
    }

    if (allChunks.length === 0) {
        await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
        await fs.writeFile(absoluteOutputPath, '[]', 'utf8');
        return { inputFiles: inputFiles.length, chunks: 0, outputPath: absoluteOutputPath };
    }

    const vectors = await embeddings.embedDocuments(allChunks.map((item) => item.content));

    const results = allChunks.map((item, index) => ({
        id: index,
        source: item.source,
        type: item.type,
        content: item.content,
        vector: vectors[index]
    }));

    await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await fs.writeFile(absoluteOutputPath, JSON.stringify(results, null, 2), 'utf8');

    return {
        inputFiles: inputFiles.length,
        chunks: allChunks.length,
        vectorSize: vectors[0]?.length || 0,
        outputPath: absoluteOutputPath
    };
}

module.exports = {
    VECTOR_STORE_PATH,
    loadVectorStore,
    getVectorCount,
    retrieveContext,
    buildSystemInstruction,
    generateWithRetry,
    chatWithMessage,
    buildVectorStoreFromPath,
    collectInputFiles,
    extractTextFromFile,
    cosineSimilarity,
    isQuotaOrRateLimitError,
    extractRetryDelayMs
};
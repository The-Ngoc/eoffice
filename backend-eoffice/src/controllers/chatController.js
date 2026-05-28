const { chatWithMessage } = require('../services/chatService');

async function chat(req, res) {
    try {
        const message = String(req.body?.message || req.body?.question || '').trim();
        const history = Array.isArray(req.body?.history) ? req.body.history : [];
        const topK = Number(req.body?.topK || 3);
        const result = await chatWithMessage({
            message,
            history,
            topK: Number.isFinite(topK) ? topK : 3
        });

        return res.status(200).json({
            answer: result.messages,
            messages: result.messages,
            sources: result.sources
        });
    } catch (error) {
        console.error('❌ Chat endpoint error:', {
            statusCode: error?.statusCode,
            message: error?.message,
            retryAfterSeconds: error?.retryAfterSeconds,
            stack: error?.stack
        });
        const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
        return res.status(statusCode).json({
            error: error?.message || 'Khong the xu ly yeu cau.',
            retryAfterSeconds: error?.retryAfterSeconds ?? null
        });
    }
}

module.exports = {
    chat
};
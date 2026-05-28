const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

function createTextSplitter(options = {}) {
    const chunkSize = options.chunkSize ?? Number(process.env.RAG_CHUNK_SIZE || 450);
    const chunkOverlap = options.chunkOverlap ?? Number(process.env.RAG_CHUNK_OVERLAP || 80);

    return new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separators: ['\n\n', '\n', '. ', '? ', '! ', '; ', ': ', ', ', ' ', '']
    });
}

async function chunkDocuments(documents, options = {}) {
    const splitter = createTextSplitter(options);
    return splitter.splitDocuments(documents);
}

module.exports = {
    createTextSplitter,
    chunkDocuments
};
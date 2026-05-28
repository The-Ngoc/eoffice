require('dotenv').config();

const path = require('path');
const { buildVectorStoreFromPath } = require('../src/services/chatService');

async function main() {
    const inputPath = process.argv[2] || 'src/data/files';
    const outputPath = process.argv[3] || 'src/data/vectors.json';

    const result = await buildVectorStoreFromPath(inputPath, outputPath);

    console.log(`So file duoc xu ly: ${result.inputFiles}`);
    console.log(`So chunk tao duoc: ${result.chunks}`);
    console.log(`Kich thuoc vector: ${result.vectorSize || 0}`);
    console.log(`Da luu vector tai: ${path.resolve(outputPath)}`);
}

main().catch((error) => {
    console.error('Loi khi chunking va embedding:', error.message || error);
    process.exit(1);
});
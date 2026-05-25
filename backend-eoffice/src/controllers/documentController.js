const documentService = require('../services/documentService');
const azureDocumentService = require('../services/azureDocumentService');

function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        message
    });
}

function sendError(res, error) {
    return res.status(error.statusCode || 500).json({
        success: false,
        data: null,
        message: error.message || 'Lỗi hệ thống'
    });
}

exports.getAllDocuments = async (req, res) => {
    try {
        const documents = await documentService.getAllDocuments();
        return sendSuccess(res, documents, 'Lấy danh sách văn bản thành công');
    } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách văn bản:', error);
        return sendError(res, error);
    }
};

exports.getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await documentService.getDocumentById(id);
        return sendSuccess(res, document, 'Lấy chi tiết văn bản thành công');
    } catch (error) {
        console.error('❌ Lỗi khi lấy chi tiết văn bản:', error);
        return sendError(res, error);
    }
};

exports.addDocument = async (req, res) => {
    try {
        // Lấy files từ multer middleware - req.files chứa mảng các files được upload
        const files = req.files || [];
        
        // Gọi service với payload và files để xử lý: upload lên Cloudinary + lưu vào database
        const document = await documentService.createDocument(req.body, files);
        return sendSuccess(res, document, 'Tạo văn bản thành công', 201);
    } catch (error) {
        console.error('❌ Lỗi khi tạo văn bản:', error);
        return sendError(res, error);
    }
};

exports.updateDocumentApprove = async (req, res) => {
    try {
        const document = await documentService.updateDocumentApprove(req.body);
        return sendSuccess(res, document, 'Cập nhật trạng thái văn bản thành công');
    } catch (error) {
        console.error('❌ Lỗi khi cập nhật trạng thái văn bản:', error);
        return sendError(res, error);
    }
};

exports.submitToLeader = async (req, res) => {
    try {
        const actor = {
            id: req.user?.id || req.headers['x-user-id'] || req.headers['user-id'] || req.body?.userId || null,
            name: req.headers['x-user-name'] || req.body?.userName || 'Clerical',
            role: req.user?.role || req.headers['x-user-role'] || 'CLERICAL',
            departmentId: req.user?.departmentId || req.headers['x-department-id'] || req.body?.departmentId || null
        };

        const document = await documentService.submitDocumentToLeader(req.body, actor);
        return sendSuccess(res, document, 'Trình lãnh đạo duyệt văn bản thành công');
    } catch (error) {
        console.error('❌ Lỗi khi trình duyệt văn bản:', error);
        return sendError(res, error);
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const id = req.body?.id || req.query?.id || req.params?.id;
        const result = await documentService.deleteDocument(id);
        return sendSuccess(res, result, 'Xóa văn bản thành công');
    } catch (error) {
        console.error('❌ Lỗi khi xóa văn bản:', error);
        return sendError(res, error);
    }
};

exports.getDocumentStats = async (req, res) => {
    try {
        const stats = await documentService.getDocumentStats();
        return sendSuccess(res, stats, 'Lấy thống kê văn bản thành công');
    } catch (error) {
        console.error('❌ Lỗi khi lấy thống kê văn bản:', error);
        return sendError(res, error);
    }
};

exports.extractAzureContent = async (req, res) => {
    try {
        console.log('controlle done')
        const extracted = await azureDocumentService.extractAndProcessDocument(req.file);
        return sendSuccess(res, extracted, 'Trích xuất và xử lý nội dung từ Azure thành công');
    } catch (error) {
        console.error('❌ Lỗi khi trích xuất nội dung từ Azure:', error);
        return sendError(res, error);
    }
};

exports.getDocumentFiles = async (req, res) => {
    try {
        const idDocument = req.params.id_document;
        const files = await documentService.getDocumentFiles(idDocument);

        const normalizedFiles = files.map((file) => ({
            id: file.id,
            file_name: file.file_name,
            file_url: file.file_url
        }));

        return sendSuccess(res, normalizedFiles, 'Lấy danh sách file đính kèm thành công');
    } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách file:', error);
        return sendError(res, error);
    }
};

const { randomUUID } = require('crypto');
const db = require('../models');
const { DOCUMENT_STATUS, TASK_STATUS, PRIORITY, ROLES } = require('../constants/enums');

async function seedDatabase() {
    try {
        console.log('🌱 Bắt đầu seed dữ liệu mẫu...\n');

        // 1. Tạo User trước (vì Department có foreign key managerId)
        const adminUserId = randomUUID();
        const leaderUserId = randomUUID();
        const managerUserId = randomUUID();
        const staff1UserId = randomUUID();
        const staff2UserId = randomUUID();

        const adminUser = await db.User.findOrCreate({
            where: { email: 'admin@example.com' },
            defaults: {
                id: adminUserId,
                email: 'admin@example.com',
                fullName: 'Quản trị viên hệ thống',
                password: 'hashedpassword123',
                role: ROLES.ADMIN
            }
        });

        const leaderUser = await db.User.findOrCreate({
            where: { email: 'leader@example.com' },
            defaults: {
                id: leaderUserId,
                email: 'leader@example.com',
                fullName: 'Lãnh đạo phòng Hành chính',
                password: 'hashedpassword123',
                role: ROLES.LEADER
            }
        });

        const managerUser = await db.User.findOrCreate({
            where: { email: 'manager@example.com' },
            defaults: {
                id: managerUserId,
                email: 'manager@example.com',
                fullName: 'Quản lý phòng Kỹ thuật',
                password: 'hashedpassword123',
                role: ROLES.MANAGER
            }
        });

        const staff1 = await db.User.findOrCreate({
            where: { email: 'staff1@example.com' },
            defaults: {
                id: staff1UserId,
                email: 'staff1@example.com',
                fullName: 'Nhân viên Hành chính 1',
                password: 'hashedpassword123',
                role: ROLES.STAFF
            }
        });

        const staff2 = await db.User.findOrCreate({
            where: { email: 'staff2@example.com' },
            defaults: {
                id: staff2UserId,
                email: 'staff2@example.com',
                fullName: 'Nhân viên Kỹ thuật 1',
                password: 'hashedpassword123',
                role: ROLES.STAFF
            }
        });

        console.log('✅ Tạo 5 User thành công');

        // 2. Tạo Department
        const dept1Id = randomUUID();
        const dept2Id = randomUUID();
        const dept3Id = randomUUID();

        await db.Department.findOrCreate({
            where: { code: 'DEPT-001' },
            defaults: {
                id: dept1Id,
                code: 'DEPT-001',
                name: 'Phòng Hành chính',
                managerId: leaderUserId,
                managerName: 'Lãnh đạo phòng Hành chính'
            }
        });

        await db.Department.findOrCreate({
            where: { code: 'DEPT-002' },
            defaults: {
                id: dept2Id,
                code: 'DEPT-002',
                name: 'Phòng Kỹ thuật',
                managerId: managerUserId,
                managerName: 'Quản lý phòng Kỹ thuật'
            }
        });

        await db.Department.findOrCreate({
            where: { code: 'DEPT-003' },
            defaults: {
                id: dept3Id,
                code: 'DEPT-003',
                name: 'Phòng Tài chính',
                managerId: adminUserId,
                managerName: 'Quản trị viên'
            }
        });

        console.log('✅ Tạo 3 Department thành công');

        // 3. Tạo DepartmentMember
        await db.DepartmentMember.findOrCreate({
            where: { userId: leaderUserId, departmentId: dept1Id },
            defaults: { id: randomUUID(), userId: leaderUserId, departmentId: dept1Id }
        });

        await db.DepartmentMember.findOrCreate({
            where: { userId: staff1UserId, departmentId: dept1Id },
            defaults: { id: randomUUID(), userId: staff1UserId, departmentId: dept1Id }
        });

        await db.DepartmentMember.findOrCreate({
            where: { userId: managerUserId, departmentId: dept2Id },
            defaults: { id: randomUUID(), userId: managerUserId, departmentId: dept2Id }
        });

        await db.DepartmentMember.findOrCreate({
            where: { userId: staff2UserId, departmentId: dept2Id },
            defaults: { id: randomUUID(), userId: staff2UserId, departmentId: dept2Id }
        });

        console.log('✅ Tạo 4 DepartmentMember thành công');

        // 4. Tạo Document
        const doc1Id = randomUUID();
        const doc2Id = randomUUID();

        await db.Document.findOrCreate({
            where: { documentNumber: 'DOC-001' },
            defaults: {
                id: doc1Id,
                documentNumber: 'DOC-001',
                symbol: 'CV/2026/001',
                title: 'Công văn về cải tiến quy trình hành chính',
                sender: 'Phòng Hành chính',
                description: 'Công văn đề xuất cải tiến quy trình xử lý công văn',
                status: DOCUMENT_STATUS.DRAFT,
                urgency: 'Thường',
                priority: PRIORITY.MEDIUM,
                type: 'Công văn',
                summary: 'Đề xuất cải tiến quy trình xử lý công văn',
                legalWarning: 'Thông tin mang tính chất nội bộ'
            }
        });

        await db.Document.findOrCreate({
            where: { documentNumber: 'DOC-002' },
            defaults: {
                id: doc2Id,
                documentNumber: 'DOC-002',
                symbol: 'CV/2026/002',
                title: 'Yêu cầu cập nhật hệ thống thông tin',
                sender: 'Phòng Kỹ thuật',
                description: 'Yêu cầu cập nhật hệ thống quản lý văn bản',
                status: DOCUMENT_STATUS.SUBMITTED,
                urgency: 'Khẩn',
                priority: PRIORITY.HIGH,
                type: 'Yêu cầu',
                summary: 'Cập nhật hệ thống quản lý văn bản',
                legalWarning: null
            }
        });

        console.log('✅ Tạo 2 Document thành công');

        // 5. Tạo DocumentFile
        await db.DocumentFile.findOrCreate({
            where: { documentId: doc1Id, nameFile: 'quy_trinh_hanhchinh.pdf' },
            defaults: {
                id: randomUUID(),
                documentId: doc1Id,
                nameFile: 'quy_trinh_hanhchinh.pdf',
                url: 'https://storage.example.com/docs/quy_trinh_hanhchinh.pdf'
            }
        });

        await db.DocumentFile.findOrCreate({
            where: { documentId: doc2Id, nameFile: 'he_thong_moi.zip' },
            defaults: {
                id: randomUUID(),
                documentId: doc2Id,
                nameFile: 'he_thong_moi.zip',
                url: 'https://storage.example.com/docs/he_thong_moi.zip'
            }
        });

        console.log('✅ Tạo 2 DocumentFile thành công');

        // 6. Tạo DocumentFlow
        await db.DocumentFlow.findOrCreate({
            where: { documentId: doc1Id, userId: leaderUserId, action: 'CREATED' },
            defaults: {
                id: randomUUID(),
                documentId: doc1Id,
                userId: leaderUserId,
                action: 'CREATED',
                status: DOCUMENT_STATUS.DRAFT,
                note: 'Khởi tạo công văn',
                processedAt: new Date()
            }
        });

        await db.DocumentFlow.findOrCreate({
            where: { documentId: doc2Id, userId: leaderUserId, action: 'SUBMITTED' },
            defaults: {
                id: randomUUID(),
                documentId: doc2Id,
                userId: leaderUserId,
                action: 'SUBMITTED',
                status: DOCUMENT_STATUS.SUBMITTED,
                note: 'Gửi lên lãnh đạo duyệt',
                processedAt: new Date()
            }
        });

        console.log('✅ Tạo 2 DocumentFlow thành công');

        // 7. Tạo Task
        const member1 = await db.DepartmentMember.findOne({
            where: { userId: staff1UserId, departmentId: dept1Id }
        });

        const member2 = await db.DepartmentMember.findOne({
            where: { userId: staff2UserId, departmentId: dept2Id }
        });

        const task1Id = randomUUID();
        const task2Id = randomUUID();

        await db.Task.findOrCreate({
            where: { title: 'Xem xét công văn cải tiến quy trình', documentId: doc1Id },
            defaults: {
                id: task1Id,
                documentId: doc1Id,
                title: 'Xem xét công văn cải tiến quy trình',
                description: 'Xem xét và đánh giá đề xuất cải tiến quy trình hành chính',
                priority: PRIORITY.MEDIUM,
                status: TASK_STATUS.TODO,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                memberId: member1.id,
                assignerId: leaderUserId,
                note: 'Cần hoàn thành trước cuối tuần',
                isOverdue: false
            }
        });

        await db.Task.findOrCreate({
            where: { title: 'Chuẩn bị tài liệu cập nhật hệ thống', documentId: doc2Id },
            defaults: {
                id: task2Id,
                documentId: doc2Id,
                title: 'Chuẩn bị tài liệu cập nhật hệ thống',
                description: 'Chuẩn bị tài liệu, hướng dẫn cho việc cập nhật hệ thống',
                priority: PRIORITY.HIGH,
                status: TASK_STATUS.IN_PROGRESS,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                memberId: member2.id,
                assignerId: managerUserId,
                note: 'Đây là công việc ưu tiên cao',
                isOverdue: false
            }
        });

        console.log('✅ Tạo 2 Task thành công');

        // 8. Tạo TaskFile
        await db.TaskFile.findOrCreate({
            where: { taskId: task1Id, nameFile: 'danh_gia_de_xuat.docx' },
            defaults: {
                id: randomUUID(),
                taskId: task1Id,
                nameFile: 'danh_gia_de_xuat.docx',
                url: 'https://storage.example.com/tasks/danh_gia_de_xuat.docx'
            }
        });

        console.log('✅ Tạo 1 TaskFile thành công');

        // 9. Tạo SignatureHistory
        await db.SignatureHistory.findOrCreate({
            where: { documentId: doc2Id, signerId: leaderUserId },
            defaults: {
                id: randomUUID(),
                documentId: doc2Id,
                signerId: leaderUserId,
                signedAt: new Date(),
                note: 'Phê duyệt thực hiện'
            }
        });

        console.log('✅ Tạo 1 SignatureHistory thành công');

        console.log('\n✅ ========== SEED HOÀN TẤT ==========');
        console.log('📊 Dữ liệu mẫu đã được tạo thành công!\n');
        console.log('📋 Dữ liệu được tạo ra:');
        console.log('  - 3 Departments (Hành chính, Kỹ thuật, Tài chính)');
        console.log('  - 5 Users (1 Admin, 1 Leader, 1 Manager, 2 Staff)');
        console.log('  - 4 DepartmentMembers');
        console.log('  - 2 Documents');
        console.log('  - 2 DocumentFiles');
        console.log('  - 2 DocumentFlows');
        console.log('  - 2 Tasks');
        console.log('  - 1 TaskFile');
        console.log('  - 1 SignatureHistory\n');
        console.log('🧪 Test Data Users:');
        console.log('  - admin@example.com (Admin)');
        console.log('  - leader@example.com (Leader)');
        console.log('  - manager@example.com (Manager)');
        console.log('  - staff1@example.com (Staff)');
        console.log('  - staff2@example.com (Staff)\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Lỗi seed dữ liệu:', error.message);
        console.error(error);
        process.exit(1);
    }
}

module.exports = seedDatabase;

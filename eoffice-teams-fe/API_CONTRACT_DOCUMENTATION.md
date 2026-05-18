# 📚 EOFCICE TEAMS - API ENDPOINT SPECIFICATION

Tài liệu này mô tả chi tiết toàn bộ các Endpoint mà Frontend (FE) gửi đến Backend (BE), cấu trúc Payload (dữ liệu gửi đi) và Expected Response (dữ liệu mong đợi từ BE). Tất cả Request đều dùng Header mặc định được gắn qua Interceptor gồm `x-user-id` và `x-user-role`.

---

## 1. 👥 USERS API (Quản lý User)

### 1.1. Lấy thông tin User cá nhân
- **Endpoint**: `GET /api/user/{id}`
- **Payload**: None
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "1",
      "fullName": "Nguyễn Văn A",
      "role": "ADMIN",
      "avatar": "url...",
      "email": "a@example.com"
    }
  }
  ```

### 1.2. Lấy toàn bộ User
- **Endpoint**: `GET /api/user/all`
- **Payload**: None
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "1",
        "fullName": "Nguyễn Văn A",
        "role": "ADMIN"
      }
    ]
  }
  ```

### 1.3. Thêm mới User
- **Endpoint**: `POST /api/user/add`
- **Payload**:
  ```json
  {
    "id": "2",
    "fullName": "Trần B",
    "role": "CLERICAL",
    "email": "b@example.com"
  }
  ```
- **Response**: Trả về object User vừa được lưu
  ```json
  {
    "success": true,
    "data": { "id": "2", "fullName": "Trần B", "role": "CLERICAL" }
  }
  ```

### 1.4. Cập nhật Role User
- **Endpoint**: `POST /api/user/update`
- **Payload**:
  ```json
  {
    "id": "1",
    "role": "LEADER"
  }
  ```
- **Response**: Trả về object User vừa được update

### 1.5. Xóa User
- **Endpoint**: `POST /api/user/delete`
- **Payload**:
  ```json
  {
    "id": "1"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "id": "1",
      "deleted": true
    }
  }
  ```

---

## 2. 📂 CLERICAL API (Văn thư/Văn bản)

### 2.1. Lấy danh sách toàn bộ văn bản (Clerical)
- **Endpoint**: `GET /api/document/all`
- **Payload**: None
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "doc1",
        "documentNumber": "123",
        "symbol": "TTr-BGD",
        "title": "Tờ trình v/v phê duyệt...",
        "summary": "Tóm tắt...",
        "status": "INITIALIZED",
        "urgency": "THUONG",
        "type": "Công văn",
        "isOverdue": false,
        "createdAt": "2026-05-18T10:00:00Z"
      }
    ]
  }
  ```

### 2.2. Xem thông tin chi tiết một văn bản
- **Endpoint**: `GET /api/document/{id}`
- **Payload**: None
- **Response**: Trả về chi tiết 1 Document như object trên.

### 2.3. Thêm mới biên nhận văn bản / Upload
- **Endpoint**: `POST /api/document/add`
- **Payload**: Sử dụng `multipart/form-data` hoặc `application/json` (nếu không có file):
  ```json
  {
    "documentNumber": "string",
    "symbol": "string",
    "title": "string",
    "sender": "string",
    "urgency": "Thường" | "Khẩn" | "Rất khẩn",
    "priority": "Bình thường" | "Cao" | "Rất cao",
    "type": "Công văn" | "Quyết định",
    "summary": "string",
    "legalWarning": boolean
  }
  // Kèm theo field 'files' chứa mảng File/Blob (nếu có multipart)
  ```
- **Response**: Trả về chi tiết Văn bản vừa khởi tạo.

### 2.4. Trình Lãnh đạo
- **Endpoint**: `POST /api/document/submit-to-leader`
- **Payload**:
  ```json
  { "id": "doc-123" }
  ```
- **Response**: Object văn bản sau khi chuyển status.

### 2.5. Cập nhật Status
- **Endpoint**: `POST /api/document/update-status`
- **Payload**:
  ```json
  {
    "id": "doc-123",
    "status": "PROCESSING"
  }
  ```
- **Response**: Object văn bản đã cập nhật.

### 2.6. Xóa Văn bản
- **Endpoint**: `POST /api/document/delete`
- **Payload**:
  ```json
  { "id": "doc-123" }
  ```
- **Response**: 
  ```json
  { "success": true, "data": null }
  ```

---

## 3. 👑 LEADER API (Lãnh đạo)

### 3.1. Danh sách chờ Lãnh đạo duyệt
- **Endpoint**: `GET /api/leader/documents/waiting-leader`
- **Payload**: None
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "doc-123",
        "title": "Tờ trình",
        "sender": "Bộ GD",
        "date": "2026-05-18T10:00:00Z",
        "status": "PROCESSING",
        "priority": "HIGH",
        "summary": "Tóm tắt",
        "legalWarnings": ["Cảnh báo pháp lý 1"]
      }
    ]
  }
  ```

### 3.2. Lãnh đạo duyệt
- **Endpoint**: `POST /api/leader/document/approve`
- **Payload**:
  ```json
  { "id": "doc-123" }
  ```
- **Response**:
  ```json
  { "success": true, "data": null }
  ```

### 3.3. Lãnh đạo từ chối
- **Endpoint**: `POST /api/leader/document/reject`
- **Payload**:
  ```json
  {
    "id": "doc-123",
    "reason": "Văn bản không hợp lệ"
  }
  ```
- **Response**:
  ```json
  { "success": true, "data": null }
  ```

### 3.4. Giao việc cho các phòng ban
- **Endpoint**: `POST /api/leader/document/assign-department`
- **Payload**:
  ```json
  {
    "docId": "doc-123",
    "deptId": "dept-01"
  }
  ```
- **Response**:
  ```json
  { "success": true, "data": null }
  ```

### 3.5. Danh sách Phòng ban & Trưởng phòng
- **Lấy DS Phòng**: `GET /api/leader/departments` 
  - Trả về: `[{ "id": "dept-01", "name": "Khoa học" }]`
- **Lấy Quản lý phòng**: `GET /api/leader/department/manager/{deptId}`
  - Trả về chi tiết Manager.

### 3.6. Thống kê (Leader Stats)
- **Lấy KPI Lãnh đạo**: `GET /api/leader/stats`
  - **Response**: `{ "totalDocs": 10, "pendingApprovals": 2, "processingTime": "2 ngày", "efficiency": 80 }`
- **Lấy hiệu suất các phòng**: `GET /api/leader/stats/dept-performance`
  - **Response**: `[{ "name": "Phòng A", "value": 85 }]`

---

## 4. 🏢 MANAGER API (Trưởng phòng/Quản lý)

### 4.1. Nhiệm vụ phòng được giao (Từ Leader)
- **Endpoint**: `GET /api/manager/tasks/assigned`
- **Payload**: None
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "task-1",
        "title": "Xử lý văn bản XYZ",
        "status": "TODO",
        "priority": "HIGH",
        "deadline": "2026-05-20T00:00:00Z"
      }
    ]
  }
  ```

### 4.2. Danh sách Sub-tasks (Nhiệm vụ con đã chia)
- **Endpoint**: `GET /api/manager/tasks/sub` hoặc có query `?parentId=xxx`
- **Payload**: None
- **Response**: Array của TaskModel (như 4.1)

### 4.3. Quản lý thành viên phòng
- **Endpoint**: `GET /api/manager/members`
- **Payload**: None
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "user-1",
        "name": "Nguyên C",
        "role": "SPECIALIST",
        "completedTasks": 5,
        "totalTasks": 10
      }
    ]
  }
  ```

### 4.4. Phân công Sub-task cho thành viên
- **Endpoint**: `POST /api/manager/task/assign`
- **Payload**: Một object `Task` (title, description, assigneeId, parentId, deadline, ...)
- **Response**:
  ```json
  { "success": true, "data": null }
  ```

### 4.5. Cập nhật Status của Task
- **Endpoint**: `POST /api/manager/task/status`
- **Payload**:
  ```json
  {
    "taskId": "task-1",
    "status": "DOING" // "DOING" | "COMPLETED" | "OVERDUE"
  }
  ```
- **Response**:
  ```json
  { "success": true, "data": null }
  ```

### 4.6. Thống kê của Phòng (Manager Stats)
- **Endpoint**: `GET /api/manager/stats`
- **Payload**: None
- **Response**: Giống với KPI Lãnh đạo (4 field: totalDocs, pendingApprovals, processingTime, efficiency)
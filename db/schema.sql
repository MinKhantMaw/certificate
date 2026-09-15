CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('ADMIN', 'TRAINER', 'APPROVER') NOT NULL DEFAULT 'ADMIN',
    signature_image TEXT NULL,
    signature_uploaded_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS templates (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    design VARCHAR(50) NOT NULL DEFAULT 'konva',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    layout JSON NOT NULL,
    created_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE
    SET NULL
);
CREATE TABLE IF NOT EXISTS import_batches (
    id CHAR(36) NOT NULL PRIMARY KEY,
    template_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL,
    valid_rows INT NOT NULL,
    invalid_rows INT NOT NULL,
    status ENUM('COMPLETED', 'FAILED') NOT NULL,
    uploaded_by CHAR(36) NULL,
    submitted_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_import_batches_template FOREIGN KEY (template_id) REFERENCES templates(id),
    CONSTRAINT fk_import_batches_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE
    SET NULL
);
CREATE TABLE IF NOT EXISTS documents (
    id CHAR(36) NOT NULL PRIMARY KEY,
    document_number VARCHAR(128) NOT NULL UNIQUE,
    short_id VARCHAR(32) NOT NULL UNIQUE,
    verification_token CHAR(36) NOT NULL UNIQUE,
    template_id CHAR(36) NOT NULL,
    import_batch_id CHAR(36) NULL,
    recipient_name VARCHAR(255) NOT NULL,
    document_title VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL DEFAULT '',
    issue_date DATE NOT NULL,
    organization VARCHAR(255) NOT NULL DEFAULT '',
    document_type VARCHAR(64) NOT NULL DEFAULT 'completion',
    email VARCHAR(255) NOT NULL,
    status ENUM('VALID', 'REVOKED') NOT NULL DEFAULT 'VALID',
    dynamic_data JSON NOT NULL,
    encrypted_qr_url TEXT NULL,
    encrypted_qr_token TEXT NULL,
    encrypted_qr_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,
    deleted_at DATETIME NULL,
    CONSTRAINT fk_documents_template FOREIGN KEY (template_id) REFERENCES templates(id),
    CONSTRAINT fk_documents_batch FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE
    SET NULL
);
CREATE TABLE IF NOT EXISTS import_rows (
    id CHAR(36) NOT NULL PRIMARY KEY,
    import_batch_id CHAR(36) NOT NULL,
    `row_number` INT NOT NULL,
    `data` JSON NOT NULL,
    `validation_errors` JSON NOT NULL,
    validation_status ENUM('VALID', 'INVALID') NOT NULL,
    document_id CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_import_rows_batch_row (import_batch_id, `row_number`),
    CONSTRAINT fk_import_rows_batch FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_import_rows_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE
    SET NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
    SET NULL
);
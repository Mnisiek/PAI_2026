--liquibase formatted sql

--changeset gemini-cli:03-add-role-to-users
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER';
--rollback ALTER TABLE users DROP COLUMN role;

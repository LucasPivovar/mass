-- Inserir usuário padrão admin@admin com senha 'admin' (criptografada com bcrypt)
INSERT IGNORE INTO users (username, password) VALUES (
    'admin@admin',
    '$2b$10$MrJoqNct6wVA9yGMbx3ql.8JU8DW7WP9fHrgkKbZgfwFuPG6Ssmaa'
);

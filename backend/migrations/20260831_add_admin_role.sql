-- Apply once to PostgreSQL/Neon. This is not executed automatically.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('farmer','buyer','logistics','admin'));
INSERT INTO users (id,name,phone,email,password_hash,role,profile)
SELECT '00000000-0000-0000-0000-000000000001','admin1','0000000000','admin1@kisansetu.local','$2b$12$ZeWKYfZzTqi.ZP2pQeF1Uu.SX5p94fNDRh9RxCVeQhGLqRYzgx5JS','admin','{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(name)='admin1' OR lower(email)='admin1@kisansetu.local');

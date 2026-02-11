import bcrypt from 'bcryptjs';
import pool from './config/database';

async function seed() {
  const hash = await bcrypt.hash('Password123!', 10);

  await pool.query(
    `INSERT INTO app_users (username, password_hash, display_name, role, must_change_password)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username) DO NOTHING`,
    ['admin', hash, 'Administrator', 'admin', false]
  );

  console.log('Seed complete: admin user created');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

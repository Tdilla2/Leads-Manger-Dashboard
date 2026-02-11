import bcrypt from 'bcryptjs';
import pool from '../config/database';

export async function getAllUsers() {
  const result = await pool.query(
    'SELECT id, username, display_name, role, must_change_password, created_at FROM app_users ORDER BY created_at'
  );
  return result.rows.map(row => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
    createdAt: row.created_at,
  }));
}

export async function createUser(username: string, displayName: string, role: 'admin' | 'user') {
  const hash = await bcrypt.hash('password123', 10);
  const result = await pool.query(
    'INSERT INTO app_users (username, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, role, must_change_password, created_at',
    [username, hash, displayName, role]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
    createdAt: row.created_at,
  };
}

export async function updateUser(userId: string, displayName: string, username: string, role: 'admin' | 'user') {
  const result = await pool.query(
    'UPDATE app_users SET display_name = $1, username = $2, role = $3 WHERE id = $4 RETURNING id, username, display_name, role, must_change_password, created_at',
    [displayName, username, role, userId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
    createdAt: row.created_at,
  };
}

export async function deleteUser(userId: string) {
  const result = await pool.query('DELETE FROM app_users WHERE id = $1', [userId]);
  return result.rowCount && result.rowCount > 0;
}

export async function resetPassword(userId: string) {
  const hash = await bcrypt.hash('password123', 10);
  const result = await pool.query(
    'UPDATE app_users SET password_hash = $1, must_change_password = true WHERE id = $2',
    [hash, userId]
  );
  return result.rowCount && result.rowCount > 0;
}

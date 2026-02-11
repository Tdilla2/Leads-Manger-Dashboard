import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken, JwtPayload } from '../middleware/auth';

export async function login(username: string, password: string) {
  const result = await pool.query(
    'SELECT id, username, password_hash, display_name, role, must_change_password FROM app_users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return null;
  }

  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    mustChangePassword: user.must_change_password,
  };

  const token = generateToken(payload);
  return { token, user: payload };
}

export async function changePassword(userId: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await pool.query(
    'UPDATE app_users SET password_hash = $1, must_change_password = false WHERE id = $2 RETURNING id, username, display_name, role, must_change_password',
    [hash, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    mustChangePassword: user.must_change_password,
  };

  const token = generateToken(payload);
  return { token, user: payload };
}

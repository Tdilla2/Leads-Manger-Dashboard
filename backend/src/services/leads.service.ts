import pool from '../config/database';

interface LeadFilters {
  status?: string;
  source?: string;
  assignedTo?: string;
  search?: string;
  archived?: string;
}

export async function getLeads(filters: LeadFilters) {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.status && filters.status !== 'all') {
    conditions.push(`l.status = $${paramIndex++}`);
    params.push(filters.status);
  }
  if (filters.source && filters.source !== 'all') {
    conditions.push(`l.source = $${paramIndex++}`);
    params.push(filters.source);
  }
  if (filters.assignedTo && filters.assignedTo !== 'all') {
    conditions.push(`l.assigned_to = $${paramIndex++}`);
    params.push(filters.assignedTo);
  }
  if (filters.search) {
    conditions.push(`(l.name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.company ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  if (filters.archived === 'true') {
    conditions.push('l.archived = true');
  } else {
    conditions.push('l.archived = false');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT l.*,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', n.id, 'text', n.text, 'author', n.author, 'createdAt', n.created_at
        ) ORDER BY n.created_at)
        FROM notes n WHERE n.lead_id = l.id), '[]'
      ) as notes,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', t.id, 'title', t.title, 'dueDate', t.due_date, 'completed', t.completed
        ) ORDER BY t.due_date)
        FROM tasks t WHERE t.lead_id = l.id), '[]'
      ) as tasks,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', a.id, 'type', a.type, 'description', a.description, 'timestamp', a.timestamp
        ) ORDER BY a.timestamp DESC)
        FROM activities a WHERE a.lead_id = l.id), '[]'
      ) as activities
    FROM leads l
    ${where}
    ORDER BY l.created_at DESC`,
    params
  );

  return result.rows.map(formatLead);
}

export async function getLeadById(id: string) {
  const result = await pool.query(
    `SELECT l.*,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', n.id, 'text', n.text, 'author', n.author, 'createdAt', n.created_at
        ) ORDER BY n.created_at)
        FROM notes n WHERE n.lead_id = l.id), '[]'
      ) as notes,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', t.id, 'title', t.title, 'dueDate', t.due_date, 'completed', t.completed
        ) ORDER BY t.due_date)
        FROM tasks t WHERE t.lead_id = l.id), '[]'
      ) as tasks,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', a.id, 'type', a.type, 'description', a.description, 'timestamp', a.timestamp
        ) ORDER BY a.timestamp DESC)
        FROM activities a WHERE a.lead_id = l.id), '[]'
      ) as activities
    FROM leads l
    WHERE l.id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  return formatLead(result.rows[0]);
}

export async function createLead(data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  value?: number;
  source: string;
  assignedTo?: string;
  score?: number;
  createdBy?: string;
}) {
  const result = await pool.query(
    `INSERT INTO leads (name, email, phone, company, status, value, source, assigned_to, score, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.name,
      data.email || '',
      data.phone || '',
      data.company || '',
      data.status || 'new',
      data.value || 0,
      data.source,
      data.assignedTo || 'Unassigned',
      data.score || Math.floor(Math.random() * 40) + 60,
      data.createdBy || null,
    ]
  );

  const lead = result.rows[0];

  // Add "Lead created" activity
  await pool.query(
    `INSERT INTO activities (lead_id, type, description) VALUES ($1, 'note', 'Lead created')`,
    [lead.id]
  );

  return getLeadById(lead.id);
}

export async function updateLead(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  value?: number;
  source?: string;
  assignedTo?: string;
  score?: number;
  lastContact?: string;
}) {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); params.push(data.name); }
  if (data.email !== undefined) { fields.push(`email = $${paramIndex++}`); params.push(data.email); }
  if (data.phone !== undefined) { fields.push(`phone = $${paramIndex++}`); params.push(data.phone); }
  if (data.company !== undefined) { fields.push(`company = $${paramIndex++}`); params.push(data.company); }
  if (data.status !== undefined) { fields.push(`status = $${paramIndex++}`); params.push(data.status); }
  if (data.value !== undefined) { fields.push(`value = $${paramIndex++}`); params.push(data.value); }
  if (data.source !== undefined) { fields.push(`source = $${paramIndex++}`); params.push(data.source); }
  if (data.assignedTo !== undefined) { fields.push(`assigned_to = $${paramIndex++}`); params.push(data.assignedTo); }
  if (data.score !== undefined) { fields.push(`score = $${paramIndex++}`); params.push(data.score); }
  if (data.lastContact !== undefined) { fields.push(`last_contact = $${paramIndex++}`); params.push(data.lastContact); }

  if (fields.length === 0) return getLeadById(id);

  params.push(id);
  await pool.query(
    `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    params
  );

  // Add activity
  await pool.query(
    `INSERT INTO activities (lead_id, type, description) VALUES ($1, 'note', 'Lead information updated')`,
    [id]
  );

  return getLeadById(id);
}

export async function archiveLead(id: string) {
  const current = await pool.query('SELECT archived FROM leads WHERE id = $1', [id]);
  if (current.rows.length === 0) return null;

  const newArchived = !current.rows[0].archived;
  await pool.query('UPDATE leads SET archived = $1 WHERE id = $2', [newArchived, id]);

  await pool.query(
    `INSERT INTO activities (lead_id, type, description) VALUES ($1, 'note', $2)`,
    [id, newArchived ? 'Lead archived' : 'Lead unarchived']
  );

  return getLeadById(id);
}

export async function addNote(leadId: string, text: string, author: string) {
  const result = await pool.query(
    `INSERT INTO notes (lead_id, text, author) VALUES ($1, $2, $3) RETURNING *`,
    [leadId, text, author]
  );

  await pool.query(
    `INSERT INTO activities (lead_id, type, description) VALUES ($1, 'note', $2)`,
    [leadId, `Note added: ${text.substring(0, 50)}...`]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    createdAt: row.created_at,
  };
}

export async function addTask(leadId: string, title: string, dueDate: string) {
  const result = await pool.query(
    `INSERT INTO tasks (lead_id, title, due_date) VALUES ($1, $2, $3) RETURNING *`,
    [leadId, title, dueDate]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    completed: row.completed,
  };
}

export async function toggleTask(leadId: string, taskId: string) {
  const result = await pool.query(
    `UPDATE tasks SET completed = NOT completed WHERE id = $1 AND lead_id = $2 RETURNING *`,
    [taskId, leadId]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    completed: row.completed,
  };
}

export async function addActivity(leadId: string, type: string, description: string) {
  const result = await pool.query(
    `INSERT INTO activities (lead_id, type, description) VALUES ($1, $2, $3) RETURNING *`,
    [leadId, type, description]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    timestamp: row.timestamp,
  };
}

function formatLead(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    status: row.status,
    value: parseFloat(row.value),
    source: row.source,
    score: row.score,
    assignedTo: row.assigned_to,
    lastContact: row.last_contact,
    archived: row.archived,
    createdAt: row.created_at,
    notes: row.notes || [],
    tasks: row.tasks || [],
    activities: row.activities || [],
  };
}

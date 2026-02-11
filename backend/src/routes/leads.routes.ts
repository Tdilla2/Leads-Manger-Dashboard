import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as leadsService from '../services/leads.service';

const router = Router();

router.use(authenticateToken);

// GET /api/leads
router.get('/', async (req: Request, res: Response) => {
  try {
    const leads = await leadsService.getLeads({
      status: req.query.status as string,
      source: req.query.source as string,
      assignedTo: req.query.assignedTo as string,
      search: req.query.search as string,
      archived: req.query.archived as string,
    });
    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, status, value, source, assignedTo, score } = req.body;

    if (!name || !source) {
      res.status(400).json({ error: 'Name and source are required' });
      return;
    }

    const lead = await leadsService.createLead({
      name, email, phone, company, status, value, source, assignedTo, score,
      createdBy: req.user!.id,
    });
    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await leadsService.getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/leads/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await leadsService.updateLead(req.params.id, req.body);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(lead);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/leads/:id/archive
router.patch('/:id/archive', async (req: Request, res: Response) => {
  try {
    const lead = await leadsService.archiveLead(req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(lead);
  } catch (error) {
    console.error('Archive lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/notes
router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Note text is required' });
      return;
    }

    const note = await leadsService.addNote(req.params.id, text, req.user!.displayName);
    res.status(201).json(note);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/tasks
router.post('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { title, dueDate } = req.body;
    if (!title || !dueDate) {
      res.status(400).json({ error: 'Title and due date are required' });
      return;
    }

    const task = await leadsService.addTask(req.params.id, title, dueDate);
    res.status(201).json(task);
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/leads/:id/tasks/:taskId
router.patch('/:id/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const task = await leadsService.toggleTask(req.params.id, req.params.taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/activities
router.post('/:id/activities', async (req: Request, res: Response) => {
  try {
    const { type, description } = req.body;
    if (!type || !description) {
      res.status(400).json({ error: 'Type and description are required' });
      return;
    }

    const activity = await leadsService.addActivity(req.params.id, type, description);
    res.status(201).json(activity);
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

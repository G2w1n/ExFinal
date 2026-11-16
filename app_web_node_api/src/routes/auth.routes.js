// src/routes/auth.routes.js
import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const r = Router();
r.post('/login', h(c.login));
r.post('/registro', h(c.registro));
r.get('/yo', auth, h(c.yo));
export default r;

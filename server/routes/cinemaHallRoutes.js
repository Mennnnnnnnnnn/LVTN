import express from 'express';
import { getAllHalls, getHallById } from '../controllers/cinemaHallController.js';

const hallRouter = express.Router();

hallRouter.get('/all', getAllHalls);
hallRouter.get('/:hallId', getHallById);

export default hallRouter;


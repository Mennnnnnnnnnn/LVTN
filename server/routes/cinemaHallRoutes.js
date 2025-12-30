import express from 'express';
import { 
    getAllHalls, 
    getHallById, 
    createHall, 
    updateHall, 
    deleteHall,
    toggleHallStatus,
    getHallStatistics,
    getAllHallsStatistics
} from '../controllers/cinemaHallController.js';
import { protectAdmin } from '../middleware/auth.js';

const hallRouter = express.Router();

// Public routes
hallRouter.get('/all', getAllHalls);
hallRouter.get('/statistics/all', getAllHallsStatistics);
hallRouter.get('/:hallId', getHallById);
hallRouter.get('/:hallId/statistics', getHallStatistics);

// Admin routes
hallRouter.post('/create', protectAdmin, createHall);
hallRouter.put('/:hallId', protectAdmin, updateHall);
hallRouter.delete('/:hallId', protectAdmin, deleteHall);
hallRouter.patch('/:hallId/status', protectAdmin, toggleHallStatus);

export default hallRouter;


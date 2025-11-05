import express from 'express';
import { 
  getAuthUrl, 
  handleCallback, 
  addEventToCalendar,
  importMultipleEvents 
} from '../controller/googleCalendarController.js';

const router = express.Router();

// Route pour obtenir l'URL d'authentification Google
router.get('/auth-url', getAuthUrl);

// Route de callback après authentification Google
router.get('/callback', handleCallback);

// Route pour ajouter un événement au calendrier Google
router.post('/add-event', addEventToCalendar);

// Route pour importer plusieurs événements
router.post('/import-events', importMultipleEvents);

export default router;

import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Fonction helper pour créer un client OAuth2 avec la bonne redirect URI
const createOAuth2Client = (req) => {
  // Déterminer l'URL de redirection basée sur l'environnement
  const protocol = req.protocol;
  const host = req.get('host');
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}://${host}/api/google/callback`;
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

// Générer l'URL d'authentification
export const getAuthUrl = (req, res) => {
  try {
    const oauth2Client = createOAuth2Client(req);
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ authUrl: url });
  } catch (error) {
    console.error('Erreur génération URL auth:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'URL d\'authentification' });
  }
};

// Callback après authentification Google
export const handleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Code d\'authentification manquant');
    }

    const oauth2Client = createOAuth2Client(req);

    // Échanger le code contre des tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Stocker les tokens (en production, utilisez une base de données)
    // Pour l'instant, on les renvoie au client qui les stockera dans localStorage
    
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'google-auth-success',
              tokens: ${JSON.stringify(tokens)}
            }, '*');
            window.close();
          </script>
          <p>Authentification réussie ! Cette fenêtre va se fermer...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Erreur callback Google:', error);
    res.status(500).send('Erreur lors de l\'authentification');
  }
};

// Ajouter un événement au calendrier Google
export const addEventToCalendar = async (req, res) => {
  try {
    const { tokens, event } = req.body;

    if (!tokens || !event) {
      return res.status(400).json({ error: 'Tokens ou événement manquant' });
    }

    if (!event.title || !event.date || !event.startTime || !event.endTime) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (title, date, startTime, endTime)' });
    }

    const oauth2Client = createOAuth2Client(req);
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const googleEvent = {
      summary: event.title,
      description: event.description || '',
      start: {
        dateTime: `${event.date}T${event.startTime}:00`,
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: `${event.date}T${event.endTime}:00`,
        timeZone: 'Europe/Paris',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: googleEvent,
    });

    res.json({ 
      success: true, 
      eventLink: response.data.htmlLink,
      eventId: response.data.id 
    });

  } catch (error) {
    console.error('Erreur ajout événement Google Calendar:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de l\'ajout de l\'événement',
      details: error.response?.data?.error?.message || error.message 
    });
  }
};

// Importer plusieurs événements
export const importMultipleEvents = async (req, res) => {
  try {
    const { tokens, events } = req.body;

    if (!tokens || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Tokens ou événements manquants' });
    }

    const oauth2Client = createOAuth2Client(req);
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let existingEvents = [];
    try {
      const existingResponse = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date('2020-01-01').toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
      });
      existingEvents = existingResponse.data.items || [];
    } catch (error) {
      console.error('Erreur récupération événements existants:', error.message);
    }

    const results = [];
    
    for (const event of events) {
      try {
        if (!event.title || !event.date || !event.startTime || !event.endTime) {
          results.push({ 
            success: false, 
            error: 'Champs obligatoires manquants',
            title: event.title || 'Sans titre'
          });
          continue;
        }

        const startDateTime = `${event.date}T${event.startTime}:00`;
        const endDateTime = `${event.date}T${event.endTime}:00`;
        
        const isDuplicate = existingEvents.some(existingEvent => {
          const isSameTitle = existingEvent.summary === event.title;
          const isSameStart = existingEvent.start?.dateTime?.startsWith(startDateTime.substring(0, 16));
          const isSameEnd = existingEvent.end?.dateTime?.startsWith(endDateTime.substring(0, 16));
          
          return isSameTitle && isSameStart && isSameEnd;
        });

        if (isDuplicate) {
          results.push({ 
            success: true,
            skipped: true,
            eventId: 'existing',
            title: event.title,
            message: 'Événement déjà présent dans Google Calendar'
          });
          continue;
        }

        const googleEvent = {
          summary: event.title,
          description: event.description || '',
          start: {
            dateTime: startDateTime,
            timeZone: 'Europe/Paris',
          },
          end: {
            dateTime: endDateTime,
            timeZone: 'Europe/Paris',
          },
        };

        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: googleEvent,
        });

        results.push({ 
          success: true, 
          eventId: response.data.id,
          title: event.title 
        });
      } catch (error) {
        console.error(`Erreur pour événement "${event.title}":`, error.message);
        results.push({ 
          success: false, 
          error: error.response?.data?.error?.message || error.message,
          title: event.title 
        });
      }
    }

    const successCount = results.filter(r => r.success && !r.skipped).length;
    const skippedTotal = results.filter(r => r.skipped).length;
    const failedCount = results.filter(r => !r.success).length;
    res.json({ results, summary: { imported: successCount, skipped: skippedTotal, failed: failedCount } });

  } catch (error) {
    console.error('Erreur import événements:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de l\'import des événements',
      details: error.message 
    });
  }
};

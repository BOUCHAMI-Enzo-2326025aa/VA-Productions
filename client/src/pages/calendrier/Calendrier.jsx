import { useState, useEffect } from "react";
import axios from "axios";
import DateSection from "./components/DateSection";
import Button from "./components/Button";
import google_calendar_icon from "../../assets/google-calendar-icon.png";
import PageHeader from "../../components/PageHeader";

const Calendrier = () => {
  const [events, setEvents] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [googleTokens, setGoogleTokens] = useState(null);

  const extractTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    if (/^\d{2}:\d{2}$/.test(dateTimeString)) {
      return dateTimeString;
    }
    if (dateTimeString.includes('T')) {
      return dateTimeString.split('T')[1].substring(0, 5);
    }
    return dateTimeString;
  };

  const extractDate = (dateTimeString) => {
    if (!dateTimeString) return null;
    if (dateTimeString.includes('T')) {
      return dateTimeString.split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
      return dateTimeString;
    }
    if (/^\d{2}:\d{2}$/.test(dateTimeString)) {
      return null;
    }
    return null;
  };

  useEffect(() => {
    const storedTokens = localStorage.getItem('googleTokens');
    if (storedTokens) {
      setGoogleTokens(JSON.parse(storedTokens));
      setIsAuthenticated(true);
    }


    const handleMessage = (event) => {
  console.log('📨 Message reçu:', event.data);
  console.log('📍 Origin:', event.origin);

  // La liste des serveurs backend autorisés à nous parler
  const allowedOrigins = [
    'http://localhost:5555',                          // le backend local
    'https://sae-v-a-productions.onrender.com'        // le backend en ligne
  ];

  // On vérifie si l'origine du message est dans notre liste
  if (!allowedOrigins.includes(event.origin)) {
    
    console.warn('⚠️ Message ignoré - origine non reconnue:', event.origin);
    // return; // <-- Décommentez cette ligne une fois que tout marche pour la sécurité
  }
      
      if (event.data && event.data.type === 'google-auth-success') {
        console.log('🎉 Authentification Google réussie !');
        const tokens = event.data.tokens;
        localStorage.setItem('googleTokens', JSON.stringify(tokens));
        setGoogleTokens(tokens);
        setIsAuthenticated(true);
        
        // Notification visuelle
        console.log('✅ Tokens sauvegardés dans localStorage');
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      console.log('Début connexion Google Calendar...');
      const apiHost = import.meta.env.VITE_API_HOST || 'http://localhost:5555';
      const response = await axios.get(`${apiHost}/api/google/auth-url`);
      const authUrl = response.data.authUrl;
      
      console.log('URL d\'authentification reçue');
      
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Google Authentication',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        alert('⚠️ La popup a été bloquée. Veuillez autoriser les popups pour ce site.');
        return;
      }
      
      console.log('Popup ouverte, en attente de la réponse...');
      
    } catch (error) {
      console.error("Erreur lors de la connexion Google:", error);
      alert("❌ Erreur lors de la connexion à Google Calendar: " + error.message);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('googleTokens');
    setGoogleTokens(null);
    setIsAuthenticated(false);
  };

  const fetchLocalEvents = async () => {
    try {
      setIsEventsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_HOST}/api/events`
      );
      if (response.ok) {
        const data = await response.json();

        const eventsByDate = data.reduce((acc, event) => {
          if (!event.startTime) {
            console.warn("⚠️ Événement sans startTime ignoré:", event);
            return acc;
          }

          const date = extractDate(event.startTime);
          
          if (!date) {
            console.warn("⚠️ Événement avec date invalide ignoré (format ancien):", event);
            return acc;
          }

          if (!acc[date]) {
            acc[date] = [];
          }

          const eventDateTime = new Date(event.startTime);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (!isNaN(eventDateTime.getTime()) && eventDateTime >= today) {
            acc[date].push(event);
          }
          
          return acc;
        }, {});

        setEvents(eventsByDate);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
    } finally {
      setIsEventsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLocalEvents();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleCreateEvent = (savedEvent) => {
    const eventDate = extractDate(savedEvent.startTime);

    setEvents((prevEvents) => {
      const updatedEvents = { ...prevEvents };
      if (!updatedEvents[eventDate]) {
        updatedEvents[eventDate] = [];
      }
      updatedEvents[eventDate].push(savedEvent);
      return updatedEvents;
    });

    if (isAuthenticated) {
      addEventToGoogleCalendar(savedEvent);
    }
  };

  const addEventToGoogleCalendar = async (event) => {
    if (!isAuthenticated || !googleTokens) {
      alert("Veuillez vous connecter à Google Calendar d'abord !");
      return;
    }

    if (!event.company || !event.date || !event.startTime || !event.endTime) {
      console.error(
        "Champs obligatoires manquants : company, date, startTime ou endTime"
      );
      console.log("Event reçu:", event);
      return;
    }

    try {
      const eventDate = extractDate(event.startTime);
      
      await axios.post(
        `${import.meta.env.VITE_API_HOST}/api/google/add-event`,
        {
          tokens: googleTokens,
          event: {
            title: event.company,
            description: event.description || "",
            date: eventDate,
            startTime: extractTime(event.startTime),
            endTime: extractTime(event.endTime),
          }
        }
      );

      alert("Événement synchronisé avec Google Calendar !");
      
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'événement:", error);
      alert("Erreur lors de la synchronisation.");
    }
  };

  const deleteEvent = async (eventId, eventDate) => {
    try {
      setEvents((prevEvents) => {
        const updatedEvents = { ...prevEvents };
        updatedEvents[eventDate] = updatedEvents[eventDate].filter(
          (event) => event._id !== eventId
        );

        if (updatedEvents[eventDate].length === 0) {
          delete updatedEvents[eventDate];
        }

        return updatedEvents;
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_HOST}/api/events/${eventId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        console.error("Erreur lors de la suppression sur l'API");
        fetchLocalEvents();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  const handleEditEvent = (updatedEvent) => {
    setEvents((prevEvents) => {
      const newEvents = { ...prevEvents };
      
      const oldDate = extractDate(
        Object.values(newEvents)
          .flat()
          .find((e) => e._id === updatedEvent._id)?.startTime
      );
      const newDate = extractDate(updatedEvent.startTime);

      if (oldDate && oldDate !== newDate) {
        if (newEvents[oldDate]) {
          newEvents[oldDate] = newEvents[oldDate].filter(
            (e) => e._id !== updatedEvent._id
          );
          if (newEvents[oldDate].length === 0) {
            delete newEvents[oldDate];
          }
        }

        if (!newEvents[newDate]) {
          newEvents[newDate] = [];
        }
        newEvents[newDate].push(updatedEvent);
      } else {
        const dateKey = newDate || oldDate;
        if (newEvents[dateKey]) {
          newEvents[dateKey] = newEvents[dateKey].map((e) =>
            e._id === updatedEvent._id ? updatedEvent : e
          );
        }
      }

      return newEvents;
    });
  };

  const importAllEventsToGoogle = async () => {
    if (!isAuthenticated || !googleTokens) {
      alert("Veuillez vous connecter à Google d'abord !");
      return;
    }

    try {
      const allEvents = [];
      Object.values(events).forEach((eventList) => {
        eventList.forEach((event) => {
          const eventDate = extractDate(event.startTime);

          allEvents.push({
            title: event.company,
            description: event.description || "",
            date: eventDate,
            startTime: extractTime(event.startTime),
            endTime: extractTime(event.endTime),
          });
        });
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_HOST}/api/google/import-events`,
        {
          tokens: googleTokens,
          events: allEvents
        }
      );
      
      const imported = response.data.summary?.imported || response.data.results.filter(r => r.success && !r.skipped).length;
      const skipped = response.data.summary?.skipped || response.data.results.filter(r => r.skipped).length;
      const failed = response.data.summary?.failed || response.data.results.filter(r => !r.success).length;
      
      let message = `Import terminé !\n\n`;
      if (imported > 0) message += `✅ ${imported} événement(s) importé(s)\n`;
      if (skipped > 0) message += `⏭️ ${skipped} événement(s) ignoré(s) (déjà existants)\n`;
      if (failed > 0) message += `❌ ${failed} échec(s)`;
      
      alert(message);
      
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      alert("Erreur lors de l'import des événements.");
    }
  };

  return (
    <div className="bg-[#E8E9EB] w-full py-6">
      <PageHeader
        title="Calendrier"
        description="Retrouvez les prochains rendez-vous et appels"
        storageKey="page-header:calendrier"
        titleClassName="font-inter text-3xl md:text-4xl"
        descriptionClassName="font-inter text-lg md:text-xl font-medium opacity-70"
      />

      <div className="w-full flex justify-end mb-6 items-center gap-2 calendar-actions-container">
        {!isAuthenticated ? (
          <button
            onClick={handleSignIn}
            className="border-[3px] bg-[#0072e1] font-medium flex items-center gap-2 px-6 md:px-12 py-3 rounded-md"
          >
            Connexion Google Calendar
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className=" bg-red-500 font-medium flex items-center gap-2 px-6 md:px-12 py-3 rounded-md"
          >
            Déconnexion
          </button>
        )}

        {isAuthenticated && (
          <button
            onClick={importAllEventsToGoogle}
            className="bg-green-500 font-medium flex items-center gap-2 px-6 md:px-12 py-3 rounded-md"
          >
            Importer tous les événements
          </button>
        )}

        <Button onCreate={handleCreateEvent} />
      </div>

      {isEventsLoading ? (
        <div className="flex flex-row gap-2 w-[100%] items-center justify-center mt-10">
          <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce"></div>
          <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-.3s]"></div>
          <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-.5s]"></div>
        </div>
      ) : (
        Object.keys(events).length > 0 &&
        Object.keys(events).map((date, index) => (
          <DateSection
            key={index}
            date={date}
            events={events[date]}
            onDeleteEvent={deleteEvent}
            onEditEvent={handleEditEvent}
          />
        ))
      )}
    </div>
  );
};

export default Calendrier;
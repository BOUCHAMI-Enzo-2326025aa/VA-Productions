import { useState, useEffect } from "react";
import axios from "axios";
import DateSection from "./components/DateSection";
import Button from "./components/Button";
import google_calendar_icon from "../../assets/google-calendar-icon.png";

const Calendrier = () => {
  const [events, setEvents] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [googleTokens, setGoogleTokens] = useState(null);

  // Fonction utilitaire pour extraire l'heure au format HH:mm
  const extractTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    // Si c'est déjà au format HH:mm, on retourne tel quel
    if (/^\d{2}:\d{2}$/.test(dateTimeString)) {
      return dateTimeString;
    }
    // Si c'est un format ISO (2026-01-17T14:13), on extrait l'heure
    if (dateTimeString.includes('T')) {
      return dateTimeString.split('T')[1].substring(0, 5);
    }
    return dateTimeString;
  };

  // Fonction utilitaire pour extraire la date au format YYYY-MM-DD
  const extractDate = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    // Si c'est un format ISO (2026-01-17T14:13), on extrait la date
    if (dateTimeString.includes('T')) {
      return dateTimeString.split('T')[0];
    }
    
    // Si c'est déjà au format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
      return dateTimeString;
    }
    
    // Si c'est juste une heure (HH:mm), pas de date disponible
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
      if (event.data.type === 'google-auth-success') {
        const tokens = event.data.tokens;
        localStorage.setItem('googleTokens', JSON.stringify(tokens));
        setGoogleTokens(tokens);
        setIsAuthenticated(true);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_HOST}/api/google/auth-url`);
      const authUrl = response.data.authUrl;
      
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      window.open(
        authUrl,
        'Google Authentication',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
    } catch (error) {
      console.error("Erreur lors de la connexion Google:", error);
      alert("Erreur lors de la connexion à Google Calendar.");
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
          // Vérifier que startTime existe
          if (!event.startTime) {
            console.warn("⚠️ Événement sans startTime ignoré:", event);
            return acc;
          }

          // Extraire la date depuis startTime (format ISO: "2026-01-17T14:13")
          const date = extractDate(event.startTime);
          
          // Ignorer les événements sans date valide (anciens événements avec juste l'heure)
          if (!date) {
            console.warn("⚠️ Événement avec date invalide ignoré (format ancien):", event);
            return acc;
          }

          // Initialiser le tableau pour cette date si nécessaire
          if (!acc[date]) {
            acc[date] = [];
          }

          // Vérifier que la date est future ou aujourd'hui
          const eventDateTime = new Date(event.startTime);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Réinitialiser à minuit pour comparer juste la date
          
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
    // L'événement est déjà sauvegardé en BD par le composant Button
    // On le met juste à jour dans le state local
    const eventDate = extractDate(savedEvent.startTime);

    setEvents((prevEvents) => {
      const updatedEvents = { ...prevEvents };
      if (!updatedEvents[eventDate]) {
        updatedEvents[eventDate] = [];
      }
      updatedEvents[eventDate].push(savedEvent);
      return updatedEvents;
    });

    // Si connecté à Google Calendar, synchroniser aussi
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
    // Mettre à jour l'événement dans le state local
    setEvents((prevEvents) => {
      const newEvents = { ...prevEvents };
      
      // Trouver l'ancienne date et la nouvelle date
      const oldDate = extractDate(
        Object.values(newEvents)
          .flat()
          .find((e) => e._id === updatedEvent._id)?.startTime
      );
      const newDate = extractDate(updatedEvent.startTime);

      // Si la date a changé, on doit déplacer l'événement
      if (oldDate && oldDate !== newDate) {
        // Supprimer de l'ancienne date
        if (newEvents[oldDate]) {
          newEvents[oldDate] = newEvents[oldDate].filter(
            (e) => e._id !== updatedEvent._id
          );
          if (newEvents[oldDate].length === 0) {
            delete newEvents[oldDate];
          }
        }

        // Ajouter à la nouvelle date
        if (!newEvents[newDate]) {
          newEvents[newDate] = [];
        }
        newEvents[newDate].push(updatedEvent);
      } else {
        // Même date, juste mettre à jour l'événement
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
      <div>
        <h1 className="font-inter text-[#3F3F3F] text-[40px] font-[700]">
          Calendrier
        </h1>
        <p className="font-inter text-[#3F3F3F] text-[20px] font-[500] opacity-70">
          Retrouvez les prochains rendez-vous et appels
        </p>
      </div>

      <div className="w-full flex justify-end mb-6 items-center gap-1">
        {!isAuthenticated ? (
          <button
            onClick={handleSignIn}
            className="border-[3px] bg-[#0072e1] font-medium flex items-center gap-2 px-12 py-3 rounded-md"
          >
            Connexion Google Calendar
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className=" bg-red-500 font-medium flex items-center gap-2 px-12 py-3 rounded-md"
          >
            Déconnexion
          </button>
        )}

        {isAuthenticated && (
          <button
            onClick={importAllEventsToGoogle}
            className="bg-green-500 font-medium flex items-center gap-2 px-12 py-3 rounded-md"
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

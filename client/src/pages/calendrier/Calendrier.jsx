import { useState, useEffect } from "react";
import { gapi } from "gapi-script";
import DateSection from "./components/DateSection";
import Button from "./components/Button";
import google_calendar_icon from "../../assets/google-calendar-icon.png";

const Calendrier = () => {
  const [events, setEvents] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(false);

  useEffect(() => {
    const initClient = () => {
      console.log("🔧 Initialisation Google API...");
      console.log("Client ID:", import.meta.env.VITE_CLIENT_ID_CALENDAR);
      console.log("API Key:", import.meta.env.VITE_API_KEY_CALENDAR);
      console.log("Scopes:", import.meta.env.VITE_SCOPES);

      gapi.client
        .init({
          apiKey: import.meta.env.VITE_API_KEY_CALENDAR,
          clientId: import.meta.env.VITE_CLIENT_ID_CALENDAR,
          scope: import.meta.env.VITE_SCOPES,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
        })
        .then(() => {
          console.log("✅ Google API initialisée avec succès");
          const authInstance = gapi.auth2.getAuthInstance();
          const isSignedIn = authInstance.isSignedIn.get();
          console.log("État de connexion initial:", isSignedIn);
          
          setIsAuthenticated(isSignedIn);
          
          // Écouter les changements d'état de connexion
          authInstance.isSignedIn.listen((signedIn) => {
            console.log("🔄 Changement d'état de connexion:", signedIn);
            setIsAuthenticated(signedIn);
          });
        })
        .catch((error) => {
          console.error("❌ Erreur initialisation Google API:", error);
        });
    };
    gapi.load("client:auth2", initClient);
  }, []);

  const handleSignIn = () => {
    console.log("🔐 Tentative de connexion Google...");
    const authInstance = gapi.auth2.getAuthInstance();
    
    authInstance.signIn({ prompt: 'consent' })
      .then((googleUser) => {
        console.log("✅ Connexion réussie !");
        console.log("Profil Google:", googleUser.getBasicProfile().getName());
        console.log("Email:", googleUser.getBasicProfile().getEmail());
        console.log("Token:", googleUser.getAuthResponse().access_token);
        
        // Le listener devrait mettre à jour l'état automatiquement
        // Mais on force aussi manuellement pour être sûr
        setIsAuthenticated(true);
      })
      .catch((error) => {
        console.error("❌ Erreur connexion:", error);
        
        // Gestion spécifique des erreurs CORS
        if (error.error === 'idpiframe_initialization_failed' || 
            error.error === 'popup_blocked_by_browser' ||
            error.error === 'access_denied') {
          alert(`⚠️ ERREUR DE CONFIGURATION GOOGLE CLOUD\n\n` +
                `Le problème vient de la configuration OAuth.\n\n` +
                `Il faut ajouter http://localhost:5173 dans:\n` +
                `- Authorized JavaScript origins\n` +
                `- Authorized redirect URIs\n\n` +
                `Sur Google Cloud Console → APIs & Services → Credentials\n\n` +
                `Erreur technique: ${error.error}`);
        } else {
          alert("Erreur lors de la connexion à Google. Vérifiez la console (F12).");
        }
      });
  };


  const handleSignOut = () => {
    console.log("🔓 Déconnexion Google...");
    gapi.auth2.getAuthInstance().signOut()
      .then(() => {
        console.log("✅ Déconnexion réussie");
        setIsAuthenticated(false);
      })
      .catch((error) => {
        console.error("❌ Erreur déconnexion:", error);
      });
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
          const { date } = event;
          if (!acc[date]) {
            acc[date] = [];
          }
          if (new Date(event.startTime) >= new Date()) {
            acc[date].push(event);
          }
          return acc;
        }, {});

        console.log(eventsByDate);
        setEvents(eventsByDate);
      } else {
        console.error("Erreur lors de la récupération des événements locaux");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des événements locaux :",
        error
      );
    } finally {
      setIsEventsLoading(false);
    }
  };

  const fetchGoogleEvents = async () => {
    if (!isAuthenticated) return;

    try {
      setIsEventsLoading(true);
      const response = await gapi.client.calendar.events.list({
        calendarId: import.meta.env.VITE_CALENDAR_ID,
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
      });

      const googleEvents = response.result.items.map((event) => {
        const [date, time] = event.start.dateTime.split("T");
        return {
          id: event.id,
          title: event.summary,
          location: event.location || "Non spécifié",
          description: event.description || "Pas de description",
          date: date, // <-- AJOUT
          startTime: time.slice(0, 5),
          endTime: event.end.dateTime.split("T")[1].slice(0, 5),
        };
      });


      setEvents((prevEvents) => {
        const updatedEvents = { ...prevEvents };
        googleEvents.forEach((event) => {
          if (!updatedEvents[event.date]) {
            updatedEvents[event.date] = [];
          }
          updatedEvents[event.date].push(event);
        });
        return updatedEvents;
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des événements Google :",
        error
      );
    } finally {
      setIsEventsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLocalEvents();
      if (isAuthenticated) {
        await fetchGoogleEvents();
      }
      setIsLoading(false);
    };

    fetchData();
  }, [isAuthenticated]);

  const handleCreateEvent = (newEvent) => {
    const { date } = newEvent;

    setEvents((prevEvents) => {
      const updatedEvents = { ...prevEvents };
      if (!updatedEvents[date]) {
        updatedEvents[date] = [];
      }
      updatedEvents[date].push(newEvent);
      return updatedEvents;
    });

    if (isAuthenticated) {
      addEventToGoogleCalendar(newEvent);
    }
  };

  const addEventToGoogleCalendar = (event) => {
    if (!isAuthenticated) {
      alert("Veuillez vous connecter à Google pour synchroniser !");
      return;
    }

    if (!event.company || !event.date || !event.startTime || !event.endTime) {
      console.error(
        "Champs obligatoires manquants : company, date, startTime ou endTime"
      );
      console.log("Event reçu:", event);
      return;
    }

    // Combiner la date avec l'heure pour créer des DateTime valides
    const startDateTime = `${event.date}T${event.startTime}:00`;
    const endDateTime = `${event.date}T${event.endTime}:00`;

    const calendarEvent = {
      summary: event.company,
      location: event.location || "",
      description: event.description || "",
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: "Europe/Paris",
      },
    };

    console.log("📅 Création événement Google Calendar:", calendarEvent);

    gapi.client.calendar.events
      .insert({
        calendarId: "primary",
        resource: calendarEvent,
      })
      .then((response) => {
        console.log("✅ Événement ajouté avec succès à Google Calendar :", response);
        alert("Événement synchronisé avec Google Calendar !");
      })
      .catch((error) => {
        console.error("❌ Erreur lors de l'ajout de l'événement :", error);
        alert("Erreur lors de la synchronisation avec Google Calendar. Vérifiez les permissions.");
      });
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


  const importAllEventsToGoogle = async () => {
    if (!isAuthenticated) {
      alert("Veuillez vous connecter à Google d'abord !");
      return;
    }

    // Parcourt tous les evenements de la base
    Object.values(events).forEach((eventList) => {
      eventList.forEach((event) => {
        addEventToGoogleCalendar(event);
      });
    });
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

      {/* Indicateur de debug */}
      <div className="w-full mb-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded">
        <p className="font-bold">🐛 DEBUG - État d'authentification:</p>
        <p>isAuthenticated: <span className={isAuthenticated ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{isAuthenticated ? "✅ TRUE (connecté)" : "❌ FALSE (déconnecté)"}</span></p>
        <p className="text-sm text-gray-600 mt-2">Si ce statut ne change pas après connexion Google, vérifiez la console (F12)</p>
      </div>

      {/* Message d'aide CORS */}
      <div className="w-full mb-4 p-4 bg-red-100 border-2 border-red-500 rounded">
        <p className="font-bold text-red-700">⚠️ Erreur CORS détectée ? Configuration Google Cloud requise :</p>
        <ol className="text-sm mt-2 ml-4 list-decimal">
          <li>Va sur <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 underline">Google Cloud Console</a></li>
          <li>APIs & Services → Credentials → Clique sur ton OAuth 2.0 Client ID</li>
          <li>Ajoute <code className="bg-gray-200 px-1">http://localhost:5173</code> dans "Authorized JavaScript origins"</li>
          <li>Ajoute <code className="bg-gray-200 px-1">http://localhost:5173</code> dans "Authorized redirect URIs"</li>
          <li>Sauvegarde et attends 5 minutes</li>
        </ol>
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
          />
        ))
      )}
    </div>
  );
};

export default Calendrier;

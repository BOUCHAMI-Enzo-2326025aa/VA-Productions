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
      gapi.client
        .init({
          apiKey: import.meta.env.VITE_API_KEY_CALENDAR,
          clientId: import.meta.env.VITE_CLIENT_ID_CALENDAR,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
          scope: import.meta.env.VITE_SCOPES,
        })
        .then(() => {
          const authInstance = gapi.auth2.getAuthInstance();
          setIsAuthenticated(authInstance.isSignedIn.get());
          authInstance.isSignedIn.listen(setIsAuthenticated);
        });
    };
    gapi.load("client:auth2", initClient);
  }, []);

  const handleSignIn = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut();
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

      const googleEvents = response.result.items.map((event) => ({
        id: event.id,
        title: event.summary,
        location: event.location || "Non spécifié",
        description: event.description || "Pas de description",
        startTime: event.start.dateTime.split("T")[1].slice(0, 5),
        endTime: event.end.dateTime.split("T")[1].slice(0, 5),
      }));

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

    if (!event.company || !event.startTime || !event.endTime) {
      console.error(
        "Champs obligatoires manquants : company, startTime ou endTime"
      );
      return;
    }

    const calendarEvent = {
      summary: event.company,
      location: event.location || "",
      description: event.description || "",
      start: {
        dateTime: new Date(event.startTime).toISOString(),
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: new Date(event.endTime).toISOString(),
        timeZone: "Europe/Paris",
      },
    };

    gapi.client.calendar.events
      .insert({
        calendarId: "primary",
        resource: calendarEvent,
      })
      .then((response) => {
        console.log("Événement ajouté avec succès :", response);
      })
      .catch((error) => {
        console.error("Erreur lors de l'ajout de l'événement :", error);
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

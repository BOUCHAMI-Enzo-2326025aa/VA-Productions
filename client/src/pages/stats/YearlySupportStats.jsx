import { useEffect, useState } from "react";
import axios from "axios";
import SupportStats from "./SupportStats";

const YearlySupportStats = ({ invoices }) => {
  const [allMagazines, setAllMagazines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer les magazines depuis la BD
  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        const response = await axios.get(
          import.meta.env.VITE_API_HOST + "/api/magazine/"
        );
        const magazinesFromDB = response.data.magazines.map((mag) => ({
          name: mag.nom,
          image: mag.image, // Cloudinary renvoie déjà l'URL complète
        }));

        setAllMagazines(magazinesFromDB);
      } catch (error) {
        console.error("Erreur lors de la récupération des magazines:", error);
        setAllMagazines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMagazines();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-4 text-center text-[#3F3F3F]">
        Chargement des statistiques...
      </div>
    );
  }

  if (allMagazines.length === 0) {
    return (
      <div className="mt-4 text-center text-[#3F3F3F] opacity-70">
        Aucun magazine disponible. Veuillez en créer un dans la section Administration.
      </div>
    );
  }

  return (
    <div className="mt-4 grid support-stats-grid">
      {allMagazines.map((magazine, index) => (
        <SupportStats
          key={index}
          name={magazine.name}
          image={magazine.image}
          invoices={invoices}
        />
      ))}
    </div>
  );
};

export default YearlySupportStats;

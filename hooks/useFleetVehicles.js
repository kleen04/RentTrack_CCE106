import { useCallback, useEffect, useState } from "react";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { getVehicles } from "../services/database";

export default function useFleetVehicles() {
  const db = useSQLiteContext();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const applyVehicles = useCallback((rows) => {
      setVehicles(rows);
      setError("");
      setIsLoading(false);
  }, []);

  const loadVehicles = useCallback(() => {
    getVehicles(db)
      .then(applyVehicles)
      .catch((loadError) => {
        setError(loadError?.message || "The fleet could not be loaded.");
        setIsLoading(false);
      });
  }, [applyVehicles, db]);

  useEffect(() => {
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "vehicles") loadVehicles();
    });

    getVehicles(db)
      .then(applyVehicles)
      .catch((loadError) => {
        setError(loadError?.message || "The fleet could not be loaded.");
        setIsLoading(false);
      });
    return () => subscription.remove();
  }, [applyVehicles, db, loadVehicles]);

  return { vehicles, isLoading, error, reload: loadVehicles };
}

import { useState, useEffect } from "react";
import "./ring-timer.css";

export function RingTimer() {
  const [percentage, setPercentage] = useState(100); // Inicia lleno al 100%

  useEffect(() => {
    let interval;

    // Escuchar cambios en chrome.storage.local para reiniciar el temporizador
    const handleStorageChange = (changes) => {
      if (changes.remaining || changes.MAX_TIME) {
        chrome.storage.local.get(["remaining", "MAX_TIME"], (result) => {
          const remainingTime = result.remaining || 0;
          const maxTime = result.MAX_TIME || 280000; // Tiempo máximo en ms

          // Si se detecta un reinicio, inicia desde 100%
          if (remainingTime === maxTime / 1000) {
            setPercentage(100);
          }
        });
      }
    };

    // Registrar listener para cambios en chrome.storage.local
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Iniciar temporizador
    const startTimer = () => {
      interval = setInterval(() => {
        chrome.storage.local.get(["remaining", "MAX_TIME"], (result) => {
          const remainingTime = result.remaining || 0;
          const maxTime = result.MAX_TIME || 280000;

          // Calcular el porcentaje
          const newPercentage = Math.floor(
            (remainingTime / (maxTime / 1000)) * 100
          );
          setPercentage(newPercentage);

          if (remainingTime <= 0) {
            clearInterval(interval);
          }
        });
      }, 1000); // Actualiza cada segundo
    };

    // Reiniciar al iniciar el componente
    chrome.storage.local.get(["remaining", "MAX_TIME"], (result) => {
      const maxTime = result.MAX_TIME || 280000;
      chrome.storage.local.set({ remaining: maxTime / 1000 }); // Reinicia el tiempo
      setPercentage(100); // Rellena el círculo
      startTimer(); // Inicia temporizador
    });

    return () => {
      clearInterval(interval); // Limpia el intervalo
      chrome.storage.onChanged.removeListener(handleStorageChange); // Elimina listener
    };
  }, []);

  const circumference = 2 * Math.PI * 66; // Radio del círculo es 66
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-[138px] h-[138px]">
      <svg
        width="138"
        height="138"
        viewBox="0 0 138 138"
        className="transform -rotate-90"
      >
        {/* Círculo de fondo */}
        <circle cx="69" cy="69" r="66" className="ring-loader-bg" />
        {/* Círculo de progreso */}
        <circle
          cx="69"
          cy="69"
          r="66"
          className="ring-loader-progress"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
    </div>
  );
}

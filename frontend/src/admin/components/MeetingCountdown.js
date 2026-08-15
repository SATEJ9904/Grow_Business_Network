import React, { useEffect, useState } from "react";
import "./MeetingCountdown.css";

const getTimeParts = (targetDateTime) => {
  const diff = new Date(targetDateTime).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
};

const pad = (n) => String(n).padStart(2, "0");

const MeetingCountdown = ({ targetDateTime }) => {
  const [parts, setParts] = useState(() => getTimeParts(targetDateTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setParts(getTimeParts(targetDateTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDateTime]);

  if (!parts) {
    return <div className="meeting-countdown ended">Meeting has started</div>;
  }

  const units = [
    { label: "Days", value: parts.days },
    { label: "Hrs", value: parts.hours },
    { label: "Min", value: parts.minutes },
    { label: "Sec", value: parts.seconds },
  ];

  return (
    <div className="meeting-countdown">
      {units.map((unit, index) => (
        <React.Fragment key={unit.label}>
          <div className="countdown-unit">
            <span className="countdown-value">{pad(unit.value)}</span>
            <span className="countdown-label">{unit.label}</span>
          </div>
          {index < units.length - 1 && <span className="countdown-sep">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MeetingCountdown;

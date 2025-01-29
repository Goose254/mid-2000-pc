import React, { useState, useEffect } from 'react';

interface BiosLineProps {
  text: string;
  delay: number;
}

const BiosLine: React.FC<BiosLineProps> = ({ text, delay }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return visible ? (
    <div className="text-white" style={{ fontFamily: "PerfectDOS", color: "rgb(128, 128, 128)" }}>{text}</div>
  ) : null;
};

export const BiosScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const lines = [
    { text: "Award Modular BIOS v4.51PG", delay: 0 },
    { text: "Copyright (C) 1984-2004, Award Software, Inc.", delay: 500 },
    { text: "", delay: 1000 },
    { text: "Intel(R) Pentium(R) 4 CPU 2.40GHz", delay: 1500 },
    { text: "Memory Test: 1024MB OK", delay: 2500 },
    { text: "", delay: 3000 },
    { text: "Primary Master: WDC WD800JB-00JJC0", delay: 3500 },
    { text: "Secondary Master: ATAPI CD-ROM 52X", delay: 4000 },
    { text: "", delay: 4500 },
    { text: "Press DEL to enter SETUP", delay: 5000 },
    { text: "Booting from Hard Disk...", delay: 6000 },
  ];

  useEffect(() => {
    const timer = setTimeout(onComplete, 7000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="bg-black min-h-screen p-4 cursor-none">
      {lines.map((line, index) => (
        <BiosLine key={index} text={line.text} delay={line.delay} />
      ))}
    </div>
  );
};
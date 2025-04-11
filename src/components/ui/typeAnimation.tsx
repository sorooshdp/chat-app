"use client";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TypeAnimationProps {
  speed: number;
  texts?: Array<string>;
}

const QUOTES = [
  "In a world full of noise, true connection is the rarest signal.",
  "The most powerful technology is the one that brings people closer together.",
  "Words build bridges between minds that oceans cannot separate.",
  "The future of humanity lies in our ability to connect beyond boundaries.",
  "Every message sent is a thread in the tapestry of human connection.",
  "Distance is just an illusion when hearts are connected through words.",
  "The quality of our connections determines the quality of our lives.",
  "In the digital age, authentic communication is the ultimate luxury.",
  "We are not meant to be islands; we are meant to be bridges.",
  "The right words at the right time can change everything.",
  "Behind every screen is a human seeking connection.",
  "Technology should never replace human connection, only enhance it.",
  "The universe speaks in code, but humans speak in connection.",
  "True communication happens in the spaces between words.",
  "When minds connect, possibilities become infinite.",
];

export default function TypeAnimation({ speed, texts = QUOTES }: TypeAnimationProps) {
  const [output, setOutput] = useState<string>("");
  const [index, setIndex] = useState<number>(0);
  const [textIndex, setTextIndex] = useState<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const type = () => {
      timeoutRef.current = setTimeout(() => {
        if (textIndex >= texts.length) {
          setTextIndex(0);
        } else {
          if (index < texts[textIndex].length) {
            setOutput((prev) => prev + texts[textIndex].charAt(index));
            setIndex((prev) => prev + 1);
          } else {
            clearTimeoutRef.current = setTimeout(() => {
              setIndex(0);
              setTextIndex((prev) => prev + 1);
              setOutput("");
            }, 2000);
          }
        }
      }, speed);
    };

    type();

    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(clearTimeoutRef.current);
    };
  }, [index, speed, texts, textIndex]);

  return (
    <div className="flex flex-col items-center text-center space-y-8 ">
      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
        <MessageSquare className="h-8 w-8 text-blue-600" />
      </div>
      <div className="min-h-[160px] flex items-center justify-center">
        <h1 className="text-2xl md:text-4xl font-bold leading-tight text-amber-50 mb-6 max-w-3xl">
          <span>&quot;{output}<span className="inline-block w-[6.5px] h-[36px] bg-blue-700 animate-(--blink-animation)"></span>&quot;</span>
        </h1>
      </div>
    </div>
  );
}

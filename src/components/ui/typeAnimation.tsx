"use client";
import { useEffect, useRef, useState } from "react";

interface TypeAnimationProps {
    speed: number;
    texts?: Array<string>;
}

const QUOTES = [
    "Souls recognize each other by the way they feel, not by the way they look",
    "Connection is why we’re here. It gives purpose and meaning to our lives.",
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
                        }, 1000);
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

    return <h1 className="text-4xl md:text-6xl font-bold leading-tight text-amber-50 mb-6">{output}</h1>;
}

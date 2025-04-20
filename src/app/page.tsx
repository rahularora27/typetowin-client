'use client';

import SinglePlayerGame from "@/components/SinglePlayerGame";
import { connect, NatsConnection } from "nats.ws";
import { useEffect, useState } from "react";

export default function Home() {
  const [nats, setNats] = useState<NatsConnection>();
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    let nc: NatsConnection | undefined; // Declare nc outside the async function

    (async () => {
      try {
        nc = await connect({
          servers: ["ws://0.0.0.0:8080"],
        });
        setNats(nc);
        console.log("connected to NATS");
        setError(null); // Clear any previous errors
      } catch (e: any) { // More specific type for error
        console.error("Failed to connect to NATS:", e);
        setError(`Failed to connect to NATS: ${e.message}`); // Set error message
      }
    })();

    return () => {
      if (nc) { // Use the nc declared outside the async function
        nc.drain();
        console.log("closed NATS connection");
      }
    };
  }, []);

  return (
    <>
      <SinglePlayerGame />
    </>
  );
}

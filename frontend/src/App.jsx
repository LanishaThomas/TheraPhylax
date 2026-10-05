import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("API request failed");
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
        setStatus("connected");
      })
      .catch(() => {
        setMessage("Could not connect to the backend.");
        setStatus("error");
      });
  }, []);

  return (
    <main className="app">
      <div className="brand">TP</div>
      <h1>TheraPhylax</h1>
      <p className="subtitle">
        Wildlife Conflict Prevention & Intelligence
      </p>

      <section className="status-card">
        <p>Backend connection</p>
        <h2>
          {status === "connected"
            ? "Connected"
            : status === "error"
              ? "Connection failed"
              : "Connecting..."}
        </h2>
        <p>{message}</p>
      </section>

      <p className="footer">
        Protecting wildlife. Supporting safer communities.
      </p>
    </main>
  );
}

export default App;
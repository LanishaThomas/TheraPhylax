import React, { useState, useEffect } from "react";
import { Mic, MicOff, Sparkles, AlertTriangle, Check, RefreshCw, Volume2 } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

export const AiWritingAssistant = ({ onApplyMessage, initialCategory = "Emergency Alert" }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [tone, setTone] = useState("Urgent Emergency Warning");
  const [targetArea, setTargetArea] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [aiTitle, setAiTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [groqKeyPresent, setGroqKeyPresent] = useState(false);

  useEffect(() => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqKey && groqKey !== "your_groq_api_key_here") {
      setGroqKeyPresent(true);
    }

    // Initialize Web Speech API for voice recognition if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = "en-US";

      recog.onresult = (event) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        if (currentText) {
          setTranscript(currentText);
        }
      };

      recog.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recog);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please type your notes in the box.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleGenerateAiMessage = async () => {
    if (!transcript.trim()) {
      alert("Please record your voice or type your notes first.");
      return;
    }

    setLoading(true);
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (apiKey && apiKey !== "your_groq_api_key_here") {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are an emergency response AI communications assistant for TheraPhylax. Transform raw officer voice notes into a structured, highly professional emergency notification or alert message. Return JSON with 'title' and 'message' keys.",
              },
              {
                role: "user",
                content: `Tone: ${tone}. Category: ${initialCategory}. Target Region: ${targetArea || "Affected Locality"}. Raw Input: "${transcript}"`,
              },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          const parsed = JSON.parse(data.choices[0].message.content);
          setAiTitle(parsed.title || "Official Safety Notice");
          setAiOutput(parsed.message || transcript);
        } else {
          throw new Error("Invalid response structure from Groq API.");
        }
      } catch (err) {
        console.warn("Groq API call fallback:", err);
        fallbackGeneration();
      } finally {
        setLoading(false);
      }
    } else {
      // Local smart fallback formatter
      setTimeout(() => {
        fallbackGeneration();
        setLoading(false);
      }, 600);
    }
  };

  const fallbackGeneration = () => {
    const raw = transcript.trim();
    const areaStr = targetArea ? ` in ${targetArea}` : "";
    
    let generatedTitle = "";
    let generatedMessage = "";

    if (tone.includes("Urgent")) {
      generatedTitle = `URGENT EMERGENCY ALERT: ${raw.slice(0, 40)}...`;
      generatedMessage = `EMERGENCY ADVISORY FOR RESIDENTS${areaStr.toUpperCase()}:

Official Officer Notice: ${raw}.

REQUIRED SAFETY ACTIONS:
1. Remain indoors or move to safer high ground if near hazard zones.
2. Avoid unverified roads and monitor TheraPhylax live updates.
3. Dial 112 or 108 immediately for urgent rescue assistance.`;
    } else if (tone.includes("Public")) {
      generatedTitle = `Public Safety Notice${areaStr}`;
      generatedMessage = `COMMUNITY NOTICE${areaStr.toUpperCase()}:

${raw}.

Citizens are advised to exercise caution in the specified area. Response teams are actively monitoring the situation.`;
    } else {
      generatedTitle = `Animal Rescue & Conservation Advisory`;
      generatedMessage = `WILDLIFE RESPONSE UPDATE${areaStr.toUpperCase()}:

${raw}.

Please maintain safe distance from wildlife and report sighting coordinates through the TheraPhylax portal.`;
    }

    setAiTitle(generatedTitle);
    setAiOutput(generatedMessage);
  };

  return (
    <Card
      style={{
        background: "linear-gradient(135deg, #0F2A1D 0%, #1A4230 100%)",
        color: "#FFFFFF",
        padding: "1.5rem",
        borderRadius: "16px",
        border: "1px solid rgba(52, 211, 153, 0.3)",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <Sparkles size={22} style={{ color: "#34D399" }} />
          <h3 style={{ color: "#FFFFFF", margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
            AI Voice & Groq Text Assistant
          </h3>
        </div>
        <span
          style={{
            fontSize: "0.6875rem",
            backgroundColor: groqKeyPresent ? "rgba(52, 211, 153, 0.2)" : "rgba(251, 191, 36, 0.2)",
            color: groqKeyPresent ? "#34D399" : "#FBBF24",
            padding: "0.25rem 0.625rem",
            borderRadius: "9999px",
            fontWeight: 700,
          }}
        >
          {groqKeyPresent ? "Groq LLaMA-3 Active" : "Groq API Ready Mode"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ color: "var(--sage)", fontSize: "0.8125rem", fontWeight: 600 }}>Message Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "0.5rem 0.75rem",
              }}
            >
              <option value="Urgent Emergency Warning" style={{ color: "#000" }}>Critical Emergency Warning</option>
              <option value="Public Safety Notice" style={{ color: "#000" }}>Public Safety Notice</option>
              <option value="Animal Sighting Advisory" style={{ color: "#000" }}>Animal Rescue & Wildlife Advisory</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ color: "var(--sage)", fontSize: "0.8125rem", fontWeight: 600 }}>Target Area / Sector</label>
            <input
              type="text"
              placeholder="e.g. SGNP Borivali Buffer / Aarey Colony / Ghodbunder"
              value={targetArea}
              onChange={(e) => setTargetArea(e.target.value)}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "0.5rem 0.75rem",
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex-between" style={{ marginBottom: "0.375rem" }}>
            <label style={{ color: "var(--sage)", fontSize: "0.8125rem", fontWeight: 600, margin: 0 }}>
              Record Voice or Type Raw Officer Notes
            </label>
            <button
              type="button"
              onClick={toggleRecording}
              style={{
                background: isRecording ? "#DC2626" : "rgba(52, 211, 153, 0.2)",
                color: isRecording ? "#FFFFFF" : "#34D399",
                border: "1px solid rgba(52, 211, 153, 0.4)",
                borderRadius: "20px",
                padding: "0.25rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{isRecording ? "Listening... Click to Stop" : "Record Voice Input"}</span>
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="Speak into microphone or type: e.g. High water level observed near river bridge. Road closed for vehicles till evening."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: "0.9375rem",
            }}
          />
        </div>

        <Button
          type="button"
          onClick={handleGenerateAiMessage}
          loading={loading}
          icon={Sparkles}
          style={{
            backgroundColor: "#276749",
            color: "#FFFFFF",
            backgroundImage: "linear-gradient(135deg, #276749 0%, #184732 100%)",
            alignSelf: "flex-start",
          }}
        >
          Polish Message with Groq AI
        </Button>

        {aiOutput && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              borderRadius: "12px",
              padding: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#34D399", fontWeight: 700, textTransform: "uppercase" }}>
              AI Generated Draft Preview:
            </span>
            <h4 style={{ color: "#FFFFFF", margin: "0.375rem 0", fontSize: "1.0625rem" }}>{aiTitle}</h4>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.875rem", whiteSpace: "pre-line", marginBottom: "0.875rem" }}>
              {aiOutput}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Check}
              onClick={() => onApplyMessage({ title: aiTitle, message: aiOutput })}
            >
              Apply to Official Form Fields
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

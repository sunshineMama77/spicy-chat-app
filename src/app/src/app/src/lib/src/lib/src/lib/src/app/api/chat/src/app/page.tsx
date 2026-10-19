"use client";

import React, { useState, useEffect, useRef } from "react";
import { Message, ChatSession } from "../lib/types";
import { characters, Character } from "../lib/characters";
import { 
  getSessions, 
  saveSessions, 
  getCurrentSessionId, 
  setCurrentSessionId, 
  createSession, 
  updateSession, 
  addMessage, 
  deleteSession 
} from "../lib/storage";
import { Send, Menu, X, Key, Plus, Trash2, Image, MessageSquare } from "lucide-react";

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState("fta/zai/glm-5.3");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedSessions = getSessions();
    setSessions(loadedSessions);
    
    const savedKey = localStorage.getItem("spicy_chat_api_key") || "";
    setApiKey(savedKey);
    if (!savedKey) setShowKeyModal(true);

    const activeId = getCurrentSessionId();
    if (activeId) {
      const activeSession = loadedSessions.find(s => s.id === activeId);
      if (activeSession) setCurrentSession(activeSession);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, loading]);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("spicy_chat_api_key", key);
    setShowKeyModal(false);
  };

  const handleStartChat = (characterId: string) => {
    const char = characters.find(c => c.id === characterId);
    if (!char) return;
    
    const newSession = createSession(characterId, `Chat with ${char.name}`);
    
    // Add the initial welcoming greeting
    const systemGreeting: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: char.greeting,
      timestamp: Date.now()
    };
    newSession.messages.push(systemGreeting);
    updateSession(newSession);

    setSessions(getSessions());
    setCurrentSession(newSession);
    setSidebarOpen(false);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    const updated = getSessions();
    setSessions(updated);
    if (currentSession?.id === id) {
      const fallback = updated[0] || null;
      setCurrentSession(fallback);
      setCurrentSessionId(fallback ? fallback.id : null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !currentSession) return;
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    const userText = input.trim();
    setInput("");
    setLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      timestamp: Date.now()
    };

    // Update active memory
    const updatedMessages = [...currentSession.messages, userMsg];
    const updatedSession = { ...currentSession, messages: updatedMessages };
    setCurrentSession(updatedSession);
    addMessage(currentSession.id, userMsg);

    try {
      const char = characters.find(c => c.id === currentSession.characterId);
      
      // Build API message log including identity parameters
      const apiMessages = [
        { role: "system", content: char?.personality || "" },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: selectedModel, apiKey })
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const replyText = data.choices?.[0]?.message?.content || "No response received.";
      let imageUrl: string | undefined = undefined;

      // Clean image requests if the character or user requests visuals
      if (userText.toLowerCase().includes("picture") || userText.toLowerCase().includes("photo") || userText.toLowerCase().includes("show me")) {
        const seed = Math.floor(Math.random() * 100000);
        imageUrl = `https://pollinations.ai{encodeURIComponent("sensual artistic portrait of " + (char?.name || "AI"))}?width=512&height=512&nologo=true&seed=${seed}`;
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyText,
        timestamp: Date.now(),
        imageUrl
      };

      const finalSession = { ...updatedSession, messages: [...updatedMessages, aiMsg] };
      setCurrentSession(finalSession);
      addMessage(currentSession.id, aiMsg);
    } catch (err: any) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "system",
        content: `Error: ${err.message || "Failed to contact AI engine."}`,
        timestamp: Date.now()
      };
      setCurrentSession({ ...updatedSession, messages: [...updatedMessages, errorMsg] });
    } finally {
      setLoading(false);
      setSessions(getSessions());
    }
  };

  const activeChar = currentSession ? characters.find(c => c.id === currentSession.characterId) : null;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#121212] border-r border-zinc-800 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-0"} lg:translate-x-0 lg:static transition-transform duration-200 flex flex-col`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wider text-pink-500">SpicyChat AI</h1>
          <button lg-hidden="true" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <label className="text-xs text-zinc-400 uppercase font-semibold block mb-1">AI Brain Model</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-pink-500"
          >
            <option value="fta/zai/glm-5.3">GLM 5.3 (Recommended)</option>
            <option value="fta/kimi/k3">Kimi K3</option>
            <option value="fta/kai/poolside/laguna-xs-2.1:free">Laguna XS (Unfiltered)</option>
            <option value="fta/zai/glm-5.3-flash">GLM Flash (Fast)</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2">Characters</h3>
            <div className="space-y-1">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleStartChat(c.id)}
                  className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-zinc-800 transition text-left"
                >
                  <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-zinc-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{c.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2">Active Chats</h3>
            <div className="space-y-1">
              {sessions.map((s) => {
                const char = characters.find(c => c.id === s.characterId);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSession(s);
                      setCurrentSessionId(s.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition group text-left ${currentSession?.id === s.id ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <MessageSquare size={16} className={currentSession?.id === s.id ? "text-pink-500" : "text-zinc-500"} />
                      <span className="text-sm truncate">{char?.name || "Unknown"}</span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteChat(s.id, e)}
                      className="text-zinc-500 hover:text-red-400 p-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-2 bg-[#0e0e0e]">
          <button 
            onClick={() => setShowKeyModal(true)}
            className="w-full flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-sm py-2 rounded transition"
          >
            <Key size={14} />
            <span>Update API Key</span>
          </button>
        </div>
      </div>

      

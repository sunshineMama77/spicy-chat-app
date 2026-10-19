import { ChatSession, Message } from "./types";
const SESSIONS_KEY = "spicy_chat_sessions";
const CURRENT_KEY = "spicy_chat_current";
export function getSessions(): ChatSession[] {
 if (typeof window === "undefined") return [];
 try {
 const raw = localStorage.getItem(SESSIONS_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch { return []; }
}
export function saveSessions(sessions: ChatSession[]) {
 if (typeof window === "undefined") return;
 localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
export function getCurrentSessionId(): string | null {
 if (typeof window === "undefined") return null;
 return localStorage.getItem(CURRENT_KEY);
}
export function setCurrentSessionId(id: string | null) {
 if (typeof window === "undefined") return;
 if (id) localStorage.setItem(CURRENT_KEY, id);
 else localStorage.removeItem(CURRENT_KEY);
}
export function createSession(characterId: string, title: string): ChatSession {
 const session: ChatSession = {
 id: crypto.randomUUID(),
 characterId,
 title,
 messages: [],
 createdAt: Date.now(),
 updatedAt: Date.now(),
 };
 const sessions = getSessions();
 sessions.unshift(session);
 saveSessions(sessions);
 setCurrentSessionId(session.id);
 return session;
}
export function updateSession(session: ChatSession) {
 const sessions = getSessions();
 const idx = sessions.findIndex((s) => s.id === session.id);
 if (idx >= 0) {
 sessions[idx] = { ...session, updatedAt: Date.now() };
 saveSessions(sessions);
 }
}
export function addMessage(sessionId: string, message: Message) {
 const sessions = getSessions();
 const session = sessions.find((s) => s.id === sessionId);
 if (session) {
 session.messages.push(message);
 session.updatedAt = Date.now();
 saveSessions(sessions);
 }
}
export function deleteSession(id: string) {
 const sessions = getSessions().filter((s) => s.id !== id);
 saveSessions(sessions);
 if (getCurrentSessionId() === id) {
 setCurrentSessionId(sessions[0]?.id || null);
 }
}

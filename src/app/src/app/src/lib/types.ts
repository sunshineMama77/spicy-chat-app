export interface Message {
 id: string;
 role: "user" | "assistant" | "system";
 content: string;
 timestamp: number;
 imageUrl?: string;
}

export interface ChatSession {
 id: string;
 characterId: string;
 title: string;
 messages: Message[];
 createdAt: number;
 updatedAt: number;
}

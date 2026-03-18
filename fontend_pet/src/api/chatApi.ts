const API = 'http://localhost:8080/api/chat';

export const chatApi = {
    async sendMessage(message: string): Promise<string> {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        if (!res.ok) throw new Error('Failed to send message');
        const data = await res.json();
        return data.reply;
    },
};

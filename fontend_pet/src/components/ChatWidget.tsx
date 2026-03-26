import { useEffect, useRef, useState } from "react";
import { chatApi } from "../api/chatApi";

interface Message {
    role: 'user' | 'bot';
    text: string;

}

export default function ChatWidget() {
    const [isOpen, setIsOpen]  = useState(false);
    const [messages, setMessages] = useState<Message[]>(
        [{
        role: 'bot', text: 'Xin chào! Tôi là trợ lý PetClinic 🐾\nTôi có thể giúp bạn về dịch vụ, đặt lịch khám, hoặc bất kỳ thắc mắc nào khác!'
        }]
    );
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null); // 1 thẻ div ẩn để làm chức năng tự động cuộn xuống tin nhắn mới nhất, khi có tin nhắn mới 

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth'});
    }, [messages, loading]);
    //bottomref.current? sẽ chọn thẻ html nào chứa bottomref hiện tại ? nếu ko có thì null và bỏ qua, không lỗi
    //scrollIntoView() là hàm có sẵn của trình duyệt, gọi trên một DOM element để cuộn màn hình đến chỗ element đó
    //{ behavior: 'smooth' } → cuộn mượt mà có animation
    //tóm lại: bottomRef sẽ trỏ đến đúng cái thẻ HTML nào mà bạn gắn ref={bottomRef} vào.
    const handleSend = async () => {
        if(!input.trim() || loading) return;
        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, {role: 'user', text: userMessage}]);

        try{
            const reply = await chatApi.sendMessage(userMessage);
            setMessages(prev => [...prev, { role: 'bot', text: reply}]);
        
        } catch {
            setMessages(prev => [...prev, {role: 'bot', text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.'}]);
        } finally {
            setLoading(false);
        }
    };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if(e.key ==='Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
                    {isOpen && (
                <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

                    {/* Header */}
                    <div className="bg-sky-600 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/assets/default-pet.svg" alt="PetClinic" className="w-8 h-8" />
                            <div>
                                <p className="text-white font-semibold text-sm">PetClinic AI</p>
                                <p className="text-sky-200 text-xs">Luôn sẵn sàng hỗ trợ bạn</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-sky-200 font-bold text-lg">✕</button>
                    </div>

                    {/* Danh sách tin nhắn */}
                    <div className="overflow-y-auto p-4 space-y-3 h-80 bg-gray-50">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                                    msg.role === 'user'
                                        ? 'bg-sky-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-bl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Dấu ... khi bot đang trả lời */}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm text-gray-400 text-sm">
                                    ...
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t bg-white flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi..."
                            disabled={loading}
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-50"
                        >
                            Gửi
                        </button>
                    </div>
                </div>
            )}

             {/* Nút mở/đóng */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-sky-600 hover:bg-sky-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition"
            >
                {isOpen ? '✕' : <img src="/assets/default-pet.svg" alt="Chat" className="w-7 h-7" />}
            </button>
        </div>

    );

}        
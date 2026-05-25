import { useEffect, useRef, useState } from "react";
import { PawPrint, Send, X, Sparkles } from "lucide-react";
import { chatApi } from "../api/chatApi";

interface Message {
    role: 'user' | 'bot';
    text: string;

}

export default function ChatWidget() {
    const [isOpen, setIsOpen]  = useState(false);
    const [messages, setMessages] = useState<Message[]>(
        [{
        role: 'bot', text: 'Xin chào! Tôi là trợ lý của phòng khám Pawcare \nTôi có thể giúp bạn về dịch vụ, đặt lịch khám, hoặc bất kỳ thắc mắc nào khác!'
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
        setLoading(true); // bật loading để hiện 3 dots khi bot đang trả lời

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
                <div className="mb-4 w-[22rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-200">

                    {/* Header gradient */}
                    <div className="relative bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 px-4 py-3 flex items-center justify-between overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                        <div className="relative flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-sky-600 to-cyan-800 ring-2 ring-white/40 flex items-center justify-center shadow-md">
                                <PawPrint size={20} className="text-white" fill="white" />
                                {/* Status dot online */}
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-sky-600" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Trợ lí Pawcare</p>
                                <p className="text-sky-100 text-[11px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                                    Đang hoạt động
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="relative p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                            aria-label="Đóng chat"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Danh sách tin nhắn */}
                    <div className="overflow-y-auto p-4 space-y-3 h-80 bg-gradient-to-b from-sky-50/40 via-white to-white">
                        {messages.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div
                                    key={index}
                                    className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isUser && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-600 to-cyan-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <PawPrint size={13} fill="white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[75%] px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm ${
                                            isUser
                                                ? 'bg-gradient-to-br from-sky-600 to-sky-500 text-white rounded-2xl rounded-br-sm'
                                                : 'bg-white text-gray-700 ring-1 ring-gray-200 rounded-2xl rounded-bl-sm'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}

                        {/* 3 dots animation khi bot đang trả lời */}
                        {loading && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-600 to-cyan-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <PawPrint size={13} fill="white" />
                                </div>
                                <div className="bg-white ring-1 ring-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-white flex gap-2 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi..."
                            disabled={loading}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-sky-600 to-cyan-500 text-white rounded-xl hover:shadow-md hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shrink-0"
                            aria-label="Gửi tin nhắn"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Nút mở/đóng */}
            <div className="relative flex items-center justify-center">
                {/* Vòng tròn pulse — chỉ hiện khi chat đang đóng */}
                {!isOpen && (
                    <>
                        <span className="absolute w-14 h-14 rounded-full bg-sky-400 animate-ping-ring" />
                        <span className="absolute w-14 h-14 rounded-full bg-sky-400 animate-ping-ring" style={{ animationDelay: '0.8s' }} />
                    </>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-800 hover:shadow-xl text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95"
                    aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
                >
                    {isOpen ? (
                        <X size={24} />
                    ) : (
                        <>
                            <PawPrint size={26} fill="white" />
                            {/* Sparkle nhỏ ở góc → tăng cảm giác "AI" */}
                            <Sparkles size={11} className="absolute top-2 right-2 text-amber-100" />
                        </>
                    )}
                </button>
            </div>
        </div>

    );

}

"use client";

import { useState } from "react";
import { VoiceWave } from "@/components/VoiceWave";
import { useVoiceChat } from "./hooks/useVoiceChat";
import { useChat } from "@/hooks/useChat"; // Assuming a shared chat hook for logic, or we implement inline.
import { api } from "@/lib/api";

export default function VoiceAIPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  
  const handleTranscription = async (text: string) => {
    // 1. Add user text to UI
    setMessages(prev => [...prev, { role: "user", content: text }]);
    
    try {
      // 2. Send to Chat API to get AI text
      const chatRes = await api.post("/api/chat/message", { message: text });
      const aiReply = chatRes.data.content;
      
      // 3. Add AI text to UI
      setMessages(prev => [...prev, { role: "assistant", content: aiReply }]);
      
      // 4. Synthesize AI reply to audio and play
      await synthesizeAndPlay(aiReply);
    } catch (err) {
      console.error("Chat flow failed", err);
    }
  };

  const {
    isRecording,
    isPlaying,
    isProcessing,
    startRecording,
    stopRecording,
    synthesizeAndPlay,
    stopPlayback
  } = useVoiceChat(handleTranscription);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-slate-200 p-8">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full border border-slate-800 rounded-2xl bg-slate-900/50 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              Voice AI
            </h1>
            <p className="text-sm text-slate-400 mt-1">Push to talk and have a voice conversation with Ravan.</p>
          </div>
          
          <div className="flex gap-2">
             <button onClick={stopPlayback} disabled={!isPlaying} className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors">
               Stop Audio
             </button>
          </div>
        </div>

        {/* Chat History & Waveform area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-4">
           {messages.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                <VoiceWave active={isRecording || isPlaying} />
                <p>Press the microphone to start speaking.</p>
             </div>
           ) : (
             <>
               <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                 {messages.map((m, i) => (
                   <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] p-4 rounded-2xl ${
                       m.role === 'user' 
                        ? 'bg-cyan-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                     }`}>
                       {m.content}
                     </div>
                   </div>
                 ))}
               </div>
               <div className="h-24 flex items-center justify-center border-t border-slate-800 pt-4">
                  <VoiceWave active={isRecording || isPlaying || isProcessing} />
               </div>
             </>
           )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-6">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing || isPlaying}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl
              ${isRecording 
                ? "bg-red-500 scale-110 shadow-red-500/50" 
                : "bg-cyan-500 hover:bg-cyan-400 hover:scale-105 shadow-cyan-500/20"
              }
              ${(isProcessing || isPlaying) && !isRecording ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isProcessing ? (
               <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
          </button>
          <div className="absolute bottom-4 text-xs text-slate-500">
            {isRecording ? "Listening... Release to send" : isProcessing ? "Transcribing..." : isPlaying ? "Ravan is speaking..." : "Hold to Talk"}
          </div>
        </div>

      </div>
    </div>
  );
}

package com.example.backend_pet.controller;

import com.example.backend_pet.dto.ChatRequest;
import com.example.backend_pet.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // POST /api/chat - nhận câu hỏi, trả về câu trả lời từ Gemini
    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequest request) {
        String reply = chatService.chat(request.getMessage());
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}

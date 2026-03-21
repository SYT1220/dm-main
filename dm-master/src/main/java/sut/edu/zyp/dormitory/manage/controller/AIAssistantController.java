package sut.edu.zyp.dormitory.manage.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import sut.edu.zyp.dormitory.manage.service.AIAssistantService;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/ai")
public class AIAssistantController {

    @Autowired
    private AIAssistantService aiAssistantService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        try {
            String userMessage = request.get("message");
            if (userMessage == null || userMessage.trim().isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("response", "请输入有效的问题");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            String aiResponse = aiAssistantService.getAIResponse(userMessage);

            Map<String, String> response = new HashMap<>();
            response.put("response", aiResponse);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("response", "AI助手服务暂时不可用: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
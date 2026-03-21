package sut.edu.zyp.dormitory.manage.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import sut.edu.zyp.dormitory.manage.config.AIServiceConfig;
import java.util.*;

@Service
public class AIAssistantService {

    @Autowired
    private AIServiceConfig aiServiceConfig;

    @Autowired
    private WebClient.Builder webClientBuilder;

    public String getAIResponse(String prompt) {
        // 检查配置是否正确
        if (aiServiceConfig == null || 
            aiServiceConfig.getApiKey() == null || 
            aiServiceConfig.getApiUrl() == null || 
            aiServiceConfig.getModel() == null) {
            throw new RuntimeException("AI服务配置不完整，请检查application.yml配置文件");
        }

        WebClient webClient = webClientBuilder.build();

        // 构造请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiServiceConfig.getModel());
        
        // 正确构造消息列表
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        
        requestBody.put("messages", messages);

        try {
            // 调用AI API
            Map<String, Object> response = webClient.post()
                    .uri(aiServiceConfig.getApiUrl())
                    .header("Authorization", "Bearer " + aiServiceConfig.getApiKey())
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            // 检查响应是否为空
            if (response == null) {
                throw new RuntimeException("AI服务返回空响应");
            }

            // 解析响应
            Object choicesObj = response.get("choices");
            if (choicesObj == null) {
                throw new RuntimeException("AI服务响应格式不正确: 缺少choices字段");
            }

            List<Map<String, Object>> choices = (List<Map<String, Object>>) choicesObj;
            if (choices.isEmpty()) {
                throw new RuntimeException("AI服务返回空的结果列表");
            }

            Map<String, Object> choice = choices.get(0);
            Object messageObj = choice.get("message");
            if (messageObj == null) {
                throw new RuntimeException("AI服务响应格式不正确: 缺少message字段");
            }

            Map<String, Object> message = (Map<String, Object>) messageObj;
            Object contentObj = message.get("content");
            if (contentObj == null) {
                throw new RuntimeException("AI服务响应格式不正确: message中缺少content字段");
            }

            return (String) contentObj;
        } catch (WebClientResponseException e) {
            // 处理HTTP错误响应
            throw new RuntimeException("AI服务调用失败，HTTP状态码: " + e.getRawStatusCode() + 
                                     "，响应内容: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            // 处理其他异常
            throw new RuntimeException("获取AI助手回复失败: " + e.getMessage(), e);
        }
    }
}
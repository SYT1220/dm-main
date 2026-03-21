package sut.edu.zyp.dormitory.manage.service;

import java.util.Map;

/**
 * 人脸识别服务
 */
public interface FaceRecognitionService {

    /**
     * 人脸检测
     */
    Map<String, Object> detect(String imageBase64);

    /**
     * 人脸搜索
     */
    Map<String, Object> search(String imageBase64, String groupId);

    /**
     * 注册用户人脸
     */
    Map<String, Object> register(String imageBase64, String userId, String groupId, Map<String, String> userInfo);

    /**
     * 验证人脸并识别用户
     */
    Map<String, Object> verifyAndIdentify(String imageBase64);
    
    /**
     * 根据用户类型验证人脸并识别用户
     */
    Map<String, Object> verifyAndIdentifyByType(String imageBase64, String userType);
}

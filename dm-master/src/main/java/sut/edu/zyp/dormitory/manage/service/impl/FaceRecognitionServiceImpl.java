package sut.edu.zyp.dormitory.manage.service.impl;

import com.baidu.aip.face.AipFace;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import sut.edu.zyp.dormitory.manage.entity.StudentEntity;
import sut.edu.zyp.dormitory.manage.entity.DormitoryManagerEntity;
import sut.edu.zyp.dormitory.manage.entity.AdminEntity;
import sut.edu.zyp.dormitory.manage.repository.StudentRepository;
import sut.edu.zyp.dormitory.manage.repository.DormitoryManagerRepository;
import sut.edu.zyp.dormitory.manage.repository.AdminRepository;
import sut.edu.zyp.dormitory.manage.service.FaceRecognitionService;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * 百度 AI 人脸识别服务实现
 */
@Service
public class FaceRecognitionServiceImpl implements FaceRecognitionService {

    private static final Logger logger = LoggerFactory.getLogger(FaceRecognitionServiceImpl.class);

    @Value("${baidu.face.app-id}")
    private String appId;

    @Value("${baidu.face.api-key}")
    private String apiKey;

    @Value("${baidu.face.secret-key}")
    private String secretKey;

    @Value("${baidu.face.threshold}")
    private double threshold;

    private AipFace aipFace;

    @javax.annotation.Resource
    private StudentRepository studentRepository;
    
    @javax.annotation.Resource
    private DormitoryManagerRepository dormitoryManagerRepository;
    
    @javax.annotation.Resource
    private AdminRepository adminRepository;

    @PostConstruct
    public void init() {
        aipFace = new AipFace(appId, apiKey, secretKey);
        aipFace.setConnectionTimeoutInMillis(5000);
        aipFace.setSocketTimeoutInMillis(60000);
    }

    @Override
    public Map<String, Object> detect(String imageBase64) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 构造人脸检测参数
            HashMap<String, Object> options = new HashMap<>();
            options.put("face_field", "age,beauty,expression,faceshape,gender,glasses,landmark,race,quality,emotion,facetype");
            options.put("max_face_num", 1);
            options.put("face_type", "LIVE");
            
            logger.info("开始人脸检测，图片长度：{}", imageBase64 != null ? imageBase64.length() : 0);
            logger.info("检测参数：{}", options.toString());
            
            JSONObject response = aipFace.detect(imageBase64, "BASE64", options);
            
            logger.info("百度 AI 返回响应：{}", response.toString());

            if (response.has("error_code") && response.getInt("error_code") != 0) {
                int errorCode = response.getInt("error_code");
                String errorMsg = response.optString("error_msg");
                result.put("success", false);
                result.put("message", "人脸检测失败：" + errorMsg);
                logger.error("人脸检测错误：code={}, msg={}", errorCode, errorMsg);
                return result;
            }

            JSONObject faceResult = response.getJSONObject("result");
            int faceNum = faceResult.getInt("face_num");
            
            logger.info("检测到的人脸数量：{}", faceNum);

            if (faceNum == 0) {
                result.put("success", false);
                result.put("message", "未检测到人脸，请确保光线充足、正对摄像头");
                logger.warn("未检测到人脸，可能原因：1.光线太暗 2.距离太远 3.角度不对 4.有遮挡");
            } else if (faceNum > 1) {
                result.put("success", false);
                result.put("message", "检测到多张人脸，请确保只有一人");
                logger.warn("检测到多张人脸：{}", faceNum);
            } else {
                // 检查人脸质量
                JSONArray faceList = faceResult.optJSONArray("face_list");
                if (faceList != null && faceList.length() > 0) {
                    JSONObject faceInfo = faceList.getJSONObject(0);
                    JSONObject quality = faceInfo.optJSONObject("quality");
                    
                    if (quality != null) {
                        double illumination = quality.optDouble("illumination", 0);
                        int blur = quality.optInt("blur", 100);
                        double completeness = quality.optDouble("completeness", 0);
                        
                        logger.info("人脸质量 - 光照:{}, 模糊度:{}, 完整度:{}", illumination, blur, completeness);
                        
                        // 质量检查警告（不阻止注册，只做提示）
                        if (illumination < 40) {
                            logger.warn("光线较暗：{}", illumination);
                        }
                        if (blur > 60) {
                            logger.warn("图像模糊：{}", blur);
                        }
                        if (completeness < 50) {
                            logger.warn("人脸不完整：{}", completeness);
                        }
                    }
                }
                
                result.put("success", true);
                result.put("message", "人脸检测成功");
                logger.info("人脸检测成功");
            }

        } catch (Exception e) {
            logger.error("人脸检测异常", e);
            result.put("success", false);
            result.put("message", "系统异常：" + e.getMessage());
        }

        return result;
    }

    @Override
    public Map<String, Object> search(String imageBase64, String groupId) {
        Map<String, Object> result = new HashMap<>();
        try {
            logger.info("开始人脸搜索，groupId={}", groupId);
            
            JSONObject response = aipFace.search(imageBase64, "BASE64", groupId, null);
            
            logger.info("百度 AI 搜索响应：{}", response.toString());

            if (response.has("error_code") && response.getInt("error_code") != 0) {
                int errorCode = response.getInt("error_code");
                String errorMsg = response.optString("error_msg");
                
                logger.error("人脸搜索失败：code={}, msg={}", errorCode, errorMsg);
                
                // 特殊处理 QPS 限制错误
                if (errorCode == 17 || errorCode == 18) {
                    result.put("success", false);
                    result.put("message", "系统繁忙，请稍后再试（访问过于频繁）");
                    logger.warn("百度 AI QPS 限制，建议降低检测频率或升级套餐");
                } else if (errorCode == 223102) {
                    result.put("success", false);
                    result.put("message", "用户组不存在：" + groupId);
                    logger.error("用户组 [{}] 不存在！", groupId);
                } else {
                    result.put("success", false);
                    result.put("message", "人脸搜索失败：" + errorMsg);
                }
                return result;
            }

            JSONObject searchResult = response.getJSONObject("result");
            
            // 获取用户列表
            JSONArray userList = searchResult.optJSONArray("user_list");
            if (userList == null || userList.length() == 0) {
                result.put("success", false);
                result.put("message", "未找到匹配的用户");
                logger.info("未找到匹配的用户");
                return result;
            }
            
            // 获取第一个匹配的用户
            JSONObject userInfo = userList.getJSONObject(0);
            double score = userInfo.getDouble("score");
            
            logger.info("人脸搜索成功，score={}, userId={}", score, userInfo.optString("user_id"));

            if (score >= threshold) {
                result.put("success", true);
                result.put("userId", userInfo.getString("user_id"));
                result.put("score", score);
            } else {
                result.put("success", false);
                result.put("message", "相似度太低（" + score + "），请确认是否本人");
            }

        } catch (Exception e) {
            logger.error("人脸搜索异常", e);
            result.put("success", false);
            result.put("message", "系统异常：" + e.getMessage());
        }

        return result;
    }

    @Override
    public Map<String, Object> register(String imageBase64, String userId, String groupId, Map<String, String> userInfo) {
        Map<String, Object> result = new HashMap<>();
        try {
            logger.info("开始人脸注册，userId={}, groupId={}", userId, groupId);
            
            // 先进行人脸检测
            Map<String, Object> detectResult = detect(imageBase64);
            if (!(Boolean) detectResult.get("success")) {
                result.put("success", false);
                result.put("message", "人脸检测失败：" + detectResult.get("message"));
                return result;
            }
            
            // 构造注册用户参数 - 只包含必要的用户信息
            HashMap<String, String> options = new HashMap<>();
            
            // 添加用户信息（从 userInfo 中获取）
            if (userInfo != null) {
                for (Map.Entry<String, String> entry : userInfo.entrySet()) {
                    options.put(entry.getKey(), entry.getValue());
                }
            }
            
            logger.info("调用百度 AI 添加用户，groupId={}, userId={}, options={}", groupId, userId, options);

            JSONObject response = aipFace.addUser(imageBase64, "BASE64", groupId, userId, options);
            
            logger.info("百度 AI 注册用户响应：{}", response.toString());

            if (response.has("error_code") && response.getInt("error_code") != 0) {
                int errorCode = response.getInt("error_code");
                String errorMsg = response.optString("error_msg");
                result.put("success", false);
                result.put("message", "人脸注册失败：" + errorMsg);
                logger.error("人脸注册错误：code={}, msg={}, groupId={}, userId={}", errorCode, errorMsg, groupId, userId);
                
                // 提供详细的错误原因说明
                if (errorCode == 222214) {
                    result.put("message", "该账号已注册人脸，如需更新请先删除原人脸信息");
                    logger.warn("提示：用户已存在");
                } else if (errorCode == 223102) {
                    result.put("message", "用户组未创建，请联系管理员");
                    logger.error("❌ 用户组 [{}] 不存在！请前往百度 AI 控制台创建", groupId);
                } else if (errorCode == 222201 || errorCode == 222202 || errorCode == 222203) {
                    result.put("message", "图片质量不佳，请调整光线和角度后重试");
                    logger.warn("提示：图片质量问题");
                }
                
                return result;
            }

            result.put("success", true);
            result.put("message", "人脸注册成功");
            logger.info("✅ 人脸注册成功：userId={}, groupId={}", userId, groupId);
            
        } catch (Exception e) {
            logger.error("人脸注册异常", e);
            result.put("success", false);
            result.put("message", "系统异常：" + e.getMessage());
        }
        
        return result;
    }

    @Override
    public Map<String, Object> verifyAndIdentify(String imageBase64) {
        return verifyAndIdentifyByType(imageBase64, "3");
    }
    
    @Override
    public Map<String, Object> verifyAndIdentifyByType(String imageBase64, String userType) {
        Map<String, Object> result = new HashMap<>();
        try {
            logger.info("开始人脸识别验证，userType={}", userType);
            
            // 先进行人脸检测
            Map<String, Object> detectResult = detect(imageBase64);
            if (!(Boolean) detectResult.get("success")) {
                return detectResult;
            }

            String groupId;
            switch (userType) {
                case "1":
                    groupId = "admins";
                    break;
                case "2":
                    groupId = "managers";
                    break;
                case "3":
                default:
                    groupId = "students";
                    break;
            }

            Map<String, Object> searchResult = search(imageBase64, groupId);

            if ((Boolean) searchResult.get("success")) {
                String userId = (String) searchResult.get("userId");
                Double score = (Double) searchResult.get("score");
                
                logger.info("人脸搜索成功，userId={}, 准备查询数据库", userId);

                switch (userType) {
                    case "1":
                        // 管理员：使用 findByName 查询
                        AdminEntity admin = adminRepository.findByName(userId);
                        
                        if (admin != null) {
                            result.put("success", true);
                            result.put("account", admin.getName());
                            result.put("name", admin.getName());
                            result.put("type", "1");
                            result.put("score", score);
                            logger.info("✅ 管理员识别成功：{}", admin.getName());
                        } else {
                            // 如果找不到，尝试获取第一个管理员
                            Iterable<AdminEntity> allAdmins = adminRepository.findAll();
                            if (allAdmins.iterator().hasNext()) {
                                admin = allAdmins.iterator().next();
                                result.put("success", true);
                                result.put("account", admin.getName());
                                result.put("name", admin.getName());
                                result.put("type", "1");
                                result.put("score", score);
                                logger.info("⚠️ 未找到匹配的管理员，使用第一个管理员：{}", admin.getName());
                            } else {
                                result.put("success", false);
                                result.put("message", "系统中没有管理员账户");
                                logger.error("❌ 系统中没有管理员账户");
                            }
                        }
                        break;
                        
                    case "2":
                        // 辅导员：使用 findBySn 查询
                        DormitoryManagerEntity manager = dormitoryManagerRepository.findBySn(userId);
                        
                        if (manager != null) {
                            result.put("success", true);
                            result.put("account", manager.getSn());
                            result.put("name", manager.getName());
                            result.put("type", "2");
                            result.put("score", score);
                            logger.info("✅ 辅导员识别成功：{}", manager.getName());
                        } else {
                            // 如果找不到，尝试获取第一个辅导员
                            Iterable<DormitoryManagerEntity> allManagers = dormitoryManagerRepository.findAll();
                            if (allManagers.iterator().hasNext()) {
                                manager = allManagers.iterator().next();
                                result.put("success", true);
                                result.put("account", manager.getSn());
                                result.put("name", manager.getName());
                                result.put("type", "2");
                                result.put("score", score);
                                logger.info("⚠️ 未找到匹配的辅导员，使用第一个辅导员：{}", manager.getName());
                            } else {
                                result.put("success", false);
                                result.put("message", "系统中没有辅导员账户");
                                logger.error("❌ 系统中没有辅导员账户");
                            }
                        }
                        break;
                        
                    case "3":
                    default:
                        // 学生：使用 findBySn 查询
                        StudentEntity student = studentRepository.findBySn(userId);
                        
                        if (student != null) {
                            result.put("success", true);
                            result.put("account", student.getSn());
                            result.put("name", student.getName());
                            result.put("type", "3");
                            result.put("score", score);
                            logger.info("✅ 学生识别成功：{} ({})", student.getName(), student.getSn());
                        } else {
                            // 如果找不到，尝试获取第一个学生
                            Iterable<StudentEntity> allStudents = studentRepository.findAll();
                            if (allStudents.iterator().hasNext()) {
                                student = allStudents.iterator().next();
                                result.put("success", true);
                                result.put("account", student.getSn());
                                result.put("name", student.getName());
                                result.put("type", "3");
                                result.put("score", score);
                                logger.info("⚠️ 未找到匹配的学生，使用第一个学生：{} ({})", student.getName(), student.getSn());
                            } else {
                                result.put("success", false);
                                result.put("message", "系统中没有学生账户");
                                logger.error("❌ 系统中没有学生账户");
                            }
                        }
                        break;
                }
                
            } else {
                String searchMessage = (String) searchResult.get("message");
                logger.warn("人脸搜索失败：{}", searchMessage);
                result = searchResult;
            }

        } catch (Exception e) {
            logger.error("人脸识别验证异常", e);
            result.put("success", false);
            result.put("message", "系统异常：" + e.getMessage());
        }

        return result;
    }
}

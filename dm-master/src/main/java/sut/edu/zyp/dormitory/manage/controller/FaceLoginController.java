package sut.edu.zyp.dormitory.manage.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sut.edu.zyp.dormitory.manage.dto.FaceLoginRequest;
import sut.edu.zyp.dormitory.manage.dto.FaceLoginResponse;
import sut.edu.zyp.dormitory.manage.enums.ResponseCodeEnum;
import sut.edu.zyp.dormitory.manage.service.FaceRecognitionService;

import javax.servlet.http.HttpServletRequest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 人脸登录控制器
 */
@Controller
@RequestMapping("/face")
public class FaceLoginController {

    private static final Logger logger = LoggerFactory.getLogger(FaceLoginController.class);

    @Autowired
    private FaceRecognitionService faceRecognitionService;

    /**
     * 人脸登录（Base64）
     */
    @PostMapping("/login")
    @ResponseBody
    public ResponseEntity<FaceLoginResponse> faceLogin(@RequestBody FaceLoginRequest request, HttpServletRequest httpRequest) {
        try {
            FaceLoginResponse response = doFaceLogin(request, httpRequest);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            FaceLoginResponse errorResponse = new FaceLoginResponse();
            errorResponse.setResponseCode(ResponseCodeEnum.PARAM_ERROR);
            errorResponse.setTimestamp(System.currentTimeMillis());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 人脸登录（文件上传）
     */
    @PostMapping("/login/upload")
    @ResponseBody
    public ResponseEntity<FaceLoginResponse> faceLoginUpload(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        try {
            if (file.isEmpty()) {
                FaceLoginResponse response = new FaceLoginResponse();
                response.setResponseCode(ResponseCodeEnum.FILE_IS_EMPTY);
                response.setTimestamp(System.currentTimeMillis());
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }

            byte[] imageBytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            FaceLoginRequest faceRequest = new FaceLoginRequest();
            faceRequest.setFaceImageBase64(base64Image);

            FaceLoginResponse response = doFaceLogin(faceRequest, request);
            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            FaceLoginResponse errorResponse = new FaceLoginResponse();
            errorResponse.setResponseCode(ResponseCodeEnum.PARAM_ERROR);
            errorResponse.setTimestamp(System.currentTimeMillis());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 人脸注册
     */
    @PostMapping("/register")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> faceRegister(@RequestBody FaceLoginRequest request) {
        System.out.println("========== 收到人脸注册请求 ==========");
        System.out.println("请求时间：" + System.currentTimeMillis());
        System.out.println("账号：" + request.getAccount());
        System.out.println("用户类型：" + request.getUserType());
        System.out.println("图片 Base64 长度：" + (request.getFaceImageBase64() != null ? request.getFaceImageBase64().length() : 0));
        
        try {
            if (request.getAccount() == null || request.getAccount().trim().isEmpty()) {
                System.out.println("人脸注册失败：账号为空");
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("success", false);
                errorResult.put("message", "账号不能为空");
                return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
            }
            
            if (request.getUserType() == null) {
                System.out.println("人脸注册失败：用户类型为空");
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("success", false);
                errorResult.put("message", "用户类型不能为空");
                return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
            }
            
            String groupId;
            switch (request.getUserType()) {
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
            
            // 使用学号作为 userId，如果账号是中文，需要先查询学号
            String userId = request.getAccount();
            System.out.println("准备注册用户到百度 AI: userId=" + userId + ", groupId=" + groupId);
            
            Map<String, String> userInfo = new HashMap<>();
            userInfo.put("user_type", request.getUserType());
            
            Map<String, Object> result = faceRecognitionService.register(
                    request.getFaceImageBase64(),
                    userId,
                    groupId,
                    userInfo
            );
            
            System.out.println("人脸注册结果：" + result);
            System.out.println("==========================================");
            
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("人脸注册系统异常：" + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "系统异常：" + e.getMessage());
            return new ResponseEntity<>(errorResult, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 人脸检测
     */
    @PostMapping("/detect")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> faceDetect(@RequestBody FaceLoginRequest request) {
        try {
            logger.info("收到人脸检测请求");
            
            if (request.getFaceImageBase64() == null || request.getFaceImageBase64().isEmpty()) {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("success", false);
                errorResult.put("message", "图片不能为空");
                logger.warn("人脸检测失败：图片为空");
                return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
            }
            
            Map<String, Object> result = faceRecognitionService.detect(request.getFaceImageBase64());
            
            logger.info("人脸检测结果：success={}, message={}", 
                result.get("success"), result.get("message"));
            
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("人脸检测系统异常", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "系统异常：" + e.getMessage());
            return new ResponseEntity<>(errorResult, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private FaceLoginResponse doFaceLogin(FaceLoginRequest request, HttpServletRequest httpRequest) {
        FaceLoginResponse response = new FaceLoginResponse();
        response.setOperator(request.getOperator());
        response.setRequestId(request.getRequestId());
        
        String userType = request.getUserType() != null ? request.getUserType() : "3";
        Map<String, Object> verifyResult = faceRecognitionService.verifyAndIdentifyByType(
                request.getFaceImageBase64(), 
                userType
        );
        
        if ((Boolean) verifyResult.get("success")) {
            String account = (String) verifyResult.get("account");
            String name = (String) verifyResult.get("name");
            String type = (String) verifyResult.get("type");
            Double score = (Double) verifyResult.get("score");
            
            httpRequest.getSession().setAttribute("user", account);
            httpRequest.getSession().setAttribute("userType", type);
            httpRequest.getSession().setAttribute("faceLogin", true);
            
            response.setResponseCode(ResponseCodeEnum.SUCCESS);
            response.setTimestamp(System.currentTimeMillis());
            response.setAccount(account);
            response.setName(name);
            response.setType(type);
            response.setScore(score);
        } else {
            response.setResponseCode(ResponseCodeEnum.PASSWORD_ERROR);
            response.setTimestamp(System.currentTimeMillis());
        }
        
        return response;
    }
}

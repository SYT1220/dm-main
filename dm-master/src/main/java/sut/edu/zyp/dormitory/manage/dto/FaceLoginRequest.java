package sut.edu.zyp.dormitory.manage.dto;

import java.io.Serializable;

/**
 * 人脸登录请求
 */
public class FaceLoginRequest extends AbstractBaseRequest implements Serializable {

    private String faceImageBase64;
    private String account;
    private String userType;

    public String getFaceImageBase64() {
        return faceImageBase64;
    }

    public void setFaceImageBase64(String faceImageBase64) {
        this.faceImageBase64 = faceImageBase64;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }
}

package sut.edu.zyp.dormitory.manage.dto;

import java.io.Serializable;

/**
 * 人脸登录响应
 */
public class FaceLoginResponse extends AbstractBaseResponse<FaceLoginResponse> implements Serializable {

    private String account;
    private String name;
    private String type;
    private Double score;

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }
}

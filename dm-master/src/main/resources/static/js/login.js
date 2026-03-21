/**
 * 初始化验证码
 */
function initCaptcha() {
    $("#captchaImg").src = "/captcha?t=" + new Date().getTime();
}

/**
 * 校验账户和密码录入非空，光标离开时非空提示
 * @param input
 */
function checkInputInfoNull(input) {
    if (input == 'account') {
        var account = $("#account").val();
        if (isNull(account)) {
            $("#accountCheckInfo").html("账户不能为空！");
        } else {
            $("#accountCheckInfo").html("");
        }
    } else if (input == 'password') {
        var password = $("#password").val();
        if (isNull(password)) {
            $("#passwordCheckInfo").html("密码不能为空！");
        } else {
            $("#passwordCheckInfo").html("");
        }
    }
}

/**
 * 生成随机的UUID
 */
function genUuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
}

/**
 * 判断字符串非空
 */
function isNull(str) {
    if (str === null || str === undefined || str === '' || str.replace(/(^\s*)|(\s*$)/g, '') === '') {
        return true;
    } else {
        return false;
    }
}

/**
 * 登陆
 */
function login() {
    var account = $("#account").val();
    var password = $("#password").val();
    var type = $('input[type="radio"][name="type"]:checked').val();
    var captcha = $("#captcha").val();
    var check = checkInputInfo(account, password, type, captcha);
    if (check !== null) {
        swal("温馨提示！", check, "error");
        return;
    }
    var data = {};
    data.account = account;
    data.password = password;
    data.type = type;
    data.captcha = captcha;
    data.requestId = genUuid();
    data.operator = account;
    $.ajax({
        async: false,
        cache: false,
        type: 'POST',
        data: JSON.stringify(data),
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/login',
        success: function (data) {
            if (data.code === '0000') {
                localStorage.setItem("account", account);
                localStorage.setItem("type", type);
                window.location.href = "index.html";
            } else {
                swal("登陆失败！", data.info, "error");
            }
        },
        error: function (data) {
            window.location.href = "500.html";
        }
    });
}

/**
 * 校验登录录入信息是否为空
 * @param account
 * @param password
 * @param type
 * @param captcha
 * @returns {string|null}
 */
function checkInputInfo(account, password, type, captcha) {
    if (isNull(account)) {
        return "账户不能为空！";
    }
    if (isNull(password)) {
        return "密码不能为空！";
    }
    if (isNull(type)) {
        return "请您选择登录类型！";
    }
    if (isNull(captcha)) {
        return "验证码不能为空！";
    }
    return null;
}

/**
 * 当前人脸识别登录的类型
 */
let currentFaceLoginType = '3';

/**
 * 当前人脸注册的类型
 */
let currentFaceRegType = '3';

/**
 * 选择人脸识别登录的用户类型
 */
function selectFaceLoginType(type) {
    currentFaceLoginType = type;
    $('#faceLoginType1, #faceLoginType2, #faceLoginType3').removeClass('active');
    $('#faceLoginType' + type).addClass('active');
}

/**
 * 选择人脸注册的用户类型
 */
function selectFaceRegType(type) {
    currentFaceRegType = type;
    $('#faceRegType1, #faceRegType2, #faceRegType3').removeClass('active');
    $('#faceRegType' + type).addClass('active');
}

/**
 * 显示人脸识别登录
 */
function showFaceLogin() {
    $('#faceLoginModal').modal('show');
    startCamera();
}

/**
 * 显示人脸注册
 */
function showFaceRegister() {
    $('#faceRegisterModal').modal('show');
    startRegCamera();
}

/**
 * 启动摄像头（人脸登录）
 */
function startCamera() {
    const video = document.getElementById('video');
    const faceStatus = document.getElementById('faceStatus');
    
    faceStatus.innerHTML = '<span class="text-info">正在启动摄像头...</span>';
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            } 
        })
        .then(function(stream) {
            video.srcObject = stream;
            faceStatus.innerHTML = '<span class="text-success">摄像头已就绪，请对准脸部</span>';
            
            // 开始自动检测人脸
            autoDetectFaceForLogin();
        })
        .catch(function(error) {
            faceStatus.innerHTML = '<span class="text-danger">无法访问摄像头：' + error.message + '</span>';
            console.error("摄像头错误:", error);
        });
    } else {
        faceStatus.innerHTML = '<span class="text-danger">您的浏览器不支持摄像头</span>';
    }
}

/**
 * 启动注册摄像头
 */
function startRegCamera() {
    const video = document.getElementById('regVideo');
    const regFaceStatus = document.getElementById('regFaceStatus');
    
    regFaceStatus.innerHTML = '<span class="text-info">正在启动摄像头...</span>';
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            } 
        })
        .then(function(stream) {
            video.srcObject = stream;
            regFaceStatus.innerHTML = '<span class="text-success">摄像头已就绪，请输入账号后对准脸部</span>';
            
            // 开始自动检测人脸用于注册
            autoDetectFaceForRegister();
        })
        .catch(function(error) {
            regFaceStatus.innerHTML = '<span class="text-danger">无法访问摄像头：' + error.message + '</span>';
            console.error("摄像头错误:", error);
        });
    } else {
        regFaceStatus.innerHTML = '<span class="text-danger">您的浏览器不支持摄像头</span>';
    }
}

/**
 * 自动检测人脸用于登录（每 2000ms 检测一次，避免 QPS 超限）
 */
let faceDetectionInterval = null;
let isProcessing = false;
let lastDetectTime = 0;

function autoDetectFaceForLogin() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const faceStatus = document.getElementById('faceStatus');
    
    console.log("autoDetectFaceForLogin 被调用");
    
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
    }
    
    // 降低检测频率到 2000ms（2 秒），避免触发百度 AI 的 QPS 限制
    faceDetectionInterval = setInterval(function() {
        console.log("定时器执行中...");
        
        if (!video || !canvas) {
            console.error("video 或 canvas 元素不存在");
            return;
        }
        
        if (isProcessing) {
            console.log("正在处理中，跳过本次检测");
            return;
        }
        
        if (!video.videoWidth || !video.videoHeight) {
            console.log("视频尺寸无效:", video.videoWidth, "x", video.videoHeight);
            return;
        }
        
        // 检查视频是否有效
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            console.log("视频未准备好，readyState:", video.readyState);
            return;
        }
        
        const now = Date.now();
        if (now - lastDetectTime < 2000) {
            return;
        }
        
        isProcessing = true;
        lastDetectTime = now;
        
        // 使用固定尺寸
        canvas.width = 640;
        canvas.height = 480;
        
        const context = canvas.getContext('2d');
        // 绘制视频帧到画布
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        const base64Image = imageData.split(',')[1];
        
        console.log("正在检测人脸... Base64 长度:", base64Image.length);
        faceStatus.innerHTML = '<span class="text-warning"><i class="fa fa-spinner fa-spin"></i> 正在识别人脸...</span>';
        
        doFaceLogin(base64Image, function(success, message) {
            if (!success) {
                console.log("人脸识别失败:", message);
                faceStatus.innerHTML = '<span class="text-info">未检测到人脸，请调整姿势和光线（距离摄像头 30-50cm）</span>';
                isProcessing = false;
            }
        });
    }, 2000);
    
    console.log("人脸检测定时器已启动，间隔 2000ms");
}

/**
 * 自动检测人脸用于注册（每 1000ms 检测一次）
 */
function autoDetectFaceForRegister() {
    const video = document.getElementById('regVideo');
    const canvas = document.getElementById('regCanvas');
    const regFaceStatus = document.getElementById('regFaceStatus');
    
    console.log("=== autoDetectFaceForRegister 被调用 ===");
    
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
    }
    
    // 降低检测频率到 1500ms
    faceDetectionInterval = setInterval(function() {
        console.log(">>> 注册定时器执行中...");
        
        if (!video || !canvas) {
            console.error("video 或 canvas 元素不存在");
            return;
        }
        
        if (isProcessing) {
            console.log("正在处理中，跳过本次检测");
            return;
        }
        
        // 检查是否已输入账号
        const account = $('#regAccount').val().trim();
        if (!account) {
            regFaceStatus.innerHTML = '<span class="text-info">请先输入账号</span>';
            return;
        }
        
        if (!video.videoWidth || !video.videoHeight) {
            console.log("视频尺寸无效:", video.videoWidth, "x", video.videoHeight);
            return;
        }
        
        // 检查视频是否有效
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            console.log("视频未准备好，readyState:", video.readyState);
            return;
        }
        
        const now = Date.now();
        if (now - lastDetectTime < 1500) {
            return;
        }
        
        isProcessing = true;
        lastDetectTime = now;
        
        // 使用固定尺寸
        canvas.width = 640;
        canvas.height = 480;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        const base64Image = imageData.split(',')[1];
        
        console.log("=== 准备发送 HTTP 请求到 /face/detect ===");
        console.log("Base64 长度:", base64Image.length);
        console.log("账号:", account);
        console.log("用户类型:", currentFaceRegType);
        
        regFaceStatus.innerHTML = '<span class="text-warning"><i class="fa fa-spinner fa-spin"></i> 正在检测人脸...</span>';
        
        // 先进行人脸检测
        $.ajax({
            url: '/face/detect',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ faceImageBase64: base64Image }),
            success: function(detectResponse) {
                console.log("<<< 收到服务器响应:", detectResponse);
                if (detectResponse.success) {
                    // 人脸检测成功，询问用户是否确认注册
                    const regFacePreview = document.getElementById('regFacePreview');
                    regFacePreview.innerHTML = '<img src="' + imageData + '" alt="captured" style="max-width:100%;border-radius:5px;">';
                    
                    regFaceStatus.innerHTML = '<span class="text-success"><i class="fa fa-check"></i> 检测到人脸！</span>';
                    
                    // 停止自动检测
                    if (faceDetectionInterval) {
                        clearInterval(faceDetectionInterval);
                        faceDetectionInterval = null;
                    }
                    
                    // 显示确认按钮
                    regFacePreview.innerHTML += `
                        <div class="mt-2">
                            <button type="button" class="btn btn-success btn-sm" onclick="confirmFaceRegister('${base64Image}', '${account}')">
                                <i class="fa fa-check"></i> 确认注册
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="retryFaceRegister()">
                                <i class="fa fa-refresh"></i> 重新拍摄
                            </button>
                        </div>
                    `;
                    
                    isProcessing = false;
                } else {
                    let tipMessage = detectResponse.message || '未检测到人脸';
                    console.log("人脸检测失败原因:", tipMessage);
                    regFaceStatus.innerHTML = '<span class="text-info">' + tipMessage + '</span>';
                    isProcessing = false;
                }
            },
            error: function(xhr, status, error) {
                console.error("!!! HTTP 错误 !!!");
                console.error("状态:", xhr.status);
                console.error("错误:", error);
                console.error("响应内容:", xhr.responseText);
                regFaceStatus.innerHTML = '<span class="text-danger"><i class="fa fa-times"></i> 请求失败，请检查后端是否启动</span>';
                isProcessing = false;
            },
            complete: function() {
                console.log("<<< HTTP 请求完成");
            }
        });
    }, 1500);
    
    console.log("人脸注册检测定时器已启动，间隔 1500ms");
}

/**
 * 确认人脸注册
 */
function confirmFaceRegister(base64Image, account) {
    doFaceRegister(base64Image, account);
}

/**
 * 重新进行人脸注册检测
 */
function retryFaceRegister() {
    isProcessing = false;
    document.getElementById('regFacePreview').innerHTML = '';
    const regFaceStatus = document.getElementById('regFaceStatus');
    regFaceStatus.innerHTML = '<span class="text-info">请对准脸部</span>';
    autoDetectFaceForRegister();
}

/**
 * 捕获人脸并识别（保留此函数以支持手动触发）
 */
function captureFace() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const facePreview = document.getElementById('facePreview');
    const faceStatus = document.getElementById('faceStatus');
    
    if (!video.videoWidth) {
        faceStatus.innerHTML = '<span class="text-danger">摄像头尚未就绪</span>';
        return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const base64Image = imageData.split(',')[1];
    
    facePreview.innerHTML = '<img src="' + imageData + '" alt="captured" style="max-width:100%;border-radius:5px;">';
    
    doFaceLogin(base64Image);
}

/**
 * 捕获人脸用于注册（保留此函数以支持手动触发）
 */
function captureFaceForRegister() {
    const video = document.getElementById('regVideo');
    const canvas = document.getElementById('regCanvas');
    const regFacePreview = document.getElementById('regFacePreview');
    const regFaceStatus = document.getElementById('regFaceStatus');
    
    const account = $('#regAccount').val().trim();
    if (!account) {
        regFaceStatus.innerHTML = '<span class="text-danger">请先输入账号</span>';
        return;
    }
    
    if (!video.videoWidth) {
        regFaceStatus.innerHTML = '<span class="text-danger">摄像头尚未就绪</span>';
        return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const base64Image = imageData.split(',')[1];
    
    regFacePreview.innerHTML = '<img src="' + imageData + '" alt="captured" style="max-width:100%;border-radius:5px;">';
    
    doFaceRegister(base64Image, account);
}

/**
 * 执行人脸识别登录
 */
function doFaceLogin(faceBase64, callback) {
    const faceStatus = document.getElementById('faceStatus');
    
    console.log("=== 开始人脸登录 ===");
    
    const requestData = {
        faceImageBase64: faceBase64,
        operator: 'face-login',
        requestId: genUuid(),
        userType: currentFaceLoginType
    };
    
    $.ajax({
        url: '/face/login',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            console.log("<<< 收到登录响应:", response);
            
            // 修改判断条件：检查 code 是否为 '0000' 或 responseCode 是否为 'SUCCESS'
            if (response.code === '0000' || response.responseCode === 'SUCCESS') {
                // 识别成功，停止自动检测
                if (faceDetectionInterval) {
                    clearInterval(faceDetectionInterval);
                    faceDetectionInterval = null;
                }
                
                faceStatus.innerHTML = '<span class="text-success"><i class="fa fa-check"></i> 识别成功！正在跳转...</span>';
                
                localStorage.setItem("account", response.account);
                localStorage.setItem("type", response.type);
                
                console.log("✅ 登录成功，准备跳转：account=", response.account, ", type=", response.type);
                
                setTimeout(function() {
                    $('#faceLoginModal').modal('hide');
                    window.location.href = 'index.html';
                }, 1000);
                
                if (callback) callback(true, 'success');
            } else {
                let message = response.message || response.info || '人脸识别失败';
                console.error("人脸识别失败原因:", message);
                
                // 显示详细的错误信息
                let errorMessage = message;
                if (message.includes('QPS') || message.includes('繁忙')) {
                    errorMessage = '系统繁忙，请稍后再试（访问过于频繁）';
                } else if (message.includes('未找到')) {
                    errorMessage = '未找到匹配的账户，请先注册';
                } else if (message.includes('相似度')) {
                    errorMessage = '人脸相似度不足，请确认是否本人';
                }
                
                faceStatus.innerHTML = '<span class="text-danger"><i class="fa fa-times"></i> ' + errorMessage + '</span>';
                
                setTimeout(function() {
                    document.getElementById('facePreview').innerHTML = '';
                    faceStatus.innerHTML = '<span class="text-info">请重新拍照</span>';
                }, 2000);
                
                if (callback) callback(false, message);
            }
        },
        error: function(xhr, status, error) {
            faceStatus.innerHTML = '<span class="text-danger"><i class="fa fa-times"></i> 网络错误</span>';
            console.error("人脸登录 HTTP 错误:", error);
            console.error("XHR 状态:", xhr.status);
            console.error("响应内容:", xhr.responseText);
            
            if (callback) callback(false, error);
        },
        complete: function() {
            isProcessing = false;
        }
    });
}

/**
 * 执行人脸注册
 */
function doFaceRegister(faceBase64, account) {
    const regFaceStatus = document.getElementById('regFaceStatus');
    
    console.log("开始执行人脸注册，账号:", account);
    
    regFaceStatus.innerHTML = '<span class="text-warning"><i class="fa fa-spinner fa-spin"></i> 正在注册人脸...</span>';
    
    const requestData = {
        faceImageBase64: faceBase64,
        account: account,
        userType: currentFaceRegType
    };
    
    console.log("发送人脸注册请求:", requestData);
    
    $.ajax({
        url: '/face/register',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            console.log("人脸注册响应:", response);
            if (response.success) {
                regFaceStatus.innerHTML = '<span class="text-success"><i class="fa fa-check"></i> 注册成功！</span>';
                
                // 注册成功后，自动填充登录表单并提示用户
                setTimeout(function() {
                    $('#faceRegisterModal').modal('hide');
                    
                    // 自动填充账号到登录表单
                    $('#account').val(account);
                    
                    // 根据注册的用户类型，选择对应的登录类型
                    $('input[name="type"][value="' + currentFaceRegType + '"]').prop('checked', true);
                    
                    swal({
                        title: "注册成功",
                        text: "人脸信息已成功注册！账号已自动填充到登录框，请使用人脸识别登录。",
                        type: "success",
                        confirmButtonText: "好的"
                    }, function() {
                        // 自动打开人脸识别登录
                        setTimeout(function() {
                            showFaceLogin();
                        }, 500);
                    });
                }, 1000);
            } else {
                let message = response.message || '人脸注册失败';
                console.error("人脸注册失败原因:", message);
                
                // 显示更详细的错误提示
                let errorMessage = message;
                if (message.includes('用户已存在')) {
                    errorMessage = '该账号已注册人脸，如需更新请先删除原人脸信息';
                } else if (message.includes('用户组未创建')) {
                    errorMessage = '用户组未创建，请联系管理员在百度 AI 控制台创建用户组';
                } else if (message.includes('图片质量')) {
                    errorMessage = '图片质量不佳，请调整光线和角度后重试';
                }
                
                regFaceStatus.innerHTML = '<span class="text-danger"><i class="fa fa-times"></i> ' + errorMessage + '</span>';
                
                setTimeout(function() {
                    document.getElementById('regFacePreview').innerHTML = '';
                    regFaceStatus.innerHTML = '<span class="text-info">请重新拍照</span>';
                }, 5000);
            }
        },
        error: function(xhr, status, error) {
            regFaceStatus.innerHTML = '<span class="text-danger"><i class="fa fa-times"></i> 网络错误</span>';
            console.error("人脸注册 HTTP 错误:", error);
            console.error("XHR 状态:", xhr.status, xhr.responseText);
            console.error("响应内容:", xhr.responseText);
        }
    });
}

/**
 * 停止摄像头
 */
function stopCamera() {
    const video = document.getElementById('video');
    if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}

/**
 * 停止注册摄像头
 */
function stopRegCamera() {
    const video = document.getElementById('regVideo');
    if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}

// 监听模态框关闭
$('#faceLoginModal').on('hidden.bs.modal', function () {
    stopCamera();
});

$('#faceRegisterModal').on('hidden.bs.modal', function () {
    stopRegCamera();
});

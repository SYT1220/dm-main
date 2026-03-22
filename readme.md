该项目是一个基于Spring Boot的宿舍管理系统（Dormitory Management），以下是其运行环境、依赖和启动方式的说明：

运行环境：
- Java版本：1.8
- 数据库：MySQL，服务地址为localhost:3306，数据库名为dm
- 服务器端口：8080

主要依赖：
- Spring Boot Starter Web：用于构建Web应用
- Spring Data JPA：用于数据访问层操作
- MySQL Connector：连接MySQL数据库
- HikariCP：数据库连接池
- Fastjson：JSON处理
- 百度AI人脸识别SDK：用于实现人脸识别功能
- jxl：用于Excel文件的导入导出

配置信息：
- 数据库连接参数在application.yml中配置，包括URL、用户名（root）和密码（123456）
- 系统初始化SQL脚本（init.sql）会在项目启动时自动执行，用于创建数据库表结构并插入初始数据
- 百度AI人脸识别服务的相关配置（如app-id、api-key等）也在application.yml中定义

启动方式：
1. 确保已安装Java 8和MySQL数据库，并启动MySQL服务
2. 在MySQL中创建名为dm的数据库
3. 将项目导入开发环境（如IntelliJ IDEA）
4. 执行mvn compile进行编译
5. 运行DmApplication类中的main方法启动应用
6. 应用启动后，默认可通过http://localhost:8080访问系统

系统内置了管理员账号（admin/admin）和若干测试数据，可用于验证功能。前端页面位于static目录下，包含登录页、主界面等。
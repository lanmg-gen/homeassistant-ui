@echo off
chcp 65001 >nul
echo ========================================
echo 同步代码到 GitHub 仓库
echo ========================================
echo.

REM 检查 Git 是否已安装
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Git 未安装！
    echo 请先安装 Git: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/6] Git 已安装
echo.

REM 初始化仓库（如果还没初始化）
if not exist .git (
    echo [2/6] 初始化 Git 仓库...
    git init
    if %errorlevel% neq 0 (
        echo [错误] 初始化仓库失败
        pause
        exit /b 1
    )
) else (
    echo [2/6] Git 仓库已存在，跳过初始化
)
echo.

REM 检查是否有远程仓库
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [3/6] 需要添加远程仓库
    echo 请输入你的 GitHub 仓库地址（例如：https://github.com/username/repo.git）:
    set /p REMOTE_URL=

    if "%REMOTE_URL%"=="" (
        echo [错误] 仓库地址不能为空
        pause
        exit /b 1
    )

    git remote add origin %REMOTE_URL%
) else (
    echo [3/6] 远程仓库已配置
)
echo.

REM 添加所有文件
echo [4/6] 添加文件到暂存区...
git add .
if %errorlevel% neq 0 (
    echo [错误] 添加文件失败
    pause
    exit /b 1
)
echo.

REM 检查是否有更改
git diff --cached --quiet >nul 2>&1
if %errorlevel% equ 0 (
    echo [信息] 没有新的更改需要提交
    echo.
    echo [可选] 是否仍要强制推送到远程仓库？(Y/N)
    set /p FORCE_PUSH=
    if /i not "%FORCE_PUSH%"=="Y" (
        pause
        exit /b 0
    )
) else (
    echo 检测到更改：
    git status --short
)
echo.

REM 提交更改
echo [5/6] 提交更改...
echo 请输入提交信息（默认：添加冰箱温度显示卡片和3D模型缩放功能）:
set /p COMMIT_MSG=
if "%COMMIT_MSG%"=="" set COMMIT_MSG=添加冰箱温度显示卡片和3D模型缩放功能

git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo [错误] 提交失败
    pause
    exit /b 1
)
echo.

REM 推送到远程仓库
echo [6/6] 推送到 GitHub...
git branch -M main >nul 2>&1
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo [错误] 推送失败
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. 仓库地址错误
    echo 3. 认证失败（需要 Personal Access Token）
    echo.
    echo 解决方法：
    echo 1. 检查网络连接
    echo 2. 验证仓库地址是否正确
    echo 3. 在 GitHub 设置中创建 Personal Access Token：
    echo    https://github.com/settings/tokens
    echo    权限勾选：repo（完整的仓库访问权限）
    echo.
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✓ 同步完成！
echo ========================================
echo.
pause

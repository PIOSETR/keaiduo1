#!/bin/bash
# ===========================================================
#  喵喵听写 一键构建 APK 脚本
#  用法: bash build-apk.sh
#  需要: Java 8+ 和 Android SDK (platforms/android-34, build-tools/34.0.0)
# ===========================================================
set -e
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PROJ="$(cd "$(dirname "$0")" && pwd)"
export BUILD_TOOLS="$ANDROID_HOME/build-tools/34.0.0"
export PLATFORM="$ANDROID_HOME/platforms/android-34"
export ANDROID_JAR="$PLATFORM/android.jar"

if [ ! -f "$ANDROID_JAR" ]; then
  echo "❌ 请先安装 Android SDK 34: sdkmanager \"platforms;android-34\" \"build-tools;34.0.0\""
  exit 1
fi

echo "=== 1. 准备资源 ==="
rm -rf "$PROJ/build" "$PROJ/res/mipmap"
mkdir -p "$PROJ/build"
# 图标 - 直接用 icon-192.png 做所有密度
for dir in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  mkdir -p "$PROJ/res/$dir"
  cp "$PROJ/../icon-192.png" "$PROJ/res/$dir/ic_launcher.png"
done

echo "=== 2. 编译 Android 资源 ==="
"$BUILD_TOOLS/aapt2" compile --dir "$PROJ/res" -o "$PROJ/build/res.zip" 2>&1

echo "=== 3. 链接 APK（含资产目录）==="
"$BUILD_TOOLS/aapt2" link \
  -o "$PROJ/build/unsigned.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$PROJ/AndroidManifest.xml" \
  -A "$PROJ/assets" \
  --auto-add-overlay \
  "$PROJ/build/res.zip" 2>&1

echo "=== 4. 编译 Java ==="
mkdir -p "$PROJ/build/classes"
javac -source 8 -target 8 -bootclasspath "$ANDROID_JAR" \
  -d "$PROJ/build/classes" \
  "$PROJ/src/com/meow/dictate/MainActivity.java" 2>&1

echo "=== 5. 转换为 DEX ==="
"$BUILD_TOOLS/d8" --lib "$ANDROID_JAR" \
  --output "$PROJ/build" \
  "$PROJ/build/classes/com/meow/dictate/MainActivity.class" 2>&1

echo "=== 6. 添加 DEX 到 APK ==="
cd "$PROJ/build"
zip -q unsigned.apk classes.dex
cd "$PROJ"

echo "=== 7. 对齐 ==="
"$BUILD_TOOLS/zipalign" -f 4 "$PROJ/build/unsigned.apk" "$PROJ/build/aligned.apk" 2>&1

echo "=== 8. 签名 ==="
"$BUILD_TOOLS/apksigner" sign \
  --ks "$PROJ/debug.keystore" \
  --ks-key-alias androiddebugkey \
  --ks-pass pass:android \
  --key-pass pass:android \
  --min-sdk-version 21 \
  --out "$PROJ/build/meow-dictate.apk" \
  "$PROJ/build/aligned.apk" 2>&1

echo ""
echo "========================================"
echo "  ✅ APK 构建完成！"
ls -lh "$PROJ/build/meow-dictate.apk"
echo "========================================"
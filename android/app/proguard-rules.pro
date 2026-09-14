# 프로젝트용 R8/ProGuard 규칙.
# Capacitor 플러그인 keep은 `@capacitor/android` consumer rules가 담당한다.

# Play Console / Firebase 크래시 스택을 mapping.txt로 되돌릴 때 필요
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

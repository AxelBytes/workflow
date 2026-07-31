# Eclipse App — ProGuard Rules
# Mantiene React Native funcionando mientras ofusca todo lo demás

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.swmansion.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Google Sign-In
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# Expo modules
-keep class expo.modules.** { *; }
-keep class host.exp.exponent.** { *; }

# La app Eclipse — ofuscar todo lo demás
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# Remover logs en producción
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

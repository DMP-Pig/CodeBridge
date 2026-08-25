import java.io.File

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.phonetopc.copycode"
    compileSdk = 36
    buildToolsVersion = "36.1.0"

    defaultConfig {
        applicationId = "com.phonetopc.copycode"
        minSdk = 26
        targetSdk = 36
        versionCode = 11
        versionName = "1.0.3beta"
    }

    signingConfigs {
        // Local release signing: credentials injected via env vars (never committed).
        // When env vars are absent, the release build is unsigned (CI/debug unaffected).
        val keystoreFile = System.getenv("CODEBRIDGE_KEYSTORE")?.let { File(it) }?.takeIf { it.exists() }
        if (keystoreFile != null && System.getenv("CODEBRIDGE_KEYSTORE_PASS") != null) {
            create("release") {
                storeFile = keystoreFile
                storePassword = System.getenv("CODEBRIDGE_KEYSTORE_PASS")
                keyAlias = System.getenv("CODEBRIDGE_KEY_ALIAS") ?: "phonetopc"
                keyPassword = System.getenv("CODEBRIDGE_KEY_PASS") ?: System.getenv("CODEBRIDGE_KEYSTORE_PASS")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.findByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.zxing.android.embedded)
    debugImplementation(libs.androidx.ui.tooling)
}


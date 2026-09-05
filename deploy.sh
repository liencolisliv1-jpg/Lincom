#!/bin/bash

set -euo pipefail

echo "🔄 Vérification des appareils connectés..."
if ! adb devices | awk 'NF && $2 == "device" { found = 1 } END { exit found ? 0 : 1 }'; then
    echo "❌ Erreur : Aucun appareil ou émulateur Android détecté. Connectez un appareil et réessayez."
    exit 1
fi

echo "🧹 Nettoyage du projet Gradle..."
cd android
./gradlew clean

echo "🏗️ Compilation de l'APK Debug..."
./gradlew assembleDebug

echo "📲 Installation de l'APK sur l'appareil..."
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    adb install -r "$APK_PATH"
    echo "🎉 Application installée avec succès !"
else
    echo "❌ Erreur : Le fichier APK est introuvable à l'emplacement $APK_PATH."
    exit 1
fi

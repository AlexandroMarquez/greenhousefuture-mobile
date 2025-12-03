🌱 GreenhouseFuture Mobile

Aplicación móvil desarrollada con Expo + React Native, diseñada para monitorear en tiempo real las métricas ambientales del invernadero inteligente Greenhouse Future, consumiendo datos desde Firebase Realtime Database.

🚀 Funcionalidades actuales

Lectura en tiempo real de:

🌡️ Temperatura del aire

💧 Humedad relativa

🌱 Humedad del suelo

🚰 Nivel del tanque de agua

💡 Luz ambiental

Renderización estilo dashboard, optimizado para uso móvil.

Vista completa del JSON de métricas (modo debug).

Auto-refresh cada 5 segundos.

Indicadores visuales (badges) según estado de los sensores.

App construida pensando en multiplataforma (iOS/Android).

🛠️ Tecnologías utilizadas

Expo SDK 54

React Native

TypeScript

Firebase Realtime Database

JavaScript Fetch API para polling de métricas

Expo Router para navegación (tabs / screens)

📦 Scripts básicos
npm install
npx expo start


npx expo start permite abrir la app en:

Expo Go (iOS/Android)

Web

Emuladores locales

📁 Estructura principal del proyecto
greenhousefuture-mobile/
  ├── app/
  │    ├── (tabs)/
  │    │     ├── index.tsx   # Dashboard principal
  │    ├── explore.tsx
  ├── assets/
  ├── components/
  ├── hooks/
  ├── constants/
  ├── .expo/
  ├── .gitignore
  ├── app.json
  ├── package.json
  └── README.md

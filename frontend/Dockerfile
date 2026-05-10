FROM node:20-alpine
WORKDIR /app

# Копируем manifest для кэширования зависимостей
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Открываем порт Vite
EXPOSE 3000

# Запускаем Vite dev server с доступом извне контейнера
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
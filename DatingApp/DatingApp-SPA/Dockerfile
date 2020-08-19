# Angular 10 needs a Node with the older OpenSSL behaviour; 16 is the last that
# has it by default.
FROM node:16-bullseye AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# The committed package-lock.json is out of sync with package.json, so `npm ci`
# refuses it. The versions that matter are pinned exactly in package.json.
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . .
RUN npx ng build --prod || npx ng build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/DatingApp-SPA /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

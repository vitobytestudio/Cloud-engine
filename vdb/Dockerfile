# عقدة الإمبراطورية — أي سيرفر نملكه يشغلها بأمر واحد
FROM node:22-alpine
WORKDIR /vdb
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY src ./src
COPY server ./server
RUN npx esbuild server/bundle-entry.ts --bundle --format=esm --platform=node --charset=utf8 --outfile=server/vdb.bundle.mjs
EXPOSE 8490
VOLUME /vdb/server/data
CMD ["node", "server/node.mjs", "--port", "8490", "--data", "/vdb/server/data", "--token", "change-me"]

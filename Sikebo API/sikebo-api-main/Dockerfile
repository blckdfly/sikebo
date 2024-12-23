# Menggunakan Node.js versi terbaru sebagai base image
FROM node:18

# Tentukan direktori kerja dalam container
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json ke direktori kerja
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh source code ke dalam container
COPY . .

# Expose port 3000 (atau port yang digunakan aplikasi Anda)
EXPOSE 3000

# Perintah default untuk menjalankan aplikasi
CMD ["npm", "start"]
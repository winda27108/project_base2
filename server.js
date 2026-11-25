console.log("=== SERVER REKAYASA API KELOMPOK 4 ===");
console.log("Anggota:");
console.log("1. Winda Tessalonika       F5512520088");
console.log("2. Trifena Paembonan       F5512520090");
console.log("3. Muhammad Andi Ishak     F5512530105");
console.log("4. Dian Abdillah Melosovic F5512530112");
console.log("5. Habibi                  F5512530113");
console.log("====================================");

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const config = require('./src/config');

const API_KEY = config.openWeatherKey;
const FILE_PATH = path.join(__dirname, 'events.json');

// Inisialisasi file JSON jika belum ada
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
}

// Helper untuk membaca file JSON
function readData() {
  const raw = fs.readFileSync(FILE_PATH);
  return JSON.parse(raw);
}

// Helper untuk menulis file JSON
function writeData(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// Fungsi memanggil OpenWeather API dari Server
function fetchWeather(city) {
  return new Promise((resolve, reject) => {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${config.OPENWEATHER_KEY}&units=metric`;
    
    http.get(weatherUrl, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(body);
          resolve({
            temp: parsed.main.temp,
            condition: parsed.weather[0].description,
            humidity: parsed.main.humidity
          });
        } else {
          reject(new Error('Kota tidak ditemukan pada OpenWeather API'));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

// Server Utama
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Header Response JSON
  res.setHeader('Content-Type', 'application/json');

  // --- 1. GET /events (Read All atau Read by ID) ---
  if (pathname === '/events' && method === 'GET') {
    const events = readData();
    const id = parsedUrl.query.id;

    if (id) {
      const event = events.find(e => e.id === parseInt(id));
      if (!event) {
        res.writeHead(404);
        return res.end(JSON.stringify({ message: "Event tidak ditemukan" }));
      }
      res.writeHead(200);
      return res.end(JSON.stringify(event));
    }

    res.writeHead(200);
    return res.end(JSON.stringify(events));
  }

  // --- 2. POST /events (Create + Integrasi OpenWeather) ---
  if (pathname === '/events' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);

        // Validasi Sederhana
        if (!payload.nama_event || !payload.lokasi_kota || !payload.tanggal) {
          res.writeHead(400);
          return res.end(JSON.stringify({ message: "Data input tidak lengkap" }));
        }

        // Ambil Cuaca dari OpenWeather API
        const weatherData = await fetchWeather(payload.lokasi_kota);

        const events = readData();
        const newEvent = {
          id: Date.now(),
          nama_event: payload.nama_event,
          lokasi_kota: payload.lokasi_kota,
          tanggal: payload.tanggal,
          cuaca: weatherData,
          rekomendasi: weatherData.condition.includes('rain') 
            ? "Siapkan jas hujan/payung!" 
            : "Cuaca mendukung untuk kegiatan outdoor."
        };

        events.push(newEvent);
        writeData(events);

        res.writeHead(201);
        return res.end(JSON.stringify(newEvent));
      } catch (err) {
        res.writeHead(404);
        return res.end(JSON.stringify({ message: err.message }));
      }
    });
    return;
  }

  // --- 3. DELETE /events?id=... (Delete) ---
  if (pathname === '/events' && method === 'DELETE') {
    const id = parsedUrl.query.id;
    if (!id) {
      res.writeHead(400);
      return res.end(JSON.stringify({ message: "Parameter ID dibutuhkan" }));
    }

    let events = readData();
    const filteredEvents = events.filter(e => e.id !== parseInt(id));

    if (events.length === filteredEvents.length) {
      res.writeHead(404);
      return res.end(JSON.stringify({ message: "Event tidak ditemukan" }));
    }

    writeData(filteredEvents);
    res.writeHead(200);
    return res.end(JSON.stringify({ message: "Event berhasil dihapus" }));
  }

  // Route Tidak Ditemukan
  res.writeHead(404);
  res.end(JSON.stringify({ message: "Endpoint tidak ditemukan" }));
});

server.listen(config.PORT, () => {
  console.log(`Server berjalan di http://localhost:${config.PORT}`);
});
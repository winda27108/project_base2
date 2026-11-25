const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function showMenu() {
  console.log('\n====================================');
  console.log('      CLIENT CONSOLE - EVENT PLANNER');
  console.log('====================================');
  console.log('1. Lihat Semua Acara');
  console.log('2. Tambah Acara Baru');
  console.log('3. Hapus Acara');
  console.log('4. Keluar');

  rl.question('Pilih menu (1-4): ', async (answer) => {
    switch (answer.trim()) {
      case '1':
        await getEvents();
        break;
      case '2':
        await addEvent();
        break;
      case '3':
        await deleteEvent();
        break;
      case '4':
        console.log('Terima kasih!');
        rl.close();
        return;
      default:
        console.log('Pilihan tidak valid.');
    }
    showMenu();
  });
}

async function getEvents() {
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/events',
      method: 'GET'
    });
    console.log('\n--- Daftar Acara ---');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Gagal mengambil data:', err.message);
  }
}

async function addEvent() {
  return new Promise((resolve) => {
    rl.question('Nama Acara: ', (nama) => {
      rl.question('Lokasi Kota: ', (kota) => {
        rl.question('Tanggal (YYYY-MM-DD): ', async (tanggal) => {
          try {
            const res = await request({
              hostname: 'localhost',
              port: 3000,
              path: '/events',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }, { nama_event: nama, lokasi_kota: kota, tanggal });

            if (res.status === 201) {
              console.log('\n[BERHASIL] Acara berhasil ditambahkan!');
              console.log(JSON.stringify(res.data, null, 2));
            } else {
              console.log(`\n[GAGAL ${res.status}] ${res.data.message}`);
            }
          } catch (err) {
            console.error('Error:', err.message);
          }
          resolve();
        });
      });
    });
  });
}

async function deleteEvent() {
  return new Promise((resolve) => {
    rl.question('Masukkan ID Acara yang ingin dihapus: ', async (id) => {
      try {
        const res = await request({
          hostname: 'localhost',
          port: 3000,
          path: `/events?id=${id}`,
          method: 'DELETE'
        });

        if (res.status === 200) {
          console.log('\n[BERHASIL]', res.data.message);
        } else {
          console.log(`\n[GAGAL ${res.status}] ${res.data.message}`);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
      resolve();
    });
  });
}

// Jalankan Client
showMenu();
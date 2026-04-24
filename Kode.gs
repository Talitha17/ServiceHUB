function doGet(e) {
  var page = "index";

  if (e && e.parameter && e.parameter.page) {
    page = e.parameter.page;
  }

  var template = HtmlService.createTemplateFromFile(page);

  template.title = "Formulir Pengaduan";
  template.pageActive = page;
  template.webAppUrl = ScriptApp.getService().getUrl();

Logger.log(Session.getActiveUser().getEmail());

  return template.evaluate()
    .setTitle('ServiceHUB')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getKategori() {
  var ss = SpreadsheetApp.openById('1LQ06k3Z2g9ibUDnWl9eh_Cvq6LEQfFAOt8SXyJq9YxQ');
  var sheet = ss.getSheetByName('Kategori');

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 2, lastRow - 1, 1).getValues();

  return data.flat();
}

function simpanLaporan(dataObject) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Laporan");
    if (!sheet) {
      throw new Error("Sheet dengan nama 'Laporan' tidak ditemukan di Spreadsheet.");
    }

    var lampiranEmail = [];
    var keteranganFile = "Tidak ada file yang dilampirkan";
    var idUnik = Utilities.getUuid();

    // 1. Olah file jika ada (tapi tidak di simpan ke Drive)
    if (dataObject.fileData && dataObject.fileData !== "") {
      var base64Data = dataObject.fileData.split(',')[1];
      var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), dataObject.mimeType, dataObject.fileName);
      
      // Masukkan file ke dalam keranjang lampiran email
      lampiranEmail.push(blob);
      keteranganFile = dataObject.fileName;
    }

    // 2. Tulis data ke baris paling bawah Spreadsheet sebagai record
    sheet.appendRow([
      idUnik,
      new Date(),
      dataObject.nama,
      dataObject.whatsapp,
      dataObject.lokasi,
      dataObject.bagian,
      dataObject.kategori,
      dataObject.deskripsi,
      keteranganFile
    ]);

 
    var emailAdmin = "damanuelkevin@gmail.com"; 
    
    var subjekEmail = "Laporan Service Baru - " + dataObject.nama;
    var isiPesan = "Halo Admin, ada laporan service baru yang masuk:\n\n" +
                   "Nama: " + dataObject.nama + "\n" +
                   "WhatsApp: " + dataObject.whatsapp + "\n" +
                   "Lokasi: " + dataObject.lokasi + "\n" +
                   "Bagian: " + dataObject.bagian + "\n" +
                   "Kategori: " + dataObject.kategori + "\n" +
                   "Deskripsi: " + dataObject.deskripsi + "\n\n" +
                   "Cek lampiran email ini untuk melihat bukti fotonya.";

    // 4. Mengeksekusi pengiriman Email beserta File Lampiran
    if (lampiranEmail.length > 0) {
      MailApp.sendEmail({
        to: emailAdmin,
        subject: subjekEmail,
        body: isiPesan,
        attachments: lampiranEmail
      });
    } else { // Jika dikirim tanpa file
      MailApp.sendEmail({
        to: emailAdmin,
        subject: subjekEmail,
        body: isiPesan
      });
    }

    return {
      status: "success",
      message: "Data berhasil disimpan dan laporan telah terkirim ke Email Admin!"
    };

  } catch (error) {
    return {
      status: "error",
      message: "Gagal menyimpan/mengirim email: " + error.message
    };
  }
}


function getDataLaporan() {
  var ss = SpreadsheetApp.openById('1LQ06k3Z2g9ibUDnWl9eh_Cvq6LEQfFAOt8SXyJq9YxQ');
  var sheet = ss.getSheetByName('Progress');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 1) {
    return [];
  }

  // Ambil semua data tabel mulai baris ke-2
  var data = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();

  // Buang baris kosong
  data = data.filter(function(row) {
    return row.join('').trim() !== '';
  });

  return data;
}

function getDataAdmin() {
  var ss = SpreadsheetApp.openById('1LQ06k3Z2g9ibUDnWl9eh_Cvq6LEQfFAOt8SXyJq9YxQ');
  var sheet = ss.getSheetByName('Admin');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 1) {
    return [];
  }

  // Ambil semua data tabel mulai baris ke-2
  var data = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();

  // Buang baris kosong
  data = data.filter(function(row) {
    return row.join('').trim() !== '';
  });

  return data;
}

function paksaIzinMurni() {
  var pancingAkses = DriveApp.getFiles();
  // Pancingan memanggil MailApp langsung agar Google meminta otorisasi
  MailApp.sendEmail("damanuelkevin@gmail.com", "Mancing Izin", "Abaikan");
  Logger.log("Akses Drive & Email Berhasil Diberikan!");
}


// Tambahkan fungsi ini di Code.gs
function renderFileHTML(namaFifenya) {
  try {
    // Misalnya namaFifenya = 'form', maka ia merender file form.html
    return HtmlService.createTemplateFromFile(namaFifenya).evaluate().getContent();
  } catch (err) {
    return "<h2>Terjadi Kesalahan: File " + namaFifenya + " tidak ditemukan.</h2>";
  }
}

function updateStatusAdmin(idLaporan, statusBaru, keteranganBaru) {
var ss = SpreadsheetApp.openById('1LQ06k3Z2g9ibUDnWl9eh_Cvq6LEQfFAOt8SXyJq9YxQ');
var sheet = ss.getSheetByName('Admin');
var data = sheet.getDataRange().getValues();

for(var i = 1; i < data.length; i++) {
  if (data[i][0] == idLaporan) {
    sheet.getRange(i + 1, 3).setValue(statusBaru);

    sheet.getRange(i + 1, 4).setValue(keteranganBaru);

    return true;
  }
}
throw new Error("ID Laporan tidak ditemukan di sheet Admin.");
}

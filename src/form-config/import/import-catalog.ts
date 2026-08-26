import type { FormFieldCatalogItem, FormStepCatalogItem } from "../shared/types";

type InputType = NonNullable<FormFieldCatalogItem["inputType"]>;
type FieldSeed = [
  id: string,
  label: string,
  inputType?: InputType,
  required?: boolean,
  documentTypes?: string[],
  groupId?: string,
  defaultValue?: string,
  readOnly?: boolean,
  condition?: string,
  options?: Array<{ label: string; value: string }>,
];

const ALL_CUSTOMS_DOCS = ["BC16", "BC20", "BC23", "FTZ01", "KEK_IN"];
const CUSTOMS_NO_KEK = ["BC16", "BC20", "BC23", "FTZ01"];
const field = (...items: FieldSeed[]): FormFieldCatalogItem[] => items.map((item) => ({
  id: item[0], label: item[1], inputType: item[2] ?? "text", required: item[3] ?? false,
  documentTypes: item[4], groupId: item[5], defaultValue: item[6], readOnly: item[7], condition: item[8], options: item[9],
}));

const importirPengusahaFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["NITKU", "NITKU", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["NIB", "NIB", "text", true, ["BC20", "BC23", "KEK_IN"]],
  ["Jenis API", "Jenis API", "select", true, ["BC20", "KEK_IN"]],
  ["Status", "Status", "select", true, CUSTOMS_NO_KEK],
  ["Nomor Izin PLB", "Nomor Izin PLB", "text", false, ["BC16"]],
  ["Tanggal Izin PLB", "Tanggal Izin PLB", "date", false, ["BC16"]],
  ["Nomor Izin TPB", "Nomor Izin TPB", "text", false, ["BC23"]],
  ["Tanggal Izin TPB", "Tanggal Izin TPB", "date", false, ["BC23"]],
  ["Pelaku Usaha", "Pelaku Usaha", "text", true, ["KEK_IN"]],
  ["Nomor API", "Nomor API", "text", true, ["KEK_IN"]],
);

const npwpPemusatanFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
);

const pemilikBarangFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Afiliasi", "Kode Afiliasi", "select", true, ["BC20", "FTZ01"]],
  ["NITKU", "NITKU", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Negara", "Kode Negara", "select", true, ALL_CUSTOMS_DOCS],
);

const penjualFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Negara", "Kode Negara", "select", true, ALL_CUSTOMS_DOCS],
);

const pengirimFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Negara", "Kode Negara", "select", true, ALL_CUSTOMS_DOCS],
);

const pemasokFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Negara", "Kode Negara", "select", true, ALL_CUSTOMS_DOCS],
);

const ppjkFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["NITKU", "NITKU", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Tanggal NP", "Tanggal NP", "date", false, ["KEK_IN"]],
  ["NP PPJK", "NP PPJK", "text", false, ["KEK_IN"]],
);

const penerimaFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["NITKU", "NITKU", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Negara", "Kode Negara", "select", true, ALL_CUSTOMS_DOCS],
  ["Status", "Status", "select", true, CUSTOMS_NO_KEK],
  ["Izin Badan Pengusaha", "Izin Badan Pengusaha", "text", false, ["FTZ01"]],
);

const pembeliFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Negara", "Kode Negara", "select", true, ALL_CUSTOMS_DOCS],
);

const eksportirKekFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Kode Negara", "Kode Negara", "select", true, ALL_CUSTOMS_DOCS],
);

const vendorKekFields = field(
  ["Jenis Identitas", "Jenis Identitas", "text", true, ALL_CUSTOMS_DOCS],
  ["NITKU", "NITKU", "text", true, ALL_CUSTOMS_DOCS],
  ["Nama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
  ["Alamat", "Alamat", "text", true, ALL_CUSTOMS_DOCS],
  ["Telepon", "Telepon", "text", false, ["KEK_IN"]],
  ["Email", "Email", "text", false, ["KEK_IN"]],
);

const karantinaHeaderGroups = [
  { id: "kantor-karantina", label: "Kantor Karantina" },
  { id: "informasi-tujuan", label: "Informasi Tujuan" },
  { id: "informasi-impor", label: "Informasi Impor" },
  { id: "pengangkut", label: "Pengangkut" },
  { id: "pemeriksaan-karantina", label: "Pemeriksaan Karantina" },
  { id: "instalasi-karantina", label: "Instalasi Karantina" },
];

const karantinaHeaderFields = (jenis: string) => field(
  ["kantorKarantina", `Kantor Karantina ${jenis}`, "select", true, undefined, "kantor-karantina"],
  ["uptImpor", "UPT Impor", "select", false, undefined, "kantor-karantina"],
  ["tujuanImpor", "Tujuan Impor", "select", false, undefined, "informasi-tujuan"],
  ["daerahTujuan", "Daerah Tujuan", "select", true, undefined, "informasi-tujuan"],
  ["tingkatPengolahan", "Tingkat Pengolahan", "select", false, undefined, "informasi-impor"],
  ["peruntukan", "Peruntukan", "select", true, undefined, "informasi-impor"],
  ["caraPengangkutan", "Cara Pengangkutan", "select", false, undefined, "pengangkut"],
  ["namaSaranaAngkut", "Nama Sarana Angkut", "text", false, undefined, "pengangkut"],
  ["nomorVoyFlightNopol", "Nomor Voy/Flight/Nopol", "text", false, undefined, "pengangkut"],
  ["bendera", "Bendera", "select", false, undefined, "pengangkut"],
  ["lokasiPemeriksa", "Lokasi Pemeriksa", "select", false, undefined, "pemeriksaan-karantina"],
  ["tanggalPemeriksa", "Tanggal Pemeriksa", "date", false, undefined, "pemeriksaan-karantina"],
  ["alamatPemeriksaan", "Alamat", "textarea", false, undefined, "pemeriksaan-karantina"],
  ["lokasiInstalasi", "Lokasi Pemeriksa", "text", false, undefined, "instalasi-karantina"],
  ["jenisTempat", "Jenis Tempat", "select", false, undefined, "instalasi-karantina"],
  ["nomorRegistrasi", "Nomor Registrasi", "text", false, undefined, "instalasi-karantina"],
  ["alamatInstalasi", "Alamat", "textarea", false, undefined, "instalasi-karantina"],
);

export const importFormCatalog: FormStepCatalogItem[] = [
  {
    id: "pengajuan", label: "Pengajuan", description: "Header, transaksi, pengangkutan, pelabuhan, dan penanggung jawab.",
    sections: [
      {
        id: "header-pengajuan", label: "Header Pengajuan", description: "Identitas dan informasi utama dokumen pengajuan.", fields: field(
          ["nomorPengajuan", "Nomor Pengajuan", "text", true, ALL_CUSTOMS_DOCS],
          ["tanggalPengajuan", "Tanggal Pengajuan", "date", true, ALL_CUSTOMS_DOCS],
          ["nomorPendaftaran", "Nomor Pendaftaran", "text", true, ALL_CUSTOMS_DOCS],
          ["tanggalPendaftaran", "Tanggal Pendaftaran", "date", true, ALL_CUSTOMS_DOCS],
          ["kantorPabean", "Kantor Pabean 1", "select", true, ALL_CUSTOMS_DOCS],
          ["kantorPabean2", "Kantor Pabean 2", "select", true, ["BC23", "FTZ01"]],
          ["jenisPib", "Jenis PIB", "select", true, ["BC20"]],
          ["jenisImpor", "Jenis Impor", "select", true, ["BC20"]],
          ["caraBayar", "Cara Bayar", "select", true, ["BC20"]],
          ["pelabuhanBongkar", "Pelabuhan Bongkar", "select", true, ["BC16", "BC23"]],
          ["kodeGudangPlb", "Kode Gudang PLB", "select", true, ["BC16"]],
          ["kantorPengawas", "Kantor Pengawas", "select", true, ["BC16"]],
          ["tujuan", "Tujuan", "select", true, ["BC23"]],
          ["jenisPemasukan", "Jenis Pemasukan", "select", true, ["FTZ01"]],
          ["jenisPemberitahuan", "Jenis Pemberitahuan", "select", true, ["FTZ01"]],
          ["kategoriPemasukan", "Kategori Pemasukan", "select", true, ["FTZ01"]],
          ["tujuanPemasukan", "Tujuan Pemasukan", "select", true, ["FTZ01"]],
          ["jenisTransaksiPerpajakan", "Jenis Transaksi Perpajakan", "select", true, ["FTZ01"]],
          ["jenisPpkek", "Jenis PPKEK", "select", false, ["KEK_IN"]],
          ["jenisKegiatan", "Jenis Kegiatan", "text", false, ["KEK_IN"], undefined, undefined, true],
          ["asalPemasukan", "Asal Pemasukan", "text", false, ["KEK_IN"], undefined, undefined, true],
          ["transaksiMasuk", "Transaksi Masuk", "select", false, ["KEK_IN"]],
        ),
      },
      {
        id: "transaksi", label: "Transaksi", description: "Harga, biaya lainnya, berat, dan perhitungan nilai transaksi.",
        groups: [
          { id: "harga", label: "Harga" },
          { id: "biaya-lainnya", label: "Biaya Lainnya" },
          { id: "berat", label: "Berat" },
        ],
        fields: field(
          ["valuta", "Valuta", "select", true, ALL_CUSTOMS_DOCS, "harga"],
          ["ndpbm", "NDPBM", "number", true, ALL_CUSTOMS_DOCS, "harga"],
          ["incoterm", "Incoterms", "select", true, ["BC20"], "harga"],
          ["jenisTransaksi", "Jenis Transaksi", "select", true, ALL_CUSTOMS_DOCS, "harga"],
          ["hargaBarang", "Harga Barang", "number", true, ["BC20"], "harga"],
          ["nilaiPabeanValutaAsing", "Nilai Pabean Valuta Asing", "number", true, ["BC20"], "harga"],
          ["nilaiPabeanRupiah", "Nilai Pabean dalam Rupiah", "number", true, ["BC20"], "harga"],
          ["biayaTambahan", "Biaya Tambahan", "number", false, ["BC20"], "biaya-lainnya"],
          ["biayaPengurangan", "Biaya Pengurangan", "number", false, ["BC20"], "biaya-lainnya"],
          ["freight", "Freight", "number", false, ["BC20"], "biaya-lainnya"],
          ["kodeAsuransi", "Kode Asuransi", "select", true, ["BC20"], "biaya-lainnya"],
          ["nilaiAsuransi", "Nilai Asuransi", "number", false, ["BC20"], "biaya-lainnya"],
          ["voluntaryDeclaration", "Voluntary Declaration", "number", false, ["BC20"], "biaya-lainnya"],
          ["jasaKenaPajak", "Jasa Kena Pajak", "select", false, ["BC23"], "biaya-lainnya"],
          ["volume", "Volume", "number", true, ["FTZ01"], "biaya-lainnya"],
          ["nilaiJasa", "Nilai Jasa", "number", true, ["KEK_IN"], "biaya-lainnya"],
          ["uangMuka", "Uang Muka", "number", true, ["KEK_IN"], "biaya-lainnya"],
          ["beratKotor", "Berat Kotor", "number", true, ALL_CUSTOMS_DOCS, "berat"],
          ["jenisPembagi", "Perhitungan Proporsional", "radio", true, CUSTOMS_NO_KEK, "berat", undefined, false, undefined, [{ label: "Berat", value: "Berat" }, { label: "Harga", value: "Harga" }]],
          ["beratBersih", "Berat Bersih", "number", true, ALL_CUSTOMS_DOCS, "berat"],
        ),
      },
      {
        id: "informasi-komponen-biaya", label: "Informasi Komponen Biaya", presentation: "modal", parentSectionId: "transaksi",
        documentTypes: ["BC20"],
        groups: [
          { id: "harga-dibayar", label: "Harga yang sebenarnya atau yang seharusnya dibayar" },
          { id: "biaya-penambah", label: "Biaya-biaya yang ditambahkan dan belum termasuk dalam harga barang" },
          { id: "biaya-tidak-ditambahkan", label: "Biaya-biaya yang tidak perlu ditambahkan namun sudah termasuk dalam harga barang" },
        ],
        fields: field(
          ["jenisNilai", "Jenis Nilai", "select", true, ALL_CUSTOMS_DOCS, "harga-dibayar"],
          ["incoterm", "Incoterm", "select", true, ALL_CUSTOMS_DOCS, "harga-dibayar"],
          ["ikbHargaInvoice", "Harga Barang yang Tercantum dalam Invoice", "number", true, ALL_CUSTOMS_DOCS, "harga-dibayar", "0.00"],
          ["ikbPembayaranTidakLangsung", "Pembayaran Tidak Langsung", "number", true, ALL_CUSTOMS_DOCS, "harga-dibayar", "0.00"],
          ["ikbDiskon", "Biaya Pengurang (Diskon)", "number", true, ALL_CUSTOMS_DOCS, "harga-dibayar", "0.00"],
          ["ikbKomisiPenjualan", "Komisi Penjualan dan Jasa Perantara", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbBiayaPengemasan", "Biaya Pengemasan", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbBiayaPengepakan", "Biaya Pengepakan", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbAssist", "Nilai Bantuan (Assist)", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbRoyaltiLisensi", "Royalti dan Biaya Lisensi", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbProceeds", "Proceeds", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbFreight", "Biaya Transportasi / Freight", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbPemuatan", "Biaya Pemuatan, Pembongkaran, dan Penanganan", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbAsuransi", "Asuransi", "select", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbGaransi", "Garansi", "number", true, ALL_CUSTOMS_DOCS, "biaya-penambah", "0.00"],
          ["ikbKepentinganSendiri", "Biaya untuk Kepentingan Sendiri", "number", true, ALL_CUSTOMS_DOCS, "biaya-tidak-ditambahkan", "0.00"],
          ["ikbPascaImpor", "Biaya Setelah Pengimporan Barang", "number", true, ALL_CUSTOMS_DOCS, "biaya-tidak-ditambahkan", "0.00"],
          ["ikbPajakInternal", "Biaya Pajak Internal di Negara Pengekspor", "number", true, ALL_CUSTOMS_DOCS, "biaya-tidak-ditambahkan", "0.00"],
          ["ikbBunga", "Bunga", "number", true, ALL_CUSTOMS_DOCS, "biaya-tidak-ditambahkan", "0.00"],
          ["ikbDividen", "Dividen", "number", true, ALL_CUSTOMS_DOCS, "biaya-tidak-ditambahkan", "0.00"],
        ),
      },
      {
        id: "pengangkutan", label: "Pengangkutan", description: "Informasi sarana angkut, perjalanan, dan perkiraan kedatangan.", fields: field(
          ["kodeTutupPu", "Kode Tutup PU", "select", true, ["BC16", "BC20", "BC23"]],
          ["nomorTutupPu", "Nomor Tutup PU", "number", true, ["BC16", "BC20", "BC23"]],
          ["tanggalTutupPu", "Tanggal Tutup PU", "date", true, ["BC16", "BC20", "BC23"]],
          ["nomorPos", "Nomor Pos", "number", true, ["BC16", "BC20", "BC23"]],
          ["nomorSubPos", "Nomor Sub Pos", "number", true, ["BC16", "BC20", "BC23"]],
          ["nomorSubSubPos", "Nomor SubSub Pos", "number", true, ["BC16", "BC20", "BC23"]],
          ["caraPengangkutan", "Cara Pengangkutan", "select", true, ["BC16", "BC20"]],
          ["namaSaranaAngkut", "Nama Sarana Angkut", "text", true, ["BC16", "BC20"]],
          ["nomorVoyage", "Nomor Voyage", "text", true, ["BC16", "BC20"]],
          ["bendera", "Bendera", "select", true, CUSTOMS_NO_KEK],
          ["perkiraanTanggalTiba", "Perkiraan Tanggal Tiba", "date", true, ["BC16", "BC20"]],
          ["perkiraanTanggalMasuk", "Perkiraan Tanggal Masuk", "date", true, ["FTZ01"]],
        ),
      },
      {
        id: "pelabuhan", label: "Pelabuhan & Tempat Timbun", description: "Pelabuhan asal, transit, tujuan, serta lokasi penimbunan barang.", fields: field(
          ["pelabuhanMuat", "Pelabuhan Muat", "select", true, CUSTOMS_NO_KEK],
          ["pelabuhanTransit", "Pelabuhan Transit", "select", false, CUSTOMS_NO_KEK],
          ["pelabuhanTujuan", "Pelabuhan Tujuan", "select", true, ["BC20", "FTZ01"]],
          ["pelabuhanBongkar", "Pelabuhan Bongkar", "select", true, ["BC16", "BC23"]],
          ["tempatTimbun", "Tempat Timbun", "select", true, CUSTOMS_NO_KEK],
          ["lokasiPemeriksaan", "Lokasi Pemeriksaan", "select", false, ["FTZ01"]],
        ),
      },
      {
        id: "penanggung-jawab", label: "Penanggung Jawab", description: "Identitas pihak yang bertanggung jawab atas pengajuan.", fields: field(
          ["penanggungJawabNama", "Nama", "text", true, ALL_CUSTOMS_DOCS],
          ["penanggungJawabJabatan", "Jabatan", "text", true, ALL_CUSTOMS_DOCS],
          ["penanggungJawabKota", "Kota", "text", true, ALL_CUSTOMS_DOCS],
          ["penanggungJawabTanggal", "Tanggal", "date", true, CUSTOMS_NO_KEK],
          ["penanggungJawabTelepon", "Telepon", "text", true, ["KEK_IN"]],
          ["penanggungJawabEmail", "Email", "text", true, ["KEK_IN"]],
          ["penanggungJawabAlamat", "Alamat", "text", true, ["KEK_IN"]],
        ),
      },
    ],
  },
  {
    id: "entitas", label: "Entitas", description: "Data pelaku usaha dan identitas entitas.",
    sections: [
      { id: "pengusahaImportir", label: "Pengusaha / Importir", description: "Identitas pengusaha atau importir yang mengajukan dokumen.", fields: importirPengusahaFields },
      { id: "pemilikBarang", label: "Pemilik Barang", description: "Identitas pihak yang memiliki barang dalam transaksi.", fields: pemilikBarangFields },
      { id: "penjual", label: "Penjual", description: "Identitas pihak yang menjual barang dalam transaksi.", fields: penjualFields },
      { id: "pengirim", label: "Pengirim", description: "Identitas pihak yang mengirim barang dalam transaksi.", fields: pengirimFields },
      { id: "pemasok", label: "Pemasok", description: "Identitas pihak yang memasok barang dalam transaksi.", fields: pemasokFields },
      { id: "npwpPemusatan", label: "NPWP Pemusatan", description: "NPWP lokasi pemusatan. Diisi bila importir mendapat fasilitas pemusatan.", fields: npwpPemusatanFields },
      { id: "ppjk", label: "PPJK", description: "Informasi perusahaan pengurusan jasa kepabeanan yang mewakili pengajuan.", fields: ppjkFields },
      { id: "penerima", label: "Penerima", description: "Identitas pihak yang menerima barang dalam transaksi.", fields: penerimaFields },
      { id: "pembeli", label: "Pembeli", description: "Identitas pembeli dan keterkaitannya dengan pihak penerima.", fields: pembeliFields },
      { id: "eksportirKek", label: "Eksportir", description: "Identitas eksportir dalam transaksi.", fields: eksportirKekFields },
      { id: "vendorKek", label: "Vendor", description: "Identitas vendor dalam transaksi.", fields: vendorKekFields },
    ],
  },
  {
    id: "dokumen", label: "Dokumen Lampiran", description: "Daftar dokumen pengajuan yang dilampirkan.",
    sections: [{ id: "dokumen-lampiran", label: "Dokumen Lampiran", description: "Tiga dokumen awal INV, PL, dan BL wajib tersedia. Record tambahan boleh ditambah dan dihapus.", fields: field(
      ["Kode Dokumen", "Kode", "select", true, CUSTOMS_NO_KEK], ["Nomor Dokumen", "Nomor", "text", true, CUSTOMS_NO_KEK],
      ["Tanggal", "Tanggal", "date", true, CUSTOMS_NO_KEK], ["Kode Fasilitas", "Kode Fasilitas", "select", true, CUSTOMS_NO_KEK],
      ["Kode Ijin", "Kode Izin", "select", true, CUSTOMS_NO_KEK], ["Kategori Dokumen", "Kategori Dokumen", "select", true, ["KEK_IN"]],
      ["Negara Asal", "Negara Asal", "select", true, ["KEK_IN"]],
    ) }],
  },
  {
    id: "kemasan", label: "Kemasan & Kontainer", description: "Kemasan dan data kontainer pengiriman.",
    sections: [
      { id: "kemasan", label: "Kemasan", description: "Data kemasan dapat ditambah dan diperbarui untuk setiap pengajuan.", fields: field(
        ["Seri", "Seri", "number", true, CUSTOMS_NO_KEK], ["Jumlah", "Jumlah", "text", true, CUSTOMS_NO_KEK],
        ["Jenis Kemasan", "Jenis", "select", true, CUSTOMS_NO_KEK], ["Merek", "Merek", "select", false, CUSTOMS_NO_KEK],
        ["Kemasan", "Kemasan", "text", false, ["KEK_IN"]],
      ) },
      { id: "kontainer", label: "Kontainer", description: "Informasi kontainer, nomor seal, ukuran, tipe, dan stuffing.", fields: field(
        ["Seri", "Seri", "number", true, ALL_CUSTOMS_DOCS], ["Nomor Kontainer", "Nomor", "text", true, ALL_CUSTOMS_DOCS],
        ["Ukuran", "Ukuran", "select", true, ALL_CUSTOMS_DOCS], ["Jenis Muatan", "Jenis Muatan", "select", true, CUSTOMS_NO_KEK],
        ["Tipe", "Tipe", "select", false, ALL_CUSTOMS_DOCS], ["Nomor Seal", "Nomor Seal", "text", true, ALL_CUSTOMS_DOCS],
        ["Stuffing", "Stuffing", "select", true, ALL_CUSTOMS_DOCS],
      ) },
    ],
  },
  {
    id: "barang", label: "Barang", description: "Rincian barang, cukai, spesifikasi, dokumen, VD, dan tarif.",
    sections: [
      { id: "barang-info", label: "Informasi Barang", fields: field(
        ["Seri", "Seri", "number", true, ALL_CUSTOMS_DOCS], ["HS Code", "HS Code", "select", true, ALL_CUSTOMS_DOCS],
        ["Kode Barang", "Kode Barang", "text", false, ALL_CUSTOMS_DOCS], ["Uraian", "Uraian", "text", true, ALL_CUSTOMS_DOCS],
        ["Merek", "Merek", "text", true, ALL_CUSTOMS_DOCS], ["Tipe", "Tipe", "text", true, ALL_CUSTOMS_DOCS],
        ["Ukuran", "Ukuran", "text", false, ALL_CUSTOMS_DOCS], ["Spesifikasi Lain", "Spesifikasi Lain", "text", false, ALL_CUSTOMS_DOCS],
        ["Kondisi Barang", "Kondisi Barang", "select", true, ALL_CUSTOMS_DOCS], ["Negara Asal", "Negara", "select", true, ALL_CUSTOMS_DOCS],
        ["Berat Bersih", "Berat Bersih", "number", true, ALL_CUSTOMS_DOCS], ["Berat Kotor", "Berat Kotor", "number", true, ALL_CUSTOMS_DOCS],
        ["Pernyataan Lartas", "Pernyataan Lartas", "alert", false, ALL_CUSTOMS_DOCS, undefined, undefined, true, "Berdasarkan hasil analisis ketentuan HS Code"],
        ["Kode Satuan", "Kode Satuan", "select", true, ALL_CUSTOMS_DOCS], ["Jumlah Satuan", "Jumlah Satuan", "number", true, ALL_CUSTOMS_DOCS],
        ["Kode Kemasan", "Kode Kemasan", "select", true, ALL_CUSTOMS_DOCS], ["Jumlah Kemasan", "Jumlah Kemasan", "number", true, ALL_CUSTOMS_DOCS],
        ["Harga Invoice", "Harga Invoice", "number", true, ["BC20", "BC23"]], ["Biaya Penambahan", "Biaya Penambahan", "number", false, ["BC20", "BC23"]],
        ["Biaya Pengurangan", "Biaya Pengurangan", "number", false, ["BC20"]], ["Harga per Satuan", "Harga per Satuan", "number", false, ["BC20", "BC23", "FTZ01"]],
        ["Freight", "Freight", "number", false, ["BC20", "BC23", "FTZ01", "KEK_IN"]], ["Asuransi", "Asuransi", "number", false, ["BC20", "BC23", "FTZ01", "KEK_IN"]],
        ["Nilai VD", "Nilai VD", "number", false, ["BC20"]], ["Nilai CIF", "Nilai CIF", "number", true, ALL_CUSTOMS_DOCS],
        ["Nilai Pabean Rupiah", "Nilai Pabean Rupiah", "number", true, ["BC20", "BC23"]], ["Metode Nilai Pabean", "Metode Nilai Pabean", "select", true, ["BC20"]],
        ["Alasan", "Alasan", "select", true, ["BC20"]], ["Perbedaan Harga", "Perbedaan Harga", "radio", true, ["BC20"]],
        ["FOB", "FOB", "number", false, ["BC23", "FTZ01", "KEK_IN"]], ["Tambahan - Diskon", "Tambahan - Diskon", "number", false, ["FTZ01", "KEK_IN"]],
        ["Volume", "Volume", "number", false, ["FTZ01", "KEK_IN"]], ["Status", "Status", "text", false, ALL_CUSTOMS_DOCS],
      ) },
      { id: "barang-cukai", label: "Barang Cukai", fields: field(
        ["Komoditi", "Komoditi", "select", true, ALL_CUSTOMS_DOCS], ["Jenis Tarif Cukai", "Jenis Tarif", "select", true, ALL_CUSTOMS_DOCS],
        ["Tarif Cukai", "Tarif", "number", true, ALL_CUSTOMS_DOCS], ["Kode Fasilitas Cukai", "Kode Fasilitas", "select", true, ALL_CUSTOMS_DOCS],
        ["Jumlah Satuan Cukai", "Jumlah Satuan", "number", true, ALL_CUSTOMS_DOCS], ["Jenis Satuan Cukai", "Jenis Satuan", "select", true, ALL_CUSTOMS_DOCS],
        ["Nilai Cukai", "Nilai Cukai", "number", true, ALL_CUSTOMS_DOCS], ["Jenis Tarif HJE", "Jenis Tarif", "select", true, ALL_CUSTOMS_DOCS],
        ["HJE RP", "HJE RP", "number", true, ALL_CUSTOMS_DOCS], ["Total Kemasan Cukai", "Total Kemasan", "number", true, ALL_CUSTOMS_DOCS],
        ["Jenis Kemasan Cukai", "Jenis Kemasan", "select", true, ALL_CUSTOMS_DOCS], ["Isi Per Kemasan", "Isi Per Kemasan", "number", true, ALL_CUSTOMS_DOCS],
        ["Jumlah Pita Cukai", "Jumlah Pita Cukai", "number", true, ALL_CUSTOMS_DOCS], ["Saldo Awal", "Saldo Awal", "number", true, ALL_CUSTOMS_DOCS],
        ["Saldo Akhir", "Saldo Akhir", "number", true, ALL_CUSTOMS_DOCS],
      ) },
      { id: "barang-spesifikasi", label: "Spesifikasi Wajib", fields: field(
        ["Nama Spesifikasi", "Kode", "select", true, ALL_CUSTOMS_DOCS, undefined, undefined, false, "Berdasarkan HS Code"],
        ["Nilai", "Keterangan", "text", true, ALL_CUSTOMS_DOCS, undefined, undefined, false, "Berdasarkan HS Code"],
      ) },
      { id: "barang-dokumen", label: "Dokumen Barang", fields: field(
        ["Seri Dokumen", "Seri", "checkbox", true, ALL_CUSTOMS_DOCS], ["Jenis Dokumen", "Jenis", "checkbox", true, ALL_CUSTOMS_DOCS], ["Nomor Dokumen", "Nomor", "checkbox", true, ALL_CUSTOMS_DOCS],
        ["Tanggal", "Tanggal", "checkbox", true, ALL_CUSTOMS_DOCS], ["Fasilitas", "Fasilitas", "checkbox", true, ALL_CUSTOMS_DOCS], ["No Urut Izin", "No. Urut di Izin", "number", true, ALL_CUSTOMS_DOCS],
      ) },
      { id: "barang-vd", label: "Barang VD", fields: field(
        ["Jenis VD", "Jenis Nilai", "select", true, CUSTOMS_NO_KEK], ["Tanggal Jatuh Tempo", "Tanggal Jatuh Tempo", "date", true, CUSTOMS_NO_KEK],
        ["Nilai", "Nilai VD", "number", true, CUSTOMS_NO_KEK],
      ) },
      { id: "barang-tarif", label: "Barang Tarif", fields: field(
        ["Jenis Pungutan", "Jenis Pungutan", "select", true, ALL_CUSTOMS_DOCS], ["Jenis Tarif", "Jenis Tarif", "select", true, ALL_CUSTOMS_DOCS],
        ["Kode Satuan", "Kode Satuan", "select", true, ALL_CUSTOMS_DOCS], ["Jumlah Satuan", "Jumlah Satuan", "number", true, ALL_CUSTOMS_DOCS],
        ["Nilai Tarif", "Nilai Tarif", "number", true, ALL_CUSTOMS_DOCS], ["Kode Fasilitas Tarif", "Kode Fasilitas Tarif", "select", true, ALL_CUSTOMS_DOCS],
        ["Nilai Tarif Fasilitas", "Nilai Tarif Fasilitas", "number", true, ALL_CUSTOMS_DOCS], ["Penerbit SKA", "Penerbit SKA", "select", true, ["FTZ01"]],
      ) },
      { id: "karantina", label: "Barang Karantina", fields: field(
        ["Komoditi", "Komoditi", "select", true], ["Klasifikasi", "Klasifikasi", "text", true],
        ["Jumlah", "Jumlah", "number", true], ["Satuan", "Satuan", "select", true],
        ["Nama Umum", "Nama Umum", "text", true], ["Nama Latin", "Nama Latin", "text", true],
      ) },
      { id: "karantina-hewan", label: "Header Karantina Hewan", description: "Data karantina hewan untuk keseluruhan pengajuan.", groups: karantinaHeaderGroups, fields: karantinaHeaderFields("Hewan") },
      { id: "karantina-ikan", label: "Header Karantina Ikan", description: "Data karantina ikan untuk keseluruhan pengajuan.", groups: karantinaHeaderGroups, fields: karantinaHeaderFields("Ikan") },
      { id: "karantina-tumbuhan", label: "Header Karantina Tumbuhan", description: "Data karantina tumbuhan untuk keseluruhan pengajuan.", groups: karantinaHeaderGroups, fields: karantinaHeaderFields("Tumbuhan") },
    ],
  },
  { id: "review", label: "Review & Submit", description: "Ringkasan akhir sebelum submit.", sections: [{ id: "review-submit", label: "Review & Submit", fields: [] }] },
];

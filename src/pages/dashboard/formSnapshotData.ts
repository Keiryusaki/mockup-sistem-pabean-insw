export type FormSource = "assistant" | "manual" | "copy" | "upload";

export type AiSubmissionDraft = {
  jenisPengajuan: string;
  namaPerusahaan: string;
  npwp: string;
  nib: string;
  keterangan: string;
  dokumen: string[];
};

export type FormStateSnapshot = {
  pengajuan: Record<string, string>;
  entitas: Record<string, string>[];
  dokumen: Record<string, string>[];
  kemasan: Record<string, string>[];
  kontainer: Record<string, string>[];
  barang: Record<string, string>[];
  spesifikasi: Record<string, string>[];
  barangDokumen: Record<string, string>[];
  barangVd: Record<string, string>[];
  barangTarif: Record<string, string>[];
  karantina: Record<string, string>[];
};

export const AI_DRAFT_STORAGE_KEY = "insw-ai-submission-draft";
export const BC20_FORM_STORAGE_KEY = "insw-bc20-form-draft";
export const FORM_SOURCE_STORAGE_KEY = "insw-form-source";
export const FORM_NOTICE_STORAGE_KEY = "insw-form-notice";

export function buildBaseFormSnapshot(
  jenisPengajuan: string,
  companyName: string,
  npwp: string,
  nib: string,
  documents: string[],
): FormStateSnapshot {
  const firstDocument = documents[0] || "surat_pengajuan_impor_v01.docx";
  const secondDocument = documents[1] || "packing_list_mock.pdf";

  return {
    pengajuan: {
      nomorPengajuan: "BC2006260001",
      kantorPabean: "040100 - KPU Bea Cukai Tanjung Priok",
      jenisPib: jenisPengajuan,
      jenisImpor: "Umum",
      caraBayar: "Biasa",
      valuta: "USD",
      ndpbm: "16342.00",
      jenisTransaksi: "Biasa",
      harga: "1250000",
      freight: "250000",
      asuransi: "0",
      diskon: "0",
      beratKotor: "1000",
      caraPengangkutan: "Laut",
      namaSaranaAngkut: "MV Contoh Nusantara",
      nomorVoyage: "VY-0626",
      bendera: "Indonesia",
      perkiraanTanggalTiba: "2026-07-08",
      pelabuhanMuat: "SGSIN",
      pelabuhanTransit: "MYTPP",
      pelabuhanTujuan: "IDTPP",
      tempatTimbun: "JICT",
    },
    entitas: [
      {
        "Jenis Entitas": "Importer",
        "Jenis Identitas": "NPWP",
        NITKU: "3171010000001",
        Nama: companyName,
        Alamat: "Jl. Contoh Raya No. 123, Jakarta",
        NIB: nib,
        "Jenis API": "API-U",
        Status: "Aktif",
        "Kode Negara": "ID",
        "Kode Afiliasi": "00",
      },
    ],
    dokumen: [
      {
        Seri: "1",
        "Kode Dokumen": "INV",
        "Nomor Dokumen": firstDocument,
        Tanggal: "2026-06-30",
        "Kode Fasilitas": "-",
        "Kode Ijin": "-",
      },
      {
        Seri: "2",
        "Kode Dokumen": "PL",
        "Nomor Dokumen": secondDocument,
        Tanggal: "2026-06-30",
        "Kode Fasilitas": "-",
        "Kode Ijin": "-",
      },
    ],
    kemasan: [{ Seri: "1", "Jenis Kemasan": "Pallet", Merek: "INSW" }],
    kontainer: [{ Seri: "1", "Nomor Kontainer": "MSKU1234567", Ukuran: "40", "Jenis Muatan": "FCL", Tipe: "Dry" }],
    barang: [
      {
        Seri: "1",
        "HS Code": "8471.30.10",
        "Kode Barang": "BRG-001",
        Uraian: "Barang contoh untuk mockup BC 2.0",
        Merek: "INSW",
        Tipe: "Unit",
        Ukuran: "Std",
        "Spesifikasi Lain": "Mock field",
        "Kondisi Barang": "Baru",
        "Negara Asal": "CN",
        "Berat Bersih": "950",
        "Kode Satuan": "PCE",
        "Jumlah Satuan": "10",
        "Kode Kemasan": "PAL",
        "Jumlah Kemasan": "2",
        "Harga Invoice": "1250000",
      },
    ],
    spesifikasi: [{ Seri: "1", "Nama Spesifikasi": "Warna", Nilai: "Hitam", Satuan: "-" }],
    barangDokumen: [{ "Seri Barang": "1", "Seri Dokumen": "1" }],
    barangVd: [{ Seri: "1", "Kode VD": "VD001", "Uraian VD": "Volume data mock", "Nilai VD": "1" }],
    barangTarif: [
      {
        "Seri Barang": "1",
        "Jenis Pungutan": "BM",
        "Jenis Tarif": "Ad Valorem",
        "Kode Satuan": "PCE",
        "Jumlah Satuan": "10",
        "Nilai Tarif": "5",
        "Kode Fasilitas Tarif": "-",
        "Nilai Tarif Fasilitas": "0",
      },
    ],
    karantina: [{ Seri: "1", "Jenis Karantina": "Hewan", "Hasil Pemeriksaan": "Lulus", Keterangan: "-" }],
  };
}

export function storeFormSnapshot(source: FormSource, draft: AiSubmissionDraft, formState?: FormStateSnapshot, notice?: string) {
  sessionStorage.setItem(AI_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  sessionStorage.setItem(FORM_SOURCE_STORAGE_KEY, source);

  if (formState) {
    sessionStorage.setItem(BC20_FORM_STORAGE_KEY, JSON.stringify({ draft, formState }));
  } else {
    sessionStorage.removeItem(BC20_FORM_STORAGE_KEY);
  }

  if (notice) {
    sessionStorage.setItem(FORM_NOTICE_STORAGE_KEY, notice);
  } else {
    sessionStorage.removeItem(FORM_NOTICE_STORAGE_KEY);
  }
}

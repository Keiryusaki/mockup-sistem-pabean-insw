import type { ProposalRow, ProposalStatus } from "../dashboard/dashboardData";

export type ClientProposalStatus = Exclude<ProposalStatus, "Draft">;

export type ClientProposalRow = Omit<ProposalRow, "status" | "canEditAfterReject"> & {
  status: ClientProposalStatus;
};

/** Dummy pengajuan yang sudah dikirim (client review-only). */
export const clientSubmittedRows: ClientProposalRow[] = [
  {
    pengajuan: "2012342ED12320260606000001",
    dokumen: "BC 2.0",
    kirim: "06-06-2026, 08:14",
    kirimAt: "2026-06-06T08:14:00",
    perusahaan: "0027681030529000000000 - PERWIRA MULIA SEMESTA",
    status: "Selesai",
  },
  {
    pengajuan: "2010142ED12320260606000001",
    dokumen: "BC 2.3",
    kirim: "06-06-2026, 09:03",
    kirimAt: "2026-06-06T09:03:00",
    perusahaan: "1234567890123456000000 - test",
    status: "Proses",
    progressLabel: "Review Bea Cukai",
  },
  {
    pengajuan: "2011642ED12320260605000005",
    dokumen: "BC 2.0",
    kirim: "05-06-2026, 15:22",
    kirimAt: "2026-06-05T15:22:00",
    perusahaan: "1234567890123456000000 - Test",
    status: "Ditolak",
  },
  {
    pengajuan: "2011642ED12320260605000004",
    dokumen: "BC 2.16",
    kirim: "05-06-2026, 11:48",
    kirimAt: "2026-06-05T11:48:00",
    perusahaan: "1234567890123456000000 - DASINDO",
    status: "Selesai",
  },
  {
    pengajuan: "2011642ED12320260605000003",
    dokumen: "BC 2.3",
    kirim: "04-06-2026, 17:05",
    kirimAt: "2026-06-04T17:05:00",
    perusahaan: "1234567890123456000000 - SAMPLE TECH",
    status: "Ditolak",
  },
  {
    pengajuan: "2013342ED12320260607000011",
    dokumen: "BC 2.0",
    kirim: "07-06-2026, 10:21",
    kirimAt: "2026-06-07T10:21:00",
    perusahaan: "0098123409876000000000 - NUSANTARA LOGISTIK",
    status: "Proses",
    progressLabel: "Review Karantina",
  },
  {
    pengajuan: "2013342ED12320260607000012",
    dokumen: "BC 2.7",
    kirim: "07-06-2026, 13:40",
    kirimAt: "2026-06-07T13:40:00",
    perusahaan: "0088776655443000000000 - MITRA EKSPOR INDONESIA",
    status: "Proses",
    progressLabel: "Review INSW",
  },
  {
    pengajuan: "2013342ED12320260608000021",
    dokumen: "BC 2.3",
    kirim: "08-06-2026, 09:12",
    kirimAt: "2026-06-08T09:12:00",
    perusahaan: "0011223344556000000000 - BAHARI PRIMA JAYA",
    status: "Selesai",
  },
  {
    pengajuan: "2013342ED12320260608000022",
    dokumen: "BC 2.0",
    kirim: "08-06-2026, 15:55",
    kirimAt: "2026-06-08T15:55:00",
    perusahaan: "0077008800991000000000 - SAMUDRA KARGO SEJAHTERA",
    status: "Ditolak",
  },
  {
    pengajuan: "2013342ED12320260609000031",
    dokumen: "BC 2.16",
    kirim: "09-06-2026, 08:05",
    kirimAt: "2026-06-09T08:05:00",
    perusahaan: "0033445566778000000000 - GARUDA TRADING HOUSE",
    status: "Proses",
    progressLabel: "Menunggu Respon Instansi",
  },
];

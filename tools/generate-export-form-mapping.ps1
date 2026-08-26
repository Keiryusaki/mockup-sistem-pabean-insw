param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [string]$OutputPath = (Join-Path $PSScriptRoot "..\src\form-config\export\export-source-mapping.json")
)

$ErrorActionPreference = "Stop"

$documentDefinitions = [ordered]@{
  "bc30" = [ordered]@{ id = "EXP_BC30"; label = "BC 3.0"; description = "Form BC 3.0 digunakan untuk melengkapi data pemberitahuan ekspor barang." }
  "kek-tlddp" = [ordered]@{ id = "EXP_KEK_TLDDP"; label = "KEK TLDDP"; description = "Form KEK TLDDP digunakan untuk melengkapi data pengeluaran barang dari KEK ke tempat lain dalam daerah pabean." }
  "kek-ldp" = [ordered]@{ id = "EXP_KEK_LDP"; label = "KEK LDP"; description = "Form KEK LDP digunakan untuk melengkapi data pengeluaran barang dari KEK ke luar daerah pabean." }
  "kek-fasilitas" = [ordered]@{ id = "EXP_KEK_FASILITAS"; label = "KEK Fasilitas"; description = "Form KEK Fasilitas digunakan untuk melengkapi data pengeluaran barang yang memperoleh fasilitas di Kawasan Ekonomi Khusus." }
  "pkbe" = [ordered]@{ id = "EXP_PKBE"; label = "PKBE"; description = "Form PKBE digunakan untuk melengkapi data pemberitahuan konsolidasi barang ekspor." }
  "surveyor" = [ordered]@{ id = "EXP_SURVEYOR"; label = "Surveyor"; description = "Form Surveyor digunakan untuk melengkapi data pemberitahuan pemeriksaan dan pelaporan surveyor." }
}

$stepDefinitions = [ordered]@{
  "pengajuan" = [ordered]@{ label = "Pengajuan" }
  "entitas" = [ordered]@{ label = "Entitas" }
  "dokumen" = [ordered]@{ label = "Dokumen Lampiran" }
  "kemasan" = [ordered]@{ label = "Kemasan & Kontainer" }
  "barang" = [ordered]@{ label = "Barang" }
  "karantina" = [ordered]@{ label = "Karantina & Pemeriksaan"; condition = "requiresQuarantine" }
  "surveyor" = [ordered]@{ label = "Surveyor" }
}

$knownSectionIds = @{
  "Pengajuan Header" = "header-pengajuan"
  "Pengangkut" = "pengangkutan"
  "Nilai Pabean & Pungutan" = "nilai-pabean-pungutan"
  "Pelabuhan dan Tempat Timbun" = "pelabuhan-tempat-timbun"
  "Penanggung Jawab" = "penanggung-jawab"
  "Bank Devisa" = "bank-devisa"
  "Eksportir / Pengirim / Pengusaha" = "eksportir-pengirim-pengusaha"
  "Penerima" = "penerima"
  "Pembeli" = "pembeli"
  "Pihak Konsolidasi" = "pihak-konsolidasi"
  "Pemilik Barang" = "pemilik-barang"
  "PPJK" = "ppjk"
  "Dokumen Pelengkap (td_dokumen)" = "dokumen-pelengkap"
  "Kemasan (td_kemasan)" = "kemasan"
  "Kontainer (td_kontainer)" = "kontainer"
  "Data Barang Utama (td_barang)" = "barang-info"
  "Cukai Barang (td_barang_cukai)" = "barang-cukai"
  "Spesifikasi Wajib (td_spesifikasi_wajib)" = "barang-spesifikasi"
  "Dokumen Lampiran Barang (td_barang_dokumen)" = "barang-dokumen"
  "Tarif & Bea Masuk Barang (td_barang_tarif)" = "barang-tarif"
  "Satuan Kemasan Barang (td_satuan_kemasan)" = "barang-satuan-kemasan"
  "Bahan Asal / Komponen (td_barang_asal)" = "barang-bahan-asal"
  "Dokumen Bahan Asal (td_barang_asal_dokumen)" = "barang-bahan-asal-dokumen"
  "Tarif Bahan Asal (td_barang_asal_tarif)" = "barang-bahan-asal-tarif"
  "Cukai Bahan Asal (td_barang_asal_cukai)" = "barang-bahan-asal-cukai"
  "Data Karantina (td_karantina)" = "karantina-header"
  "Detail Mutu (td_detail_mutu)" = "karantina-detail-mutu"
  "Barang Karantina (td_barang_karantina)" = "karantina-barang"
  "Kesiapan Barang PKB (td_pkb)" = "karantina-pkb"
  "Pemberitahuan Umum Surveyor (td_pemberitahuan_umum_surveyor)" = "surveyor-pemberitahuan-umum"
  "Data Surveyor & NTPN (td_data_surveyor)" = "surveyor-ntpn"
  "Komoditi Surveyor NTPN (td_barang_ntpn)" = "surveyor-komoditi-ntpn"
  "Entitas Surveyor (td_entitas_surveyor)" = "surveyor-entitas"
  "Transportasi Surveyor (td_transportasi_surveyor)" = "surveyor-transportasi"
  "Pelabuhan Surveyor (td_pelabuhan_surveyor)" = "surveyor-pelabuhan"
  "Asuransi Surveyor (td_asuransi_surveyor)" = "surveyor-asuransi"
  "Dokumen Surveyor (td_dokumen_surveyor)" = "surveyor-dokumen"
}

$sectionDescriptions = @{
  "header-pengajuan" = "Informasi utama dan identitas pengajuan ekspor."
  "pengangkutan" = "Sarana dan perjalanan yang mengangkut barang ekspor."
  "nilai-pabean-pungutan" = "Nilai transaksi, biaya, dan pungutan ekspor."
  "pelabuhan-tempat-timbun" = "Lokasi pemuatan, tujuan, dan penimbunan barang."
  "penanggung-jawab" = "Pihak yang menandatangani dan bertanggung jawab atas pengajuan."
  "bank-devisa" = "Bank yang menerima atau mengelola devisa hasil ekspor."
  "eksportir-pengirim-pengusaha" = "Identitas pelaku usaha yang mengajukan ekspor."
  "penerima" = "Pihak yang menerima barang di negara tujuan."
  "pembeli" = "Pihak yang membeli barang di luar negeri."
  "pihak-konsolidasi" = "Pihak yang melakukan konsolidasi barang ekspor."
  "pemilik-barang" = "Daftar pihak yang memiliki barang untuk diekspor."
  "ppjk" = "Perusahaan jasa kepabeanan yang mewakili pengajuan."
  "dokumen-pelengkap" = "Dokumen pendukung yang menyertai pengajuan ekspor."
  "kemasan" = "Rincian kemasan yang digunakan untuk barang ekspor."
  "kontainer" = "Informasi peti kemas yang membawa barang ekspor."
  "barang-info" = "Daftar barang yang diberitahukan dalam pengajuan ekspor."
  "barang-satuan-kemasan" = "Satuan dan kemasan yang melekat pada barang."
  "barang-spesifikasi" = "Spesifikasi wajib untuk mengidentifikasi barang."
  "barang-dokumen" = "Dokumen pendukung yang terkait dengan barang."
  "barang-tarif" = "Tarif dan pungutan yang berlaku pada barang."
  "barang-cukai" = "Rincian cukai yang dikenakan pada barang."
  "barang-bahan-asal" = "Bahan asal atau komponen pembentuk barang."
  "barang-bahan-asal-dokumen" = "Dokumen pendukung untuk bahan asal barang."
  "barang-bahan-asal-tarif" = "Tarif yang berlaku pada bahan asal barang."
  "barang-bahan-asal-cukai" = "Rincian cukai untuk bahan asal barang."
  "karantina-header" = "Informasi pemeriksaan karantina pada pengajuan."
  "karantina-detail-mutu" = "Hasil pemeriksaan mutu komoditas karantina."
  "karantina-barang" = "Daftar barang yang memerlukan pemeriksaan karantina."
  "karantina-pkb" = "Kesiapan barang untuk pelaksanaan pemeriksaan."
  "surveyor-pemberitahuan-umum" = "Informasi umum pemberitahuan pemeriksaan surveyor."
  "surveyor-ntpn" = "Data surveyor dan penerimaan negara yang terkait."
  "surveyor-komoditi-ntpn" = "Komoditas yang tercantum pada data surveyor."
  "surveyor-entitas" = "Pihak yang terkait dengan pemeriksaan surveyor."
  "surveyor-transportasi" = "Sarana pengangkut yang diperiksa oleh surveyor."
  "surveyor-pelabuhan" = "Pelabuhan yang terkait dengan pemeriksaan surveyor."
  "surveyor-asuransi" = "Informasi asuransi pada pemeriksaan surveyor."
  "surveyor-dokumen" = "Dokumen hasil pemeriksaan atau verifikasi surveyor."
}

$repeatableSections = [System.Collections.Generic.HashSet[string]]::new([string[]]@(
  "bank-devisa",
  "pemilik-barang",
  "dokumen-pelengkap",
  "kemasan",
  "kontainer",
  "barang-info",
  "barang-cukai",
  "barang-spesifikasi",
  "barang-dokumen",
  "barang-tarif",
  "barang-satuan-kemasan",
  "barang-bahan-asal",
  "barang-bahan-asal-dokumen",
  "barang-bahan-asal-tarif",
  "barang-bahan-asal-cukai",
  "karantina-detail-mutu",
  "karantina-barang",
  "surveyor-ntpn",
  "surveyor-komoditi-ntpn",
  "surveyor-dokumen"
))

$sectionRelations = @{
  "barang-satuan-kemasan" = [ordered]@{ parentSectionId = "barang-info"; foreignKey = "_barangRef"; label = "Barang Terkait" }
  "barang-spesifikasi" = [ordered]@{ parentSectionId = "barang-info"; foreignKey = "_barangRef"; label = "Barang Terkait" }
  "barang-dokumen" = [ordered]@{ parentSectionId = "barang-info"; foreignKey = "_barangRef"; label = "Barang Terkait" }
  "barang-tarif" = [ordered]@{ parentSectionId = "barang-info"; foreignKey = "_barangRef"; label = "Barang Terkait" }
  "barang-cukai" = [ordered]@{ parentSectionId = "barang-info"; foreignKey = "_barangRef"; label = "Barang Terkait" }
  "barang-bahan-asal" = [ordered]@{ parentSectionId = "barang-info"; foreignKey = "_barangRef"; label = "Barang Terkait" }
  "barang-bahan-asal-dokumen" = [ordered]@{ parentSectionId = "barang-bahan-asal"; foreignKey = "_bahanAsalRef"; label = "Bahan Asal Terkait" }
  "barang-bahan-asal-tarif" = [ordered]@{ parentSectionId = "barang-bahan-asal"; foreignKey = "_bahanAsalRef"; label = "Bahan Asal Terkait" }
  "barang-bahan-asal-cukai" = [ordered]@{ parentSectionId = "barang-bahan-asal"; foreignKey = "_bahanAsalRef"; label = "Bahan Asal Terkait" }
  "karantina-barang" = [ordered]@{ parentSectionId = "barang-info"; foreignKey = "_barangRef"; label = "Barang Terkait" }
}

function ConvertTo-Slug([string]$Value) {
  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $ascii = -join ($normalized.ToCharArray() | Where-Object {
    [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [Globalization.UnicodeCategory]::NonSpacingMark
  })
  return (($ascii.ToLowerInvariant() -replace "[^a-z0-9]+", "-").Trim("-"))
}

function ConvertTo-FieldId([string]$Value) {
  $words = @((ConvertTo-Slug $Value) -split "-" | Where-Object { $_ })
  if ($words.Count -eq 0) { throw "Tidak dapat membuat field ID dari label '$Value'." }
  $tail = for ($index = 1; $index -lt $words.Count; $index += 1) {
    $word = $words[$index]
    $word.Substring(0, 1).ToUpperInvariant() + $word.Substring(1)
  }
  return $words[0] + ($tail -join "")
}

function Get-StepId([string]$SheetName, [string]$SectionId) {
  if ($SheetName -eq "01_Pengajuan_Header") { return "pengajuan" }
  if ($SheetName -eq "02_Entitas") { return "entitas" }
  if ($SheetName -eq "03_Dokumen_Kemasan_Kontainer") {
    if ($SectionId -eq "dokumen-pelengkap") { return "dokumen" }
    return "kemasan"
  }
  if ($SheetName -eq "04_Barang_dan_Detail") { return "barang" }
  if ($SheetName -eq "05_Karantina_dan_PKB") { return "karantina" }
  if ($SheetName -eq "06_Surveyor") { return "surveyor" }
  throw "Sheet '$SheetName' belum memiliki mapping step."
}

function Resolve-InputType([string]$SourceInputType) {
  switch ($SourceInputType.Trim().ToLowerInvariant()) {
    "text" { return [ordered]@{ inputType = "text"; readOnly = $false } }
    "number" { return [ordered]@{ inputType = "number"; readOnly = $false } }
    "date" { return [ordered]@{ inputType = "date"; readOnly = $false } }
    "search select" { return [ordered]@{ inputType = "select"; readOnly = $false } }
    "checkbox" { return [ordered]@{ inputType = "checkbox"; readOnly = $false } }
    "disable otomatis" { return [ordered]@{ inputType = "text"; readOnly = $true } }
    default { throw "Type input '$SourceInputType' belum dikenali." }
  }
}

function Get-DocumentLabelOverrides([string]$Rule) {
  $overrides = [ordered]@{}
  if ([string]::IsNullOrWhiteSpace($Rule) -or $Rule.Trim() -eq "-") { return $overrides }

  foreach ($clause in ($Rule -split ";")) {
    if ($clause -match "^\s*(bc30|kek-tlddp|kek-ldp|kek-fasilitas|pkbe|surveyor)\s*:\s*(.+?)\s*$") {
      $documentId = $documentDefinitions[$Matches[1]].id
      $resolvedLabel = $Matches[2].Trim()
      $override = [ordered]@{}
      if ($resolvedLabel -match "(?i)\s*\(disable otomatis\)\s*$") {
        $resolvedLabel = ($resolvedLabel -replace "(?i)\s*\(disable otomatis\)\s*$", "").Trim()
        $override.readOnly = $true
      }
      if ($resolvedLabel -match "(?i)\s*\(select search\)\s*$") {
        $resolvedLabel = ($resolvedLabel -replace "(?i)\s*\(select search\)\s*$", "").Trim()
        $override.inputType = "select"
        $override.readOnly = $false
      }
      $override.label = $resolvedLabel
      $overrides[$documentId] = $override
    }
  }
  return $overrides
}

function Read-ZipXml($Archive, [string]$EntryName) {
  $entry = $Archive.GetEntry($EntryName)
  if (-not $entry) { throw "Entry '$EntryName' tidak ditemukan dalam workbook." }
  $reader = [IO.StreamReader]::new($entry.Open())
  try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Get-CellValue($Cell, [string[]]$SharedStrings) {
  if ($null -eq $Cell) { return "" }
  if ($Cell.t -eq "s") { return $SharedStrings[[int]$Cell.v] }
  if ($Cell.t -eq "inlineStr") { return $Cell.is.InnerText }
  return [string]$Cell.v
}

$resolvedSourcePath = [IO.Path]::GetFullPath($SourcePath)
$resolvedOutputPath = [IO.Path]::GetFullPath($OutputPath)
if (-not (Test-Path -LiteralPath $resolvedSourcePath -PathType Leaf)) {
  throw "Workbook tidak ditemukan: $resolvedSourcePath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($resolvedSourcePath)
try {
  $sharedStringsXml = Read-ZipXml $archive "xl/sharedStrings.xml"
  $sharedStrings = @($sharedStringsXml.sst.si | ForEach-Object { $_.InnerText })
  $workbookXml = Read-ZipXml $archive "xl/workbook.xml"
  $relationshipsXml = Read-ZipXml $archive "xl/_rels/workbook.xml.rels"
  $relationshipTargets = @{}
  foreach ($relationship in $relationshipsXml.Relationships.Relationship) {
    $relationshipTargets[$relationship.Id] = $relationship.Target
  }

  $stepBuckets = [ordered]@{}
  foreach ($stepId in $stepDefinitions.Keys) {
    $step = [ordered]@{
      id = $stepId
      label = $stepDefinitions[$stepId].label
      sections = [ordered]@{}
    }
    if ($stepDefinitions[$stepId].condition) { $step.condition = $stepDefinitions[$stepId].condition }
    $stepBuckets[$stepId] = $step
  }

  foreach ($sheet in $workbookXml.workbook.sheets.sheet) {
    $relationshipId = $sheet.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
    $target = $relationshipTargets[$relationshipId].TrimStart("/")
    $sheetXml = Read-ZipXml $archive ("xl/" + $target)

    foreach ($row in @($sheetXml.worksheet.sheetData.row) | Where-Object { [int]$_.r -gt 1 }) {
      $cells = @{}
      foreach ($cell in $row.c) {
        $column = $cell.r -replace "\d", ""
        $cells[$column] = Get-CellValue $cell $sharedStrings
      }
      if ([string]::IsNullOrWhiteSpace($cells["A"]) -and [string]::IsNullOrWhiteSpace($cells["B"])) { continue }

      $sectionLabel = $cells["A"].Trim()
      $fieldLabel = $cells["B"].Trim()
      $sectionId = $knownSectionIds[$sectionLabel]
      if (-not $sectionId) { throw "Section '$sectionLabel' belum memiliki ID teknis." }
      $stepId = Get-StepId $sheet.name $sectionId
      $sectionBucket = $stepBuckets[$stepId].sections[$sectionId]
      if (-not $sectionBucket) {
        $sourceTable = ""
        if ($sectionLabel -match "\((td_[^)]+)\)") { $sourceTable = $Matches[1] }
        $sectionBucket = [ordered]@{
          id = $sectionId
          label = ($sectionLabel -replace "\s*\(td_[^)]+\)\s*$", "")
          description = $sectionDescriptions[$sectionId]
          repeatable = $repeatableSections.Contains($sectionId)
          fields = [System.Collections.ArrayList]::new()
        }
        if ($sourceTable) { $sectionBucket.sourceTable = $sourceTable }
        if ($sectionRelations.ContainsKey($sectionId)) { $sectionBucket.relation = $sectionRelations[$sectionId] }
        $stepBuckets[$stepId].sections[$sectionId] = $sectionBucket
      }

      $fieldId = ConvertTo-FieldId $fieldLabel
      if (@($sectionBucket.fields | Where-Object { $_.id -eq $fieldId }).Count -gt 0) {
        throw "Duplicate field key '$sectionId.$fieldId' pada row $($row.r)."
      }

      $input = Resolve-InputType $cells["C"]
      $documents = @()
      foreach ($sourceDocumentId in ($cells["D"] -split ",\s*")) {
        if (-not $documentDefinitions.Contains($sourceDocumentId)) {
          throw "Kode dokumen '$sourceDocumentId' pada row $($row.r) belum dikenali."
        }
        $documents += $documentDefinitions[$sourceDocumentId].id
      }

      $sourceRule = $cells["F"].Trim()
      $documentOverrides = Get-DocumentLabelOverrides $sourceRule
      $field = [ordered]@{
        id = $fieldId
        dataKey = "$sectionId.$fieldId"
        label = $fieldLabel
        inputType = $input.inputType
        readOnly = $input.readOnly
        required = $cells["E"].Trim().ToLowerInvariant() -eq "yes"
        documents = $documents
        documentOverrides = $documentOverrides
        sourceSheet = [string]$sheet.name
        sourceRow = [int]$row.r
      }
      if (-not [string]::IsNullOrWhiteSpace($sourceRule) -and $sourceRule -ne "-") {
        if ($documentOverrides.Count -eq 0) {
          if ($input.inputType -eq "select" -and $sourceRule -match "\s+/\s+") {
            $field.options = @($sourceRule -split "\s+/\s+" | ForEach-Object {
              [ordered]@{ label = $_.Trim(); value = $_.Trim() }
            })
          } else {
            $field.labelNote = $sourceRule
          }
        }
        $field.sourceRule = $sourceRule
      }
      [void]$sectionBucket.fields.Add($field)
    }
  }

  $steps = @()
  $totalSections = 0
  $totalFields = 0
  foreach ($stepId in $stepBuckets.Keys) {
    $stepBucket = $stepBuckets[$stepId]
    $sections = @($stepBucket.sections.Values)
    $totalSections += $sections.Count
    $totalFields += @($sections | ForEach-Object { $_.fields.Count } | Measure-Object -Sum).Sum
    $step = [ordered]@{ id = $stepBucket.id; label = $stepBucket.label }
    if ($stepBucket.condition) { $step.condition = $stepBucket.condition }
    $step.sections = $sections
    $steps += $step
  }

  $documents = foreach ($sourceCode in $documentDefinitions.Keys) {
    [ordered]@{
      id = $documentDefinitions[$sourceCode].id
      sourceCode = $sourceCode
      label = $documentDefinitions[$sourceCode].label
      description = $documentDefinitions[$sourceCode].description
    }
  }

  $mapping = [ordered]@{
    version = 1
    domain = "EXPORT"
    source = [ordered]@{
      workbook = [IO.Path]::GetFileName($resolvedSourcePath)
      sourceModifiedAt = (Get-Item -LiteralPath $resolvedSourcePath).LastWriteTimeUtc.ToString("o")
      totalFields = $totalFields
      totalSections = $totalSections
    }
    documents = @($documents)
    steps = $steps
  }

  $outputDirectory = Split-Path -Parent $resolvedOutputPath
  if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
  }
  $json = $mapping | ConvertTo-Json -Depth 20
  [IO.File]::WriteAllText($resolvedOutputPath, $json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
  Write-Output "Mapping ekspor ditulis ke $resolvedOutputPath"
  Write-Output "Fields: $totalFields; sections: $totalSections; documents: $($documents.Count)"
} finally {
  $archive.Dispose()
}

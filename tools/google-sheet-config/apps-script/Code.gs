var SCHEMA_VERSION = 1;
var PROPERTY_SPREADSHEET_ID = "SPREADSHEET_ID";
var PROPERTY_PUBLISH_KEY = "PUBLISH_KEY";
var CACHE_PREFIX = "published-config-v1-";

var SHEETS = {
  SETTINGS: "Settings",
  DOCUMENTS: "Documents",
  OVERRIDES: "Overrides",
  REVISIONS: "Revisions"
};

var HEADERS = {
  Settings: ["key", "value", "description"],
  Documents: ["revision", "domain", "document_id", "label", "description", "default_requires_quarantine", "archived", "source_version"],
  Overrides: ["revision", "override_id", "domain", "document_id", "node_type", "step_id", "section_id", "field_key", "enabled", "required", "custom_label", "description", "helper_text", "sort_order"],
  Revisions: ["revision", "status", "published_at", "published_by", "checksum_sha256", "note"]
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Form Configuration")
    .addItem("Setup Project", "setupProject")
    .addItem("Configure Publish Key", "configurePublishKey")
    .addSeparator()
    .addItem("Validate Published Revision", "validatePublishedConfiguration")
    .addItem("Show Configuration Status", "showConfigurationStatus")
    .addToUi();
}

function setupProject() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Buka Apps Script dari Spreadsheet yang akan digunakan.");
  PropertiesService.getScriptProperties().setProperty(PROPERTY_SPREADSHEET_ID, spreadsheet.getId());
  validateWorkbookStructure_(spreadsheet);
  SpreadsheetApp.getUi().alert(
    "Setup berhasil",
    "Spreadsheet terhubung. Selanjutnya jalankan Configure Publish Key lalu deploy sebagai Web App.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function configurePublishKey() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    "Configure Publish Key",
    "Masukkan secret minimal 24 karakter. Secret ini nanti disimpan pada server/proxy intranet, bukan di browser.",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  var key = response.getResponseText().trim();
  if (key.length < 24) throw new Error("Publish key minimal 24 karakter.");
  PropertiesService.getScriptProperties().setProperty(PROPERTY_PUBLISH_KEY, key);
  ui.alert("Publish key berhasil disimpan pada Script Properties.");
}

function showConfigurationStatus() {
  var spreadsheet = getSpreadsheet_();
  validateWorkbookStructure_(spreadsheet);
  var revision = Number(getSetting_(spreadsheet, "published_revision"));
  var config = buildPublishedPayload_(spreadsheet, revision);
  SpreadsheetApp.getUi().alert(
    "Configuration Status",
    [
      "Spreadsheet: " + spreadsheet.getName(),
      "Published revision: " + revision,
      "Dokumen Impor: " + config.configs.IMPORT.documents.length,
      "Dokumen Ekspor: " + config.configs.EXPORT.documents.length,
      "Publish key: " + (PropertiesService.getScriptProperties().getProperty(PROPERTY_PUBLISH_KEY) ? "configured" : "belum dikonfigurasi")
    ].join("\n"),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function validatePublishedConfiguration() {
  var spreadsheet = getSpreadsheet_();
  validateWorkbookStructure_(spreadsheet);
  var revision = Number(getSetting_(spreadsheet, "published_revision"));
  var payload = buildPublishedPayload_(spreadsheet, revision);
  validateConfigs_(payload.configs);
  SpreadsheetApp.getUi().alert("Revision " + revision + " valid dan siap dibaca aplikasi.");
}

function doGet(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || "config").toLowerCase();
    if (action === "health") return jsonOutput_(healthPayload_());
    if (action !== "config") throw new Error("Action tidak dikenal: " + action);

    var spreadsheet = getSpreadsheet_();
    validateWorkbookStructure_(spreadsheet);
    var requestedRevision = e && e.parameter && e.parameter.revision;
    var revision = requestedRevision ? Number(requestedRevision) : Number(getSetting_(spreadsheet, "published_revision"));
    if (!Number.isInteger(revision) || revision < 1) throw new Error("Revision tidak valid.");

    var cache = CacheService.getScriptCache();
    var cacheKey = CACHE_PREFIX + revision;
    var cached = cache.get(cacheKey);
    var payload = cached ? JSON.parse(cached) : buildPublishedPayload_(spreadsheet, revision);
    if (!cached) {
      var serialized = JSON.stringify(payload);
      if (serialized.length < 90000) cache.put(cacheKey, serialized, 300);
    }

    payload = filterPayload_(payload, e && e.parameter ? e.parameter.domain : "", e && e.parameter ? e.parameter.documentId : "");
    return jsonOutput_(payload);
  } catch (error) {
    return jsonOutput_({ ok: false, error: errorMessage_(error) });
  }
}

function doPost(e) {
  try {
    var body = parseRequestBody_(e);
    var action = String(body.action || "publish").toLowerCase();
    if (action !== "publish") throw new Error("Action tidak dikenal: " + action);
    verifyPublishKey_(body.publishKey);
    var result = publishConfiguration_(body);
    return jsonOutput_(result);
  } catch (error) {
    return jsonOutput_({ ok: false, error: errorMessage_(error) });
  }
}

function healthPayload_() {
  var spreadsheet = getSpreadsheet_();
  validateWorkbookStructure_(spreadsheet);
  return {
    ok: true,
    service: "insw-form-configuration",
    schemaVersion: SCHEMA_VERSION,
    publishedRevision: Number(getSetting_(spreadsheet, "published_revision")),
    publishKeyConfigured: Boolean(PropertiesService.getScriptProperties().getProperty(PROPERTY_PUBLISH_KEY)),
    timestamp: new Date().toISOString()
  };
}

function publishConfiguration_(body) {
  validateConfigs_(body.configs);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var spreadsheet = getSpreadsheet_();
    validateWorkbookStructure_(spreadsheet);
    var revisionSheet = spreadsheet.getSheetByName(SHEETS.REVISIONS);
    var currentRevision = Number(getSetting_(spreadsheet, "published_revision"));
    var nextRevision = Math.max(currentRevision, maxRevision_(revisionSheet)) + 1;
    var flattened = flattenConfigs_(body.configs, nextRevision);
    var checksum = sha256Hex_(canonicalStringify_(body.configs));
    var actor = String(body.publishedBy || Session.getActiveUser().getEmail() || "INTRANET_CONFIGURATOR");
    var note = String(body.note || "Published from INSW form configurator");
    var publishedAt = new Date();

    appendObjects_(spreadsheet.getSheetByName(SHEETS.DOCUMENTS), HEADERS.Documents, flattened.documents);
    appendObjects_(spreadsheet.getSheetByName(SHEETS.OVERRIDES), HEADERS.Overrides, flattened.overrides);
    archivePublishedRevision_(revisionSheet, currentRevision);
    appendObjects_(revisionSheet, HEADERS.Revisions, [{
      revision: nextRevision,
      status: "PUBLISHED",
      published_at: publishedAt,
      published_by: actor,
      checksum_sha256: checksum,
      note: note
    }]);

    SpreadsheetApp.flush();
    setSetting_(spreadsheet, "published_revision", nextRevision);
    setSetting_(spreadsheet, "generated_at", publishedAt.toISOString());
    SpreadsheetApp.flush();
    CacheService.getScriptCache().removeAll([CACHE_PREFIX + currentRevision, CACHE_PREFIX + nextRevision]);

    return {
      ok: true,
      revision: nextRevision,
      checksum: checksum,
      documents: flattened.documents.length,
      overrides: flattened.overrides.length,
      publishedAt: publishedAt.toISOString(),
      publishedBy: actor
    };
  } finally {
    lock.releaseLock();
  }
}

function buildPublishedPayload_(spreadsheet, revision) {
  var documentRows = readObjects_(spreadsheet.getSheetByName(SHEETS.DOCUMENTS), HEADERS.Documents)
    .filter(function (row) { return Number(row.revision) === revision; });
  if (!documentRows.length) throw new Error("Tidak ada document pada revision " + revision + ".");
  var overrideRows = readObjects_(spreadsheet.getSheetByName(SHEETS.OVERRIDES), HEADERS.Overrides)
    .filter(function (row) { return Number(row.revision) === revision; });
  var revisionRow = readObjects_(spreadsheet.getSheetByName(SHEETS.REVISIONS), HEADERS.Revisions)
    .find(function (row) { return Number(row.revision) === revision; });

  var configs = { IMPORT: { version: 1, documents: [] }, EXPORT: { version: 1, documents: [] } };
  var documentMaps = { IMPORT: {}, EXPORT: {} };
  documentRows.forEach(function (row) {
    var domain = normalizeDomain_(row.domain);
    var document = {
      id: String(row.document_id),
      label: String(row.label),
      defaultRequiresQuarantine: toBoolean_(row.default_requires_quarantine, false)
    };
    if (hasValue_(row.description)) document.description = String(row.description);
    if (toBoolean_(row.archived, false)) document.archived = true;
    configs[domain].documents.push(document);
    documentMaps[domain][document.id] = document;
    configs[domain].version = Math.max(configs[domain].version, Number(row.source_version) || 1);
  });

  overrideRows.forEach(function (row) {
    var domain = normalizeDomain_(row.domain);
    var document = documentMaps[domain][String(row.document_id)];
    if (!document) throw new Error("Override mengacu ke document yang tidak ada: " + row.override_id);
    applyOverrideRow_(document, row);
  });

  validateConfigs_(configs);
  return {
    ok: true,
    schemaVersion: Number(getSetting_(spreadsheet, "schema_version")) || SCHEMA_VERSION,
    revision: revision,
    checksum: revisionRow ? String(revisionRow.checksum_sha256 || "") : "",
    publishedAt: revisionRow && revisionRow.published_at ? new Date(revisionRow.published_at).toISOString() : "",
    configs: configs
  };
}

function applyOverrideRow_(document, row) {
  var nodeType = String(row.node_type).toUpperCase();
  var stepId = String(row.step_id || "");
  if (!stepId) throw new Error("step_id kosong pada override " + row.override_id);
  document.steps = document.steps || {};
  var step = document.steps[stepId] || (document.steps[stepId] = {});
  if (nodeType === "STEP") {
    applyCommonOverride_(step, row, false);
    return;
  }
  var sectionId = String(row.section_id || "");
  if (!sectionId) throw new Error("section_id kosong pada override " + row.override_id);
  step.sections = step.sections || {};
  var section = step.sections[sectionId] || (step.sections[sectionId] = {});
  if (nodeType === "SECTION") {
    applyCommonOverride_(section, row, true);
    return;
  }
  if (nodeType !== "FIELD") throw new Error("node_type tidak valid: " + nodeType);
  var fieldKey = String(row.field_key || "");
  if (!fieldKey) throw new Error("field_key kosong pada override " + row.override_id);
  section.fields = section.fields || {};
  var field = section.fields[fieldKey] || (section.fields[fieldKey] = {});
  applyCommonOverride_(field, row, false);
  if (hasValue_(row.required)) field.required = toBoolean_(row.required, false);
  if (hasValue_(row.helper_text)) field.helperText = String(row.helper_text);
}

function applyCommonOverride_(target, row, includeDescription) {
  if (hasValue_(row.enabled)) target.enabled = toBoolean_(row.enabled, false);
  if (hasValue_(row.custom_label)) target.label = String(row.custom_label);
  if (hasValue_(row.sort_order)) target.order = Number(row.sort_order);
  if (includeDescription && hasValue_(row.description)) target.description = String(row.description);
}

function flattenConfigs_(configs, revision) {
  var documents = [];
  var overrides = [];
  ["IMPORT", "EXPORT"].forEach(function (domain) {
    var config = configs[domain];
    config.documents.forEach(function (document) {
      documents.push({
        revision: revision,
        domain: domain,
        document_id: document.id,
        label: document.label,
        description: valueOrBlank_(document.description),
        default_requires_quarantine: Boolean(document.defaultRequiresQuarantine),
        archived: Boolean(document.archived),
        source_version: config.version
      });
      Object.keys(document.steps || {}).forEach(function (stepId) {
        var step = document.steps[stepId];
        if (hasAnyKey_(step, ["enabled", "label", "order"])) overrides.push(overrideObject_(revision, domain, document.id, "STEP", stepId, "", "", step));
        Object.keys(step.sections || {}).forEach(function (sectionId) {
          var section = step.sections[sectionId];
          if (hasAnyKey_(section, ["enabled", "label", "description", "order"])) overrides.push(overrideObject_(revision, domain, document.id, "SECTION", stepId, sectionId, "", section));
          Object.keys(section.fields || {}).forEach(function (fieldKey) {
            overrides.push(overrideObject_(revision, domain, document.id, "FIELD", stepId, sectionId, fieldKey, section.fields[fieldKey]));
          });
        });
      });
    });
  });
  var ids = {};
  overrides.forEach(function (row) {
    if (ids[row.override_id]) throw new Error("Duplicate override_id: " + row.override_id);
    ids[row.override_id] = true;
  });
  return { documents: documents, overrides: overrides };
}

function overrideObject_(revision, domain, documentId, nodeType, stepId, sectionId, fieldKey, value) {
  return {
    revision: revision,
    override_id: [domain, documentId, nodeType, stepId, sectionId, fieldKey].filter(Boolean).join(":"),
    domain: domain,
    document_id: documentId,
    node_type: nodeType,
    step_id: stepId,
    section_id: sectionId,
    field_key: fieldKey,
    enabled: Object.prototype.hasOwnProperty.call(value, "enabled") ? value.enabled : "",
    required: Object.prototype.hasOwnProperty.call(value, "required") ? value.required : "",
    custom_label: valueOrBlank_(value.label),
    description: valueOrBlank_(value.description),
    helper_text: valueOrBlank_(value.helperText),
    sort_order: Object.prototype.hasOwnProperty.call(value, "order") ? value.order : ""
  };
}

function validateConfigs_(configs) {
  if (!configs || typeof configs !== "object") throw new Error("configs wajib berupa object.");
  ["IMPORT", "EXPORT"].forEach(function (domain) {
    var config = configs[domain];
    if (!config || !Number.isInteger(Number(config.version)) || !Array.isArray(config.documents)) throw new Error("Config " + domain + " tidak valid.");
    var ids = {};
    config.documents.forEach(function (document) {
      if (!document || !String(document.id || "").trim() || !String(document.label || "").trim()) throw new Error(domain + ": document id/label wajib diisi.");
      if (ids[document.id]) throw new Error(domain + ": duplicate document id " + document.id + ".");
      ids[document.id] = true;
      validateStepTree_(domain, document);
    });
  });
}

function validateStepTree_(domain, document) {
  Object.keys(document.steps || {}).forEach(function (stepId) {
    var step = document.steps[stepId];
    validateOrder_(domain + "/" + document.id + "/" + stepId, step.order);
    Object.keys(step.sections || {}).forEach(function (sectionId) {
      var section = step.sections[sectionId];
      validateOrder_(domain + "/" + document.id + "/" + stepId + "/" + sectionId, section.order);
      Object.keys(section.fields || {}).forEach(function (fieldKey) {
        if (!fieldKey.trim()) throw new Error("field key kosong pada " + domain + "/" + document.id + ".");
        validateOrder_(domain + "/" + document.id + "/" + stepId + "/" + sectionId + "/" + fieldKey, section.fields[fieldKey].order);
      });
    });
  });
}

function validateOrder_(path, value) {
  if (value !== undefined && value !== null && value !== "" && !Number.isFinite(Number(value))) throw new Error("order tidak valid pada " + path + ".");
}

function validateWorkbookStructure_(spreadsheet) {
  Object.keys(HEADERS).forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet wajib tidak ditemukan: " + sheetName);
    var actual = sheet.getRange(1, 1, 1, HEADERS[sheetName].length).getDisplayValues()[0];
    HEADERS[sheetName].forEach(function (header, index) {
      if (String(actual[index]).trim() !== header) throw new Error("Header " + sheetName + " kolom " + (index + 1) + " harus " + header + ".");
    });
  });
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty(PROPERTY_SPREADSHEET_ID);
  if (!id) throw new Error("Project belum disetup. Jalankan Form Configuration > Setup Project.");
  return SpreadsheetApp.openById(id);
}

function getSetting_(spreadsheet, key) {
  var sheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index += 1) if (String(values[index][0]) === key) return values[index][1];
  throw new Error("Setting tidak ditemukan: " + key);
}

function setSetting_(spreadsheet, key, value) {
  var sheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index += 1) {
    if (String(values[index][0]) === key) {
      sheet.getRange(index + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value, "Created by Apps Script"]);
}

function readObjects_(sheet, headers) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).filter(function (row) {
    return row.some(hasValue_);
  }).map(function (row) {
    var result = {};
    headers.forEach(function (header, index) { result[header] = row[index]; });
    return result;
  });
}

function appendObjects_(sheet, headers, objects) {
  if (!objects.length) return;
  var rows = objects.map(function (object) {
    return headers.map(function (header) { return Object.prototype.hasOwnProperty.call(object, header) ? object[header] : ""; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function maxRevision_(sheet) {
  return readObjects_(sheet, HEADERS.Revisions).reduce(function (max, row) { return Math.max(max, Number(row.revision) || 0); }, 0);
}

function archivePublishedRevision_(sheet, revision) {
  var values = sheet.getDataRange().getValues();
  var revisionIndex = HEADERS.Revisions.indexOf("revision");
  var statusIndex = HEADERS.Revisions.indexOf("status");
  for (var index = 1; index < values.length; index += 1) {
    if (Number(values[index][revisionIndex]) === revision && String(values[index][statusIndex]).toUpperCase() === "PUBLISHED") {
      sheet.getRange(index + 1, statusIndex + 1).setValue("ARCHIVED");
    }
  }
}

function filterPayload_(payload, requestedDomain, requestedDocumentId) {
  var domain = String(requestedDomain || "").toUpperCase();
  var documentId = String(requestedDocumentId || "");
  if (!domain && !documentId) return payload;
  if (domain && domain !== "IMPORT" && domain !== "EXPORT") throw new Error("domain harus IMPORT atau EXPORT.");
  var copy = JSON.parse(JSON.stringify(payload));
  Object.keys(copy.configs).forEach(function (key) {
    if (domain && key !== domain) delete copy.configs[key];
    else if (documentId) copy.configs[key].documents = copy.configs[key].documents.filter(function (document) { return document.id === documentId; });
  });
  return copy;
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error("Request body kosong.");
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error("Request body harus JSON valid.");
  }
}

function verifyPublishKey_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty(PROPERTY_PUBLISH_KEY);
  if (!expected) throw new Error("Publish key belum dikonfigurasi.");
  if (!constantTimeEquals_(String(provided || ""), expected)) throw new Error("Publish key tidak valid.");
}

function constantTimeEquals_(left, right) {
  var difference = left.length ^ right.length;
  var length = Math.max(left.length, right.length);
  for (var index = 0; index < length; index += 1) difference |= (left.charCodeAt(index % Math.max(left.length, 1)) || 0) ^ (right.charCodeAt(index % Math.max(right.length, 1)) || 0);
  return difference === 0;
}

function sha256Hex_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)
    .map(function (byte) { return (byte + 256).toString(16).slice(-2); })
    .join("");
}

function canonicalStringify_(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalStringify_).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(function (key) { return JSON.stringify(key) + ":" + canonicalStringify_(value[key]); }).join(",") + "}";
  return JSON.stringify(value);
}

function normalizeDomain_(value) {
  var domain = String(value || "").toUpperCase();
  if (domain !== "IMPORT" && domain !== "EXPORT") throw new Error("Domain tidak valid: " + value);
  return domain;
}

function toBoolean_(value, fallback) {
  if (typeof value === "boolean") return value;
  if (!hasValue_(value)) return fallback;
  var normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "ya"].indexOf(normalized) >= 0) return true;
  if (["false", "0", "no", "tidak"].indexOf(normalized) >= 0) return false;
  throw new Error("Nilai boolean tidak valid: " + value);
}

function hasAnyKey_(object, keys) {
  return keys.some(function (key) { return Object.prototype.hasOwnProperty.call(object, key); });
}

function hasValue_(value) {
  return value !== "" && value !== null && value !== undefined;
}

function valueOrBlank_(value) {
  return hasValue_(value) ? value : "";
}

function errorMessage_(error) {
  return error && error.message ? String(error.message) : String(error);
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

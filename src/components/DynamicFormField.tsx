import { Input, Select } from "./FormControls";

export type DynamicFieldDefinition = {
  id: string;
  label: string;
  inputType: "text" | "number" | "date" | "select" | "checkbox";
  readOnly?: boolean;
  required?: boolean;
  helperText?: string;
  options?: Array<{ label: string; value: string }>;
};

export function DynamicFormField({
  field,
  value,
  onChange,
}: {
  field: DynamicFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.inputType === "select") {
    const configuredOptions = field.options !== undefined
      ? field.options
      : [
          { label: `Pilihan ${field.label} 1`, value: `${field.id}-1` },
          { label: `Pilihan ${field.label} 2`, value: `${field.id}-2` },
        ];
    const waitingForParentRecord = field.options !== undefined && field.options.length === 0;
    const options = value && !configuredOptions.some((option) => option.value === value)
      ? [{ label: value, value }, ...configuredOptions]
      : configuredOptions;
    return (
      <Select
        label={field.label}
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={`Pilih ${field.label.toLowerCase()}`}
        required={field.required}
        disabled={field.readOnly || waitingForParentRecord}
        searchable
        preserveOptions
        hint={field.readOnly ? "Nilai diisi otomatis oleh sistem." : waitingForParentRecord ? "Tambahkan record induk terlebih dahulu." : field.helperText}
      />
    );
  }

  if (field.inputType === "checkbox") {
    return (
      <label className="flex min-h-11 items-center gap-3 rounded-md border border-border-primary bg-white px-3 text-[12px] text-neutral-700">
        <input
          type="checkbox"
          checked={value === "true"}
          disabled={field.readOnly}
          onChange={(event) => onChange(event.target.checked ? "true" : "")}
          className="h-4 w-4 accent-brand-primary-500"
        />
        <span className="font-medium">
          {field.label}
          {field.required ? <span className="ml-1 text-error-500">*</span> : null}
        </span>
      </label>
    );
  }

  return (
    <Input
      label={field.label}
      type={field.inputType}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      readOnly={field.readOnly}
      requiredMark={field.required}
      placeholder={field.readOnly ? "Terisi otomatis" : field.label}
      hint={field.readOnly ? "Nilai diisi otomatis oleh sistem." : field.helperText}
    />
  );
}

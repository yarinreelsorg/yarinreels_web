export default function CampoTexto({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-secondary">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-secondary/40 focus:border-foreground/40"
      />
    </label>
  );
}

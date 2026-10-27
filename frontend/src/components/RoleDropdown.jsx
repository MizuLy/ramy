import Dropdown from "./Dropdown";

const ROLE_OPTIONS = [
  { value: "USER", label: "USER" },
  { value: "ADMIN", label: "ADMIN" },
];

export default function RoleDropdown({ value, onChange }) {
  return (
    <Dropdown
      value={value}
      options={ROLE_OPTIONS}
      onChange={onChange}
      menuWidth={112}
      triggerClassName={`rounded-lg border px-2.5 py-1 text-xs ${
        value === "ADMIN"
          ? "border-accent/40 bg-accent/15 text-accent-soft"
          : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-accent/50 hover:text-white"
      }`}
    />
  );
}

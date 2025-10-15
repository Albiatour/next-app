"use client"

export function InputField({ id, label, type = "text", value, onChange, required, placeholder, error, className = "", autoComplete, min, max, step, pattern, inputMode }) {
  return (
    <div className={"relative mt-6 " + className}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder=" "
        min={min}
        max={max}
        step={step}
        pattern={pattern}
        inputMode={inputMode}
        className={[
          "peer w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900",
          "shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-inset focus:border-[var(--brand)]",
          error ? "border-red-400" : ""
        ].join(" ")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label
        htmlFor={id}
        className={[
          "pointer-events-none absolute left-4 top-3 text-zinc-500 text-sm transition-all duration-200",
          "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-500",
          "peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[var(--brand)] peer-focus:bg-white peer-focus:px-1",
          "peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-zinc-700 peer-[&:not(:placeholder-shown)]:bg-white peer-[&:not(:placeholder-shown)]:px-1"
        ].join(" ")}
      >
        {label}{required ? " *" : ""}
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function TextareaField({ id, label, value, onChange, required, error, className = "" }) {
  return (
    <div className={"relative mt-6 " + className}>
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        className={[
          "peer w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 min-h-[96px]",
          "shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-inset focus:border-[var(--brand)]",
          error ? "border-red-400" : ""
        ].join(" ")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label
        htmlFor={id}
        className={[
          "pointer-events-none absolute left-4 top-3 text-zinc-500 text-sm transition-all duration-200",
          "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-500",
          "peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[var(--brand)] peer-focus:bg-white peer-focus:px-1",
          "peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-zinc-700 peer-[&:not(:placeholder-shown)]:bg-white peer-[&:not(:placeholder-shown)]:px-1"
        ].join(" ")}
      >
        {label}{required ? " *" : ""}
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function SelectField({ id, label, value, onChange, required, error, className = "", children }) {
  return (
    <div className={"relative mt-6 " + className}>
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={[
          "peer w-full appearance-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900",
          "shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-inset focus:border-[var(--brand)]",
          error ? "border-red-400" : ""
        ].join(" ")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value=""></option>
        {children}
      </select>
      <label
        htmlFor={id}
        className={[
          "pointer-events-none absolute left-4 top-3 text-zinc-500 text-sm transition-all duration-200",
          "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-500",
          "peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[var(--brand)] peer-focus:bg-white peer-focus:px-1",
          "peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-zinc-700 peer-[&:not(:placeholder-shown)]:bg-white peer-[&:not(:placeholder-shown)]:px-1"
        ].join(" ")}
      >
        {label}{required ? " *" : ""}
      </label>
      <svg className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}



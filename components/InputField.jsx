"use client"

export function InputField({ id, label, type = "text", value, onChange, required, placeholder, error, className = "", autoComplete }) {
  return (
    <div className={"space-y-2 md:space-y-2.5 " + className}>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-600 mb-1.5">
        {label}{required ? " *" : ""}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={[
          "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900",
          "shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset focus:border-emerald-500",
          error ? "border-red-400" : ""
        ].join(" ")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function TextareaField({ id, label, value, onChange, required, error, className = "" }) {
  return (
    <div className={"space-y-2 md:space-y-2.5 " + className}>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-600 mb-1.5">
        {label}{required ? " *" : ""}
      </label>
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=""
        className={[
          "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 min-h-[96px]",
          "shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset focus:border-emerald-500",
          error ? "border-red-400" : ""
        ].join(" ")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function SelectField({ id, label, value, onChange, required, error, className = "", children }) {
  return (
    <div className={"space-y-2 md:space-y-2.5 " + className}>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-600 mb-1.5">
        {label}{required ? " *" : ""}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          className={[
            "w-full appearance-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900",
            "shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset focus:border-emerald-500",
            error ? "border-red-400" : ""
          ].join(" ")}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value=""></option>
          {children}
        </select>
        <svg className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}



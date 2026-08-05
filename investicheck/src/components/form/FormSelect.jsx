import './FormField.css'

// A reusable dropdown. "options" is just an array of strings, so the same
// component can render the Country list, the Investment Category list,
// the Duration list, etc. — only the array passed in changes.
function FormSelect({ id, label, optional = false, error, options, placeholder, ...selectProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="form-field__optional"> (Optional)</span>}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...selectProps}
      >
        <option value="">{placeholder || 'Select an option'}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <p className="form-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormSelect

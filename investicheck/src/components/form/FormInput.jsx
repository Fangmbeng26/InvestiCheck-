import './FormField.css'

// A single reusable text-style input. Every page (Login, Register,
// CheckInvestment, Contact) renders its fields by calling this component
// with different props, instead of each page writing its own
// label + input + error markup from scratch.
function FormInput({
  id,
  label,
  optional = false,
  error,
  type = 'text',
  ...inputProps
}) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="form-field__optional"> (Optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...inputProps}
      />
      {error && (
        <p className="form-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormInput

import './FormField.css'

function FormCheckbox({ id, label, error, ...inputProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="form-field form-field--checkbox">
      <input
        id={id}
        type="checkbox"
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...inputProps}
      />
      <div>
        <label htmlFor={id}>{label}</label>
        {error && (
          <p className="form-field__error" id={errorId}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default FormCheckbox

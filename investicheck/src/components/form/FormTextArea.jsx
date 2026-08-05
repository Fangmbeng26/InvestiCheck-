import './FormField.css'

function FormTextArea({ id, label, optional = false, error, ...textareaProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="form-field__optional"> (Optional)</span>}
      </label>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...textareaProps}
      />
      {error && (
        <p className="form-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormTextArea

import './AnswerToggle.css'

const OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: "Don't know" },
]

function AnswerToggle({ value, onChange, name }) {
  return (
    <div className="answer-toggle" role="radiogroup" aria-label={name}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`answer-toggle__option ${value === option.value ? 'answer-toggle__option--active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default AnswerToggle
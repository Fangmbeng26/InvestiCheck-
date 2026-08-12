import { Check, HelpCircle, X } from 'lucide-react'
import './ChoiceGroup.css'

// Three explicit answers rather than a checkbox or a yes/no pair.
//
// A visitor who has only seen a platform advertised often cannot honestly say
// whether, for example, users have had withdrawals refused. Forcing that into
// "no" would quietly lower the platform's risk score and tell them it is safer
// than the evidence supports. "Not sure" is therefore a first-class answer:
// it leaves the score untouched and lowers the confidence figure instead.
const CHOICES = [
  { value: 'yes', label: 'Yes', icon: Check },
  { value: 'no', label: 'No', icon: X },
  { value: 'unknown', label: 'Not sure', icon: HelpCircle },
]

function ChoiceGroup({ id, question, help, value, onChange }) {
  const helpId = `${id}-help`

  return (
    <fieldset className="choice-group">
      <legend className="choice-group__question">{question}</legend>
      {help && (
        <p className="choice-group__help" id={helpId}>
          {help}
        </p>
      )}

      <div className="choice-group__options" role="radiogroup" aria-describedby={help ? helpId : undefined}>
        {CHOICES.map((choice) => {
          const Icon = choice.icon
          const isSelected = value === choice.value

          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`choice-group__option choice-group__option--${choice.value} ${
                isSelected ? 'is-selected' : ''
              }`}
              onClick={() => onChange(id, choice.value)}
            >
              <Icon size={16} strokeWidth={2.5} />
              {choice.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default ChoiceGroup

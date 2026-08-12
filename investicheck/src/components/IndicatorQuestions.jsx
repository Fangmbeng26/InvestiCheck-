import AnswerToggle from '../pages/AnswerToggle.jsx'
import './IndicatorQuestion.css'

function IndicatorQuestion({ question, help, value, onChange }) {
  return (
    <div className="indicator-question">
      <p className="indicator-question__text">{question}</p>
      {help && <p className="indicator-question__help">{help}</p>}
      <AnswerToggle value={value} onChange={onChange} name={question} />
    </div>
  )
}
 
export default IndicatorQuestion
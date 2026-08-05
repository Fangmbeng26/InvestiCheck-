import { useState } from 'react'
import { Mail, Clock } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import FormTextArea from '../components/form/FormTextArea.jsx'
import './Contact.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const faqs = [
  {
    question: 'Is InvestiCheck a financial advisor?',
    answer:
      'No. InvestiCheck highlights common warning signs so you can research further — it does not provide investment or legal advice.',
  },
  {
    question: 'Is my submitted platform information stored?',
    answer:
      'Not yet. The current version of the app runs entirely in your browser and does not send data to a server.',
  },
  {
    question: 'How is a risk score calculated?',
    answer:
      'The scoring engine is still being built. Right now the app demonstrates the interface using placeholder results.',
  },
]

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.name.trim()) nextErrors.name = 'Name is required.'

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!EMAIL_PATTERN.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.subject.trim()) nextErrors.subject = 'Subject is required.'
    if (!formData.message.trim()) nextErrors.message = 'Message is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(false)

    if (!validate()) return

    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <>
      <Navbar />
      <main className="contact-page">
        <div className="container">
          <PageHeader
            eyebrow="Get in touch"
            title="Contact InvestiCheck"
            subtitle="Questions, feedback, or a platform you'd like us to look into? Send us a message."
          />

          <div className="contact-page__grid">
            <FormCard as="form" onSubmit={handleSubmit} noValidate>
              {submitted && (
                <p className="auth-page__success">
                  Thanks — your message was validated. Sending isn't connected to a backend yet.
                </p>
              )}

              <FormInput
                id="name"
                name="name"
                label="Name"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              <FormInput
                id="email"
                name="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
              <FormInput
                id="subject"
                name="subject"
                label="Subject"
                placeholder="What's this about?"
                value={formData.subject}
                onChange={handleChange}
                error={errors.subject}
              />
              <FormTextArea
                id="message"
                name="message"
                label="Message"
                rows={5}
                placeholder="Tell us more..."
                value={formData.message}
                onChange={handleChange}
                error={errors.message}
              />

              <PrimaryButton type="submit" className="contact-page__submit">
                Send Message →
              </PrimaryButton>
            </FormCard>

            <aside className="contact-info">
              <div className="contact-info__item">
                <Mail size={20} />
                <div>
                  <p className="contact-info__label">Email</p>
                  <p className="contact-info__value">support@investicheck.com</p>
                </div>
              </div>
              <div className="contact-info__item">
                <Clock size={20} />
                <div>
                  <p className="contact-info__label">Office Hours</p>
                  <p className="contact-info__value">Mon – Fri, 9:00 AM – 5:00 PM</p>
                </div>
              </div>
            </aside>
          </div>

          <section className="contact-faq">
            <SectionTitle title="Frequently Asked Questions" />
            <div className="contact-faq__list">
              {faqs.map((faq) => (
                <details className="contact-faq__item" key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Contact

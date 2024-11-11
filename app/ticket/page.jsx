"use client"

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import * as jwt from 'jsonwebtoken'
import { useRouter } from 'next/navigation'

const LanguagesPage = () => {
  const router = useRouter()
  const [languages, setLanguages] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [developer, setDeveloper] = useState(null)
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [decodedToken, setDecodedToken] = useState(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Decode the token and extract user data
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwt.decode(token)
        setDecodedToken(decoded)
      } catch (error) {
        console.error('Invalid token:', error)
        setErrorMessage('Error decoding token')
      }
    }
  }, [token])

  // Fetch programming languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get('http://localhost:8000/languages', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success) {
          setLanguages(response.data.data)
        } else {
          setErrorMessage('Failed to fetch languages')
        }
      } catch (error) {
        console.error('Error fetching languages:', error)
        setErrorMessage('Error fetching languages')
      }
    }

    fetchLanguages()
  }, [token])

  // Assign a developer to a language
  const handleAssignDeveloper = async (languageId) => {
    try {
      const response = await axios.post(
        'http://localhost:8000/assign-developer',
        { language_id: languageId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.developer_id) {
        setDeveloper(response.data)
        setSelectedLanguage(languageId)
        setErrorMessage('')
        setSuccessMessage('Developer assigned successfully!')
      } else {
        setDeveloper(null)
        setErrorMessage('No available developer found')
      }
    } catch (error) {
      console.error('Error assigning developer:', error)
      setErrorMessage('Error assigning developer')
    }
  }

  // Submit a ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!selectedLanguage || !ticketTitle || !ticketMessage) {
      setErrorMessage('Please fill in all fields before submitting')
      return
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/tickets',
        {
          language_id: selectedLanguage,
          title: ticketTitle,
          initial_message: ticketMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.status === 201 && response.data.success) {
        setSuccessMessage('Ticket created successfully!')
        setTimeout(() => router.push('/ticket/list'), 1500)
      } else {
        setErrorMessage('Ticket created, but redirection failed')
      }
    } catch (error) {
      console.error('Error sending ticket:', error.response?.data || error.message)
      setErrorMessage(error.response?.data?.error || 'Unknown error occurred')
    }
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-start p-4">
      {/* User Information Section */}
      <header className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">User Information</h1>
        {decodedToken ? (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p><strong>ID:</strong> {decodedToken.id}</p>
            <p><strong>Phone Number:</strong> {decodedToken.phoneNumber}</p>
            <p><strong>Role:</strong> {decodedToken.role}</p>
            <p><strong>Expires at:</strong> {new Date(decodedToken.exp * 1000).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-red-500">Failed to decode token</p>
        )}
      </header>

      {/* Programming Languages Section */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Programming Languages</h1>

        {/* Language Selection */}
        <div className="space-y-4">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => handleAssignDeveloper(language.id)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium text-center transition"
            >
              {language.name}
            </button>
          ))}
        </div>

        {/* Error or Success Messages */}
        {errorMessage && <p className="text-red-500 text-center mt-4">{errorMessage}</p>}
        {successMessage && <p className="text-green-500 text-center mt-4">{successMessage}</p>}

        {/* Ticket Form */}
        {developer && (
          <form onSubmit={handleSubmitTicket} className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Send a Ticket to {developer.name || 'Developer'}
            </h2>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
              <input
                type="text"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                required
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Initial Message</label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                required
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium transition"
            >
              Send Ticket
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

export default LanguagesPage

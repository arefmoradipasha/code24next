"use client"

import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const Page = () => {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpReceived, setOtpReceived] = useState(false)
  const [message, setMessage] = useState('')
  const [log, setLog] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://localhost:8000/auth/register', { phoneNumber })
      setOtpReceived(true)
      setMessage(response.data.message)
      setLog(`OTP received: ${response.data.otp} (Expires at: ${response.data.expireat})`)
    } catch (error) {
      setMessage('Error: Unable to send OTP')
      setLog(`Error: ${error.message}`)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://localhost:8000/auth/verifyOTP', { phoneNumber, otp })
      const { token } = response.data

      // ذخیره توکن در Local Storage
      localStorage.setItem('token', token)

      setMessage('Login successful')
      setLog(`Token stored in Local Storage`)
      
      // هدایت کاربر به صفحه iclet
      router.push('/ticket')
    } catch (error) {
      setMessage('Error: Incorrect OTP')
      setLog(`Error: ${error.message}`)
    }
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Sign in with Phone Number
            </h1>
            {!otpReceived ? (
              <form className="space-y-4 md:space-y-6" onSubmit={handleRegister}>
                <div>
                  <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone Number</label>
                  <input type="text" name="phone" id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="09334245784" required />
                </div>
                <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700">Request OTP</button>
              </form>
            ) : (
              <form className="space-y-4 md:space-y-6" onSubmit={handleVerifyOTP}>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
                </div>
                <div>
                  <label htmlFor="otp" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Enter OTP</label>
                  <input type="text" name="otp" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Enter OTP" required />
                </div>
                <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700">Verify OTP</button>
              </form>
            )}
            {log && (
              <div className="mt-4 p-4 bg-gray-100 rounded dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Log:</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{log}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Page

import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface NotificationProps {
      message: string
      type: 'success' | 'error'
      onClose: () => void
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
      const [isVisible, setIsVisible] = useState(true)

      useEffect(() => {
            const timer = setTimeout(() => {
                  setIsVisible(false)
                  onClose()
            }, 3000)

            return () => clearTimeout(timer)
      }, [onClose])

      if (!isVisible) return null

      return (
            <div
                  className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out ${
                        type === 'success' ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}
            >
                  <div className="flex items-center">
                        {type === 'success' ? (
                              <CheckCircle className="w-6 h-6 mr-2" />
                        ) : (
                              <XCircle className="w-6 h-6 mr-2" />
                        )}
                        <p>{message}</p>
                  </div>
            </div>
      )
}

export default Notification

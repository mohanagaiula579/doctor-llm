// pages/index.js
"use client"
import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [specialty, setSpecialty] = useState(null);
  const [topDoctors, setTopDoctors] = useState(null);
  const [radiusKm, setRadiusKm] = useState(20); // Default radius
  const [city, setCity] = useState(''); // City input
  const [sessionId, setSessionId] = useState(''); // Session ID
  const messagesEndRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Generate session ID when component mounts
  useEffect(() => {
    // Generate a unique session ID
    const newSessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    setSessionId(newSessionId);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, followUpQuestions, topDoctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage = { role: 'user', content: inputValue };
    const updatedMessages = [...messages, userMessage];   
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setFollowUpQuestions([]);
    setSpecialty(null);
    setTopDoctors(null);

    try {
      // Update conversation history
      const updatedHistory = [...conversationHistory, inputValue];
      setConversationHistory(updatedHistory);
      
      const response = await fetch('https://health-assistant-482245532835.asia-south1.run.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "session_id": sessionId,
          "message": inputValue,
          "radius_km": radiusKm,
          "city": city,
          // "history": updatedHistory
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      console.log(data, "data from api")
      
      // Add assistant response to messages
      if (data) {
        setMessages(prev => [...prev, { role: 'assistant', content: data }]);
      }
      
      if (data.followup_questions) {
        setFollowUpQuestions(data.followup_questions);
      }
      
      if (data.specialty) {
        setSpecialty(data.specialty);
      }
      
      if (data.top_doctors) {
        setTopDoctors(data.top_doctors);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <Head>
        <title>Health Assistant</title>
        <meta name="description" content="Chat with our AI assistant" />
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-800 mb-2">Health Assistant</h1>
          <p className="text-indigo-600">Ask me anything about your health</p>
        </header>

        {/* Location and radius inputs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius (km)
              </label>
              <input
                type="number"
                id="radius"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value) || 20)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Session ID: {sessionId}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Chat messages */}
          <div className="h-96 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}
                >
                  {typeof msg.content === "string" ? msg.content :
                    <>
                      {msg.content.specialty && !msg.content.need_followups && (
                        <div className="mb-4 flex justify-start">
                          <div className="bg-blue-50 text-blue-800 rounded-lg px-4 py-2 max-w-md border border-blue-100">
                            <div className="font-semibold">Recommended Specialty:</div>
                            <div>{specialty}</div>
                          </div>
                        </div>
                      )}

                      {/* Top Doctors */}
                      {(( msg.content?.recommendations?.length) || (msg.content?.candidates?.length) ) && (
                        <div className="mb-4 flex justify-start">
                          <div className="bg-green-50 text-green-800 rounded-lg px-4 py-2 max-w-md border border-green-100">
                            <div className="font-semibold mb-2">Recommended Doctors:</div>
                            <ul className="space-y-2">
                              {(msg.content?.recommendations.length ?msg.content?.recommendations: msg.content.candidates.slice(0,5)).map((doctor, index) => (
                                <li key={index} className="border-b border-green-100 pb-2 last:border-0">
                                  <div className="font-medium">{doctor.name}</div>
                                  {(doctor["address"]|| doctor["area"]) && <div className="text-sm">Location: {doctor["address"]|| doctor["area"]}</div>}
                                  {(doctor["rating"] || doctor["google_rating"]) && <div className="text-sm">Rating: {doctor["rating"] || doctor["google_rating"]}</div>}
                                  {(doctor["reviews_count"] || doctor["total_reviews"]) && <div className="text-sm">Total reviews: { (doctor["reviews_count"] || doctor["total_reviews"])}</div>}
                                  {doctor.why_recommended && <div className="text-sm">Summary: {doctor.why_recommended}</div>}
                                  {doctor.maps_url && <Link className='text-red-500' href={doctor.maps_url}>Google Map Link</Link>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Follow-up questions */}
                      {msg.content?.followup_questions && msg.content?.followup_questions?.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-2">Follow-up questions: please answer these questions</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {msg.content?.followup_questions.map((question, index) => (
                              <button
                                key={index}
                                onClick={() => handleQuickQuestion(question)}
                                className="text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-3 py-2 rounded-lg border border-indigo-100 transition-colors text-sm"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  }
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none px-4 py-2 max-w-xs">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question here..."
                className="flex-grow px-4 py-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className={`px-6 py-2 rounded-r-lg ${isLoading || !inputValue.trim() 
                  ? 'bg-indigo-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium transition-colors`}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>AI Assistant v1.0 · Responses may vary in accuracy</p>
        </footer>
      </div>
    </div>
  );
}
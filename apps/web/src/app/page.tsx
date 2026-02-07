/**
 * Home page
 * Landing page for betterMind
 */

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Title */}
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            better<span className="text-primary-600">Mind</span>
          </h1>
          
          {/* Tagline */}
          <p className="text-2xl text-gray-600 mb-8">
            AI-Assisted Mental Wellness Platform
          </p>
          
          {/* Description */}
          <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            A non-clinical platform for guided reflection and journaling. 
            Talk to an AI companion that understands your journey and helps you 
            explore your thoughts and feelings in a safe, supportive space.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-primary-600"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-3">AI Conversations</h3>
            <p className="text-gray-600">
              Chat with an empathetic AI that adapts to your unique situation and challenges.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-semibold mb-3">Voice Support</h3>
            <p className="text-gray-600">
              Communicate through text or voice. Hear responses in natural, soothing voices.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-3">Private & Secure</h3>
            <p className="text-gray-600">
              Your conversations are private. Delete them anytime. Your data, your control.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> betterMind is not a substitute for professional mental health care. 
              If you're experiencing a mental health crisis, please contact a licensed professional or 
              call a crisis helpline immediately.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

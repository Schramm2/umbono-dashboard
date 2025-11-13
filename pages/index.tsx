import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Umbono - AI Evaluation Dashboard</title>
        <meta name="description" content="AI evaluation dashboard for testing and rating AI models" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Umbono
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI Evaluation Dashboard
          </p>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Phase 1 Setup Complete
            </h2>
            <p className="text-gray-600 mb-4">
              Your Next.js project is ready with:
            </p>
            <ul className="text-left list-disc list-inside space-y-2 text-gray-700">
              <li>Next.js 14 with TypeScript</li>
              <li>Tailwind CSS configured</li>
              <li>Supabase client setup</li>
              <li>API routes structure</li>
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Test your API endpoint: <code className="bg-gray-100 px-2 py-1 rounded">/api/models</code>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home


import Link from "next/link";

export default function Api() {
    return (
        <div
        id="api"
        className="bg-gray-100 border-t border-gray-300 min-h-screen w-full flex flex-col gap-8 px-[5%] py-8"
      >
        <div className="relative flex flex-col items-center p-6 w-full text-center text-black">

          <h1 className="text-[2.5em] md:text-[4em] font-bold mb-6">
            PhantomSign API
          </h1>
          <p className="text-black text-[1.2em] mb-8">
            PhantomSign offers a simple and effective API to extract
            verification codes and links from temporary email addresses.
          </p>

          <p className="text-black mb-8">
            All API requests require a valid API key, which should be provided as a header:
          </p>

          <p className="text-black mb-8">
            All endpoints are rate-limited to 20 requests/minute per IP
          </p>

          <div className="w-full flex flex-col md:flex-row items-center gap-4 justify-center mb-16">

            <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
              <span className="text-gray-600">x-api-key</span>
              <span>[API KEY]</span>
            </code>

            <Link
                className="bg-black text-white px-4 py-2 rounded-md"
                href="/dashboard/keys"
            >
              Generate an API key
            </Link>

          </div>

          <div className="w-full flex gap-8 flex-col md:flex-row">

            <div className="w-full md:w-1/3 flex flex-col gap-2">

              <h1 className="text-[1.4em] font-bold mb-4">Create inbox</h1>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">POST</span>
                <span>/api/generate-inbox</span>
              </code>

              <h2 className="font-bold">Responses</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;inbox&quot;: [email]</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">401</span>
                <span>&quot;error&quot;: [API key error]</span>
              </code>

            </div>

            <div className="w-full md:w-1/3 flex flex-col gap-2">

              <h1 className="text-[1.4em] font-bold mb-4">Poll inbox</h1>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-yellow-600">GET</span>
                <span>/api/poll-inbox?inbox=[email]</span>
              </code>

              <h2 className="font-bold">Responses</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;message&quot;: &quot;Awaiting email&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <div className="flex flex-col items-start">
                  <span>&#123;</span>
                  <span>&quot;code&quot;: [Verification code]</span>
                  <span>&quot;company&quot;: [Company name]</span>
                  <span>&#125;</span>
                </div>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <div className="flex flex-col items-start">
                  <span>&#123;</span>
                  <span>&quot;link&quot;: [Verification link]</span>
                  <span>&quot;company&quot;: [Company name]</span>
                  <span>&#125;</span>
                </div>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;message&quot;: &quot;Email lacks content&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">400</span>
                <span>&quot;error&quot;: &quot;No inbox provided&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">401</span>
                <span>&quot;error&quot;: [API key error]</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">404</span>
                <span>&quot;error&quot;: &quot;Inbox not found&quot;</span>
              </code>
              
            </div>

            <div className="w-full md:w-1/3 flex flex-col gap-2">

              <h1 className="text-[1.4em] font-bold mb-4">Delete inbox</h1>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">DELETE</span>
                <span>/api/delete-inbox</span>
              </code>

              <h2 className="font-bold">Request</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">Body</span>
                <span>&#123;&quot;inbox&quot;: [email]&#125;</span>
              </code>

              <h2 className="font-bold">Responses</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;message&quot;: &quot;Inbox deleted&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">400</span>
                <span>&quot;error&quot;: &quot;No inbox provided&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">403</span>
                <span>&quot;error&quot;: [API key error]</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">404</span>
                <span>&quot;error&quot;: &quot;Inbox not found&quot;</span>
              </code>
              
            </div>

          </div>

          
        </div>
      </div>
    );
  }
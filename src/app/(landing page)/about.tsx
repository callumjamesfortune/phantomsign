
export default function About() {
  return (
    <div
        id="about"
        className="bg-white flex flex-col w-full gap-8 px-[5%] py-8"
      >
        <div className="w-full flex items-center">
          <div className="w-full md:w-1/2 items-center bg-white rounded-md p-4 text-right">
            <h2 className="text-[1.5em] mb-2">Generate an email</h2>

            <p>
              PhantomSign will create a temporary email address that is valid
              for up to 5 minutes.
            </p>
          </div>
          <h1 className="text-gray-200 px-8 text-[4em]">1</h1>
        </div>

        <div className="w-full flex items-center justify-end">
          <h1 className="text-gray-200 px-8 text-[4em]">2</h1>
          <div className="w-full md:w-1/2 items-center bg-white rounded-md p-4">
            <h2 className="text-[1.5em] mb-2">Use it for signups</h2>

            <p>
              The PhantomSign email can be used to signup to a service of your
              choice that may require the email to be verified.
            </p>
          </div>
        </div>

        <div className="w-full flex items-center">
          <div className="w-full md:w-1/2 items-center bg-white rounded-md p-4 text-right">
            <h2 className="text-[1.5em] mb-2">Receive code or link</h2>

            <p>
              PhantomSign will try to extract the verification code or link from
              the verification email and output it straight to your screen.
            </p>

          </div>
          <h1 className="text-gray-200 px-8 text-[4em]">3</h1>
        </div>
      </div>
  );
}
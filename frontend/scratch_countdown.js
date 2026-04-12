const fs = require('fs');
let code = fs.readFileSync('./src/components/AuthForm.jsx', 'utf8');

// 1. Add resendCountdown state
code = code.replace(/const \[isOtpStep, setIsOtpStep\] = useState\(false\);/, 'const [isOtpStep, setIsOtpStep] = useState(false);\n  const [resendCountdown, setResendCountdown] = useState(0);');

// 2. Add useEffect for timer
const timerHook = `
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);
`;
code = code.replace(/useEffect\(\(\) => \{\n\s*if \(isAuthenticated && user\) \{/, timerHook + '\n  useEffect(() => {\n    if (isAuthenticated && user) {');

// 3. Update the send-otp success block (Step 1)
code = code.replace(
  /await api\.post\("\/auth\/send-otp", payload\);\n\s*setSuccess\("An OTP has been sent to your email\. Please check your inbox\."\);\n\s*setIsOtpStep\(true\);/g,
  'const res = await api.post("/auth/send-otp", payload);\n          setSuccess("An OTP has been sent to your email. Please check your inbox.");\n          setIsOtpStep(true);\n          if (res.data?.waitLimit) setResendCountdown(res.data.waitLimit);'
);

// 4. Update the Enter OTP input size
code = code.replace(
  /className="w-full rounded-lg border border-blue-200 p-3 focus:outline-none focus:ring-2 focus:ring-ocean\/50 text-center tracking-widest text-lg font-bold bg-white"/g,
  'className="w-40 mx-auto block rounded-lg border border-blue-200 p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50 text-center tracking-widest text-[22px] font-bold bg-white"'
);

// 5. Update the Resend Button inside OTP block
// The existing buttons are:
const buttonRegex = /<div className="mt-3 flex items-center justify-between">.*?<\/div>\s*<\/div>\s*\)\}/s;

const newButtons = `
               <div className="mt-5 flex items-center justify-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => {
                        setIsOtpStep(false);
                        setSuccess("");
                        setError("");
                    }} 
                    className="px-4 py-2 text-[13px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Change Email
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                        setLoading(true);
                        setError("");
                        setSuccess("");
                        try {
                           const res = await api.post("/auth/send-otp", {
                               name: form.name,
                               email: form.email,
                               password: form.password
                           });
                           setSuccess("A new OTP has been sent to your email.");
                           if (res.data?.waitLimit) setResendCountdown(res.data.waitLimit);
                        } catch (err) {
                           setError(err?.response?.data?.message || "Failed to resend OTP.");
                           const waitMatch = err?.response?.data?.message?.match(/wait (\\d+) seconds/);
                           if (waitMatch) setResendCountdown(parseInt(waitMatch[1]));
                        } finally {
                           setLoading(false);
                        }
                    }} 
                    disabled={loading || resendCountdown > 0}
                    className="px-4 py-2 text-[13px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCountdown > 0 ? \`Resend (\${resendCountdown}s)\` : "Resend Code"}
                  </button>
              </div>
           </div>
        )}
`;

code = code.replace(buttonRegex, newButtons);

// Center the label "Enter OTP"
code = code.replace(
  /<label className="mb-1 block text-sm font-medium text-slate-700">Enter OTP <span className="text-red-500">\*<\/span><\/label>/g,
  '<label className="mb-2 block text-sm font-medium text-slate-700 text-center">Enter OTP <span className="text-red-500">*</span></label>'
);

fs.writeFileSync('./src/components/AuthForm.jsx', code);
console.log('Done rewriting AuthForm.jsx');

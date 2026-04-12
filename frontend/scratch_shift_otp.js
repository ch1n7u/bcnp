const fs = require('fs');
let content = fs.readFileSync('./src/components/AuthForm.jsx', 'utf8');

// The goal is to move the OTP block to right below the email block and stop hiding the other fields.

// 1. Remove the ternary for isOtpStep
content = content.replace(/\{!isOtpStep \? \(/, '');
content = content.replace(/\) : \(\s*<div className="mt-5 space-y-4">\s*<div className="rounded-lg bg-blue-50(.*?)\s*\)\}/s, '');

// Now we need to insert the OTP block after the Email block.
// Find the Email block:
const emailBlockRegex = /(<div>\s*<label className="mb-1 block text-sm font-medium text-slate-700">Email.*?<\/div>)/s;

const otpBlock = `
          {isRegister && isOtpStep && (
             <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 text-blue-800 text-sm mt-2 mb-2">
                 <div className="flex items-start gap-3">
                     <svg className="h-5 w-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <p>We've sent a 6-digit confirmation code to <strong>{form.email}</strong>. The code will expire in 10 minutes.</p>
                 </div>
                 
                 <div className="mt-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Enter OTP <span className="text-red-500">*</span></label>
                    <input
                    type="text"
                    placeholder="123456"
                    className="w-full rounded-lg border border-blue-200 p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50 text-center tracking-widest text-lg font-bold bg-white"
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                    required={isOtpStep}
                    maxLength={6}
                    />
                 </div>
                 
                 <div className="text-right mt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                          setIsOtpStep(false);
                          setSuccess("");
                          setError("");
                      }} 
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors underline"
                    >
                      Change Email / Resend
                    </button>
                </div>
             </div>
          )}
`;

content = content.replace(emailBlockRegex, "$1\n" + otpBlock);

// What about required fields? If isOtpStep is true, password and confirmPassword are still required, which is fine because they are still there and filled.
// But wait, the submit logic:
// If \!isOtpStep, it validates password and sends OTP.
// If isOtpStep, it verifies OTP. But since Password is part of the form and required, if they change the password, it won't be sent again unless they resend OTP!
// Wait, the backend stores the password hash during send-otp!
// If they change the password string in the input AFTER sending OTP, the backend won't know unless they resend the OTP.
// To fix this, we should disable Name, Email, Password, ConfirmPassword when isOtpStep is true!

content = content.replace(/<input\s+placeholder="e\.g\. Aman Thakur"/g, '<input placeholder="e.g. Aman Thakur" disabled={isOtpStep}');
content = content.replace(/type="email"\s+placeholder="e\.g\. citizen@gmail\.com"/g, 'type="email" placeholder="e.g. citizen@gmail.com" disabled={isOtpStep}');
content = content.replace(/type=\{showPassword \? "text" : "password"\}\s+placeholder="••••••••"/g, 'type={showPassword ? "text" : "password"} placeholder="••••••••" disabled={isOtpStep}');
content = content.replace(/type=\{showConfirmPassword \? "text" : "password"\}\s+placeholder="••••••••"/g, 'type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" disabled={isOtpStep}');

fs.writeFileSync('./src/components/AuthForm.jsx', content);
console.log('Moved OTP block successfully and disabled fields effectively.');

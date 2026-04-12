const fs = require('fs');

let content = fs.readFileSync('./src/components/AuthForm.jsx', 'utf8');

// 1. Remove captcha answer from state
content = content.replace(/,\s*captchaAnswer:\s*["']["']/g, '');

// 2. Remove captcha store/state
content = content.replace(/\/\/\s*Captcha State\s*const\s*\[captchaData,\s*setCaptchaData\]\s*=\s*useState\(\{.*?\}\);\s*/, '');

// 3. Remove loadCaptcha and its useEffect
content = content.replace(/const loadCaptcha = useCallback\(async \(\) => \{.+?\}, \[isRegister, isOtpStep, loadCaptcha\]\);\s*/s, '');

// 4. Remove verification block
content = content.replace(/if \(!form\.captchaAnswer\) \{.+?return;\s*\}/s, '');

// 5. Remove captcha from payload
content = content.replace(/,\s*captchaId:\s*captchaData\.id,\s*captchaAnswer:\s*form\.captchaAnswer/s, '');

// 6. Remove loadCaptcha from catch block
content = content.replace(/\/\/\s*Refresh captcha on failure\s*loadCaptcha\(\);\s*/s, '');

// 7. Remove captcha JSX rendering
content = content.replace(/\{isRegister && captchaData\.svg && \(.*?<\/\div>\s*\n\s*\)\}/s, '');

// 8. Remove reset captcha on go back
content = content.replace(/loadCaptcha\(\);\s*\/\/\s*Reset captcha on go back/s, '');

fs.writeFileSync('./src/components/AuthForm.jsx', content);
console.log('Done!');

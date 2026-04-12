const { z } = require("zod");

// Known free consumer email providers that are NOT company emails
const FREE_CONSUMER_DOMAINS = new Set([
  // Yahoo
  "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "yahoo.fr", "yahoo.de",
  "yahoo.es", "yahoo.it", "yahoo.com.au", "yahoo.com.ar", "yahoo.com.br",
  "yahoo.com.mx", "ymail.com", "rocketmail.com",
  // Microsoft
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.it",
  "hotmail.es", "hotmail.com.br", "hotmail.com.ar", "hotmail.com.mx",
  "outlook.com", "outlook.co.uk", "outlook.fr", "outlook.de", "outlook.in",
  "live.com", "live.co.uk", "live.fr", "live.com.au", "live.in",
  "msn.com", "passport.com",
  // Apple
  "icloud.com", "me.com", "mac.com",
  // AOL
  "aol.com", "aol.co.uk", "aim.com",
  // Other big free providers
  "protonmail.com", "proton.me",
  "tutanota.com", "tuta.io",
  "zohomail.com", "zoho.com",
  "gmx.com", "gmx.de", "gmx.net", "gmx.us", "gmx.at",
  "web.de", "freenet.de",
  "rediffmail.com",
  "inbox.com",
  "mail.com", "email.com", "usa.com", "post.com", "europe.com",
  "null.com"
]);

// Known disposable / temp-mail providers
const TEMP_MAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info", "spam4.me",
  "trashmail.com", "trashmail.net", "trashmail.me", "trashmail.at",
  "trashmail.io", "trashmail.xyz", "throwam.com", "throwaway.email",
  "tempmail.com", "tempmail.net", "temp-mail.org", "temp-mail.io",
  "10minutemail.com", "10minutemail.net", "10minutemail.org", "10minemail.com",
  "yopmail.com", "yopmail.fr", "fakeinbox.com", "mailnull.com",
  "spamgourmet.com", "maildrop.cc", "spambox.us", "dispostable.com",
  "mailnesia.com", "mailzilla.com", "sharklasers.com", "grr.la",
  "discard.email", "spamgap.com", "tempr.email", "getnada.com",
  "inboxbear.com", "tmpmail.org", "tmpmail.net", "gettempmail.com",
  "emailondeck.com", "moakt.com", "mohmal.com", "mailtemp.info",
  "tempmail.ninja", "burnermail.io", "mytemp.email", "dropmail.me",
  "armyspy.com", "dayrep.com", "einrot.com", "fleckens.hu",
  "gustr.com", "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us",
  "cuvox.de", "mailexpire.com", "spamcorptastic.com",
]);

const isAllowedEmail = (val) => {
  const domain = val.toLowerCase().split("@")[1];
  if (!domain) return false;
  // Explicitly allow Gmail
  if (domain === "gmail.com" || domain === "googlemail.com") return true;
  // Block temp/disposable mail
  if (TEMP_MAIL_DOMAINS.has(domain)) return false;
  // Block known free consumer providers
  if (FREE_CONSUMER_DOMAINS.has(domain)) return false;
  // All other domains are treated as company/org emails — allow them
  return true;
};

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z
    .string()
    .trim()
    .email()
    .refine(isAllowedEmail, {
      message: "Spam mail detected, can't register."
    }),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

const sendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .refine(isAllowedEmail, {
      message: "Spam mail detected, can't register."
    })
});

module.exports = {
  registerSchema,
  sendOtpSchema,
  loginSchema
};


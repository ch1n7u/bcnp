"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaAmazonPay, FaChevronDown, FaMoneyCheckDollar } from "react-icons/fa6";
import { SiPaytm, SiPhonepe } from "react-icons/si";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const crimeTypes = [
  { value: "Phishing", label: "Phishing Scam" },
  { value: "Online fraud", label: "Online Fraud" },
  { value: "UPI scams", label: "UPI Scam" },
  { value: "Social media harassment", label: "Social Media Harassment" },
  { value: "Identity theft", label: "Identity Theft" },
  { value: "Cryptocurrency scams", label: "Cryptocurrency Scam" },
  { value: "Fake websites", label: "Fake Website Scam" }
];

const defaultStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Outside India"
];

const defaultCitiesByState = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Other"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Tawang", "Pasighat", "Other"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Other"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Other"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Other"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Other"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Other"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Hisar", "Other"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Other"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Other"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Other"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Other"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Other"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Other"],
  Manipur: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Other"],
  Meghalaya: ["Shillong", "Tura", "Jowai", "Nongpoh", "Other"],
  Mizoram: ["Aizawl", "Lunglei", "Champhai", "Kolasib", "Other"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung", "Wokha", "Other"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Other"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Other"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Other"],
  Sikkim: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Other"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Other"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Other"],
  Tripura: ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Other"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Varanasi", "Other"],
  Uttarakhand: ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Other"],
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder", "Rangat", "Other"],
  Chandigarh: ["Chandigarh", "Other"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Silvassa", "Diu", "Other"],
  Delhi: ["New Delhi", "North Delhi", "South Delhi", "Dwarka", "Other"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Other"],
  Ladakh: ["Leh", "Kargil", "Nubra", "Other"],
  Lakshadweep: ["Kavaratti", "Agatti", "Minicoy", "Other"],
  Puducherry: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Other"],
  "Outside India": ["Other"]
};

const defaultPaymentApps = ["GPay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "Mobikwik", "Other"];

const anonymousAllowedCrimeTypes = new Set(["Fake websites", "Phishing", "Social media harassment"]);

const scamFieldConfig = {
  Phishing: [
    { key: "senderContact", label: "Sender Email / Phone", placeholder: "Example: support@bank-alert.com" },
    { key: "phishingLink", label: "Phishing Link / URL", placeholder: "https://..." }
  ],
  "Online fraud": [
    { key: "platformName", label: "Platform / Website Name", placeholder: "Example: Marketplace name" },
    { key: "orderOrReferenceId", label: "Order / Reference ID", placeholder: "Example: ORD123456" }
  ],
  "UPI scams": [
    {
      key: "receiverUpiId",
      label: "Receiver UPI ID",
      placeholder: "example@upi",
      pattern: /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/,
      errorMessage: "Enter a valid UPI ID (example@upi)."
    },
    {
      key: "transactionId",
      label: "Transaction ID / UTR",
      placeholder: "Example: 123456789012",
      pattern: /^[A-Za-z0-9-]{8,30}$/,
      errorMessage: "Enter a valid transaction/UTR ID (8-30 letters/numbers)."
    },
    {
      key: "paymentApp",
      label: "Payment App Used",
      placeholder: "Select payment app",
      options: defaultPaymentApps
    }
  ],
  "Social media harassment": [
    { key: "platformName", label: "Platform", placeholder: "Example: Instagram / X / Facebook" },
    { key: "profileHandle", label: "Offender Profile / Handle", placeholder: "@username or profile link" }
  ],
  "Identity theft": [
    { key: "compromisedDocument", label: "Compromised Document Type", placeholder: "Example: Aadhaar / PAN / Passport" },
    { key: "suspectedMisuse", label: "How It Was Misused", placeholder: "Example: Loan opened in my name" }
  ],
  "Cryptocurrency scams": [
    { key: "walletAddress", label: "Recipient Wallet Address", placeholder: "0x... or wallet address" },
    { key: "transactionHash", label: "Transaction Hash", placeholder: "Blockchain transaction hash" }
  ],
  "Fake websites": [
    { key: "fraudWebsite", label: "Fraud Website URL", placeholder: "https://..." },
    { key: "impersonatedBrand", label: "Impersonated Brand / Service", placeholder: "Example: Bank name / Government portal" }
  ]
};

const phonePattern = /^\d{10,15}$/;
const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function formatAmountWithCommas(value) {
  const [whole = "", decimal = ""] = String(value || "").split(".");
  if (!whole) return decimal ? `0.${decimal}` : "";

  const lastThree = whole.slice(-3);
  const otherDigits = whole.slice(0, -3);
  const groupedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const wholeWithCommas = groupedOther ? `${groupedOther},${lastThree}` : lastThree;
  return decimal ? `${wholeWithCommas}.${decimal}` : wholeWithCommas;
}

function buildSuspectDetails(crimeType, scamDetails, additionalNotes) {
  const fields = scamFieldConfig[crimeType] || [];
  const detailLines = fields
    .map((field) => {
      const value = (scamDetails[field.key] || "").trim();
      return value ? `- ${field.label}: ${value}` : null;
    })
    .filter(Boolean);

  const notes = additionalNotes.trim();
  if (detailLines.length === 0 && !notes) return "";

  return ["Type-specific details:", ...detailLines, notes ? `Additional notes: ${notes}` : ""]
    .filter(Boolean)
    .join("\n");
}

function getTodayLocalDate() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function build24HourTime({ hour, minute, period }) {
  if (!hour || !minute || !period) return "";

  let hour24 = Number(hour) % 12;
  if (period === "PM") hour24 += 12;

  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

function PaymentAppIcon({ appName }) {
  const normalized = String(appName || "").toLowerCase();

  if (normalized === "gpay") {
    return (
      <span
        className="inline-flex h-5 min-w-10 items-center justify-center rounded-md border border-slate-200 bg-white px-1 text-[10px] font-bold leading-none"
        aria-hidden="true"
      >
        <span className="text-blue-600">G</span>
        <span className="text-rose-500">P</span>
        <span className="text-amber-500">a</span>
        <span className="text-emerald-600">y</span>
      </span>
    );
  }

  if (normalized === "phonepe") {
    return <SiPhonepe className="h-5 w-5 text-violet-700" aria-hidden="true" />;
  }

  if (normalized === "paytm") {
    return <SiPaytm className="h-5 w-5 text-sky-700" aria-hidden="true" />;
  }

  if (normalized === "amazon pay") {
    return <FaAmazonPay className="h-5 w-5 text-amber-600" aria-hidden="true" />;
  }

  return <FaMoneyCheckDollar className="h-5 w-5 text-slate-500" aria-hidden="true" />;
}

export default function ReportForm() {
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [form, setForm] = useState({
    victimName: "",
    email: "",
    phoneNumber: "",
    crimeType: "Phishing",
    description: "",
    incidentDate: "",
    incidentTime: "",
    suspectDetails: "",
    financialLossAmount: "",
    state: "",
    city: ""
  });
  const [paymentAppOptions, setPaymentAppOptions] = useState(defaultPaymentApps);
  const [stateOptions, setStateOptions] = useState(defaultStates);
  const [scamDetails, setScamDetails] = useState({});
  const [isPaymentAppMenuOpen, setIsPaymentAppMenuOpen] = useState(false);
  const [incidentTimeParts, setIncidentTimeParts] = useState({ hour: "", minute: "", period: "" });
  const paymentAppMenuRef = useRef(null);
  const isAnonymous = !isAuthenticated;
  const allowedAnonymousTypesLabel = "Fake Website Scams, Phishing Scams, and Social Media Harassment";
  const visibleCrimeTypes = isAnonymous
    ? crimeTypes.filter((type) => anonymousAllowedCrimeTypes.has(type.value))
    : crimeTypes;

  useEffect(() => {
    // Keep selected type valid when auth state changes.
    if (!visibleCrimeTypes.some((type) => type.value === form.crimeType)) {
      setForm((prev) => ({ ...prev, crimeType: visibleCrimeTypes[0]?.value || "Phishing" }));
    }
  }, [form.crimeType, visibleCrimeTypes]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!paymentAppMenuRef.current?.contains(event.target)) {
        setIsPaymentAppMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReportOptions = async () => {
      try {
        const { data } = await api.get("/reports/options");
        if (!isMounted) return;

        if (Array.isArray(data?.paymentApps) && data.paymentApps.length > 0) {
          setPaymentAppOptions(data.paymentApps);
        }

        if (Array.isArray(data?.states) && data.states.length > 0) {
          setStateOptions(data.states);
        }
      } catch (_error) {
        // Keep fallback list when options API is unavailable.
      }
    };

    loadReportOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedScamFields = scamFieldConfig[form.crimeType] || [];
  const cityOptions = form.state ? defaultCitiesByState[form.state] || ["Other"] : [];

  useEffect(() => {
    // Keep only fields that belong to the currently selected scam type.
    const allowedKeys = new Set(selectedScamFields.map((field) => field.key));
    setScamDetails((prev) => {
      const next = {};
      for (const key of Object.keys(prev)) {
        if (allowedKeys.has(key)) next[key] = prev[key];
      }
      return next;
    });
  }, [form.crimeType, selectedScamFields]);

  const updateScamField = (key, value) => {
    setScamDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleFinancialLossAmountChange = (value) => {
    const rawValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");

    if (!rawValue) {
      setForm((prev) => ({ ...prev, financialLossAmount: "" }));
      return;
    }

    const [wholePart, decimalPart] = rawValue.split(".");
    const sanitizedWhole = wholePart.replace(/^0+(?=\d)/, "") || "0";
    const sanitizedDecimal = decimalPart !== undefined ? decimalPart.slice(0, 2) : undefined;

    const normalized =
      sanitizedDecimal !== undefined
        ? `${sanitizedWhole}.${sanitizedDecimal}`
        : sanitizedWhole;

    setForm((prev) => ({
      ...prev,
      financialLossAmount: formatAmountWithCommas(normalized)
    }));
  };

  const updateIncidentTime = (nextPart) => {
    setIncidentTimeParts((prev) => {
      const updated = { ...prev, ...nextPart };
      setForm((currentForm) => ({
        ...currentForm,
        incidentTime: build24HourTime(updated)
      }));
      return updated;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (isAnonymous && !anonymousAllowedCrimeTypes.has(form.crimeType)) {
      setMessage(
        `Please log in to report ${form.crimeType}. Anonymous reporting is allowed only for ${allowedAnonymousTypesLabel}.`
      );
      return;
    }

    const cleanedPhoneNumber = form.phoneNumber.replace(/\D/g, "");
    if (!phonePattern.test(cleanedPhoneNumber)) {
      setMessage("Please enter a valid phone number with 10 to 15 digits.");
      return;
    }

    if (!form.incidentDate || !form.incidentTime) {
      setMessage("Please provide the incident date and time.");
      return;
    }

    if (!form.state || !form.city) {
      setMessage("Please select both state and city.");
      return;
    }

    const incidentDate = new Date(`${form.incidentDate}T${form.incidentTime}`);
    if (Number.isNaN(incidentDate.getTime())) {
      setMessage("Please provide a valid incident date and time.");
      return;
    }

    if (incidentDate > new Date()) {
      setMessage("Incident date and time cannot be in the future.");
      return;
    }

    for (const field of selectedScamFields) {
      const value = String(scamDetails[field.key] || "").trim();
      if (!value) {
        setMessage(`Please fill in: ${field.label}.`);
        return;
      }

      if (field.pattern && !field.pattern.test(value)) {
        setMessage(field.errorMessage || `Please enter a valid value for ${field.label}.`);
        return;
      }
    }

    if (!screenshotFile) {
      setMessage("Please upload a screenshot as supporting evidence.");
      return;
    }

    if (!screenshotFile.type.startsWith("image/")) {
      setMessage("Screenshot must be an image file (PNG/JPG/WebP).");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        victimName: form.victimName,
        email: form.email,
        crimeType: form.crimeType,
        description: form.description,
        location: `${form.city}, ${form.state}`,
        phoneNumber: cleanedPhoneNumber,
        incidentDateTime: incidentDate.toISOString(),
        suspectDetails: buildSuspectDetails(form.crimeType, scamDetails, form.suspectDetails),
        financialLossAmount: Number(String(form.financialLossAmount || "0").replace(/,/g, ""))
      };

      const { data } = await api.post("/reports", payload);

      try {
        const evidenceData = new FormData();
        evidenceData.append("evidence", screenshotFile);
        await api.post(`/evidence/${data.report_id}`, evidenceData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMessage(`Report submitted successfully with screenshot evidence. Report ID: ${data.report_id}`);
      } catch (_uploadError) {
        setMessage(`Report submitted successfully (Report ID: ${data.report_id}), but screenshot upload failed.`);
      }

      setScreenshotFile(null);
    } catch (error) {
      const data = error?.response?.data;
      if (Array.isArray(data?.errors) && data.errors.length) {
        const details = data.errors
          .map((item) => `${item.path || "field"}: ${item.message}`)
          .join(" | ");
        setMessage(`Validation failed: ${details}`);
      } else {
        setMessage(data?.message || "Submission failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-4 shadow-2xl backdrop-blur sm:p-6 md:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-coral/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-ocean/15 blur-2xl" />

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl md:text-4xl">Cyber Crime Report</h1>
      <p className="mt-2 text-sm text-slate-600">Fill in the details accurately.</p>
      {isAnonymous && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          You are reporting anonymously. Allowed scam types: {allowedAnonymousTypesLabel}. For UPI scams, cryptocurrency scams, online fraud, or identity theft, please{" "}
          <Link href="/login" className="font-semibold underline">
            log in
          </Link>
          .
        </p>
      )}

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Victim Name</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          placeholder="Victim name"
          value={form.victimName}
          onChange={(e) => setForm({ ...form, victimName: e.target.value })}
          required
        />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Email Address</span>
          <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Phone Number</span>
          <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          type="tel"
          placeholder="Phone number"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/[^0-9]/g, "") })}
          inputMode="numeric"
          maxLength={15}
          required
        />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Scam Type</span>
          <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          value={form.crimeType}
          onChange={(e) => setForm({ ...form, crimeType: e.target.value })}
        >
          {visibleCrimeTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Incident Date</span>
          <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          type="date"
          value={form.incidentDate}
          onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
          max={getTodayLocalDate()}
          required
        />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Incident Time</span>
          <div className="grid grid-cols-3 gap-2">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              value={incidentTimeParts.hour}
              onChange={(e) => updateIncidentTime({ hour: e.target.value })}
              required
            >
              <option value="" disabled>
                Hour
              </option>
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              value={incidentTimeParts.minute}
              onChange={(e) => updateIncidentTime({ minute: e.target.value })}
              required
            >
              <option value="" disabled>
                Minute
              </option>
              {minuteOptions.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              value={incidentTimeParts.period}
              onChange={(e) => updateIncidentTime({ period: e.target.value })}
              required
            >
              <option value="" disabled>
                AM/PM
              </option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <span className="text-xs text-slate-500">Select hour, minute, and AM/PM</span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Financial Loss Amount</span>
          <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 1,25,000"
          value={form.financialLossAmount}
          onChange={(e) => handleFinancialLossAmountChange(e.target.value)}
        />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">State</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value, city: "" })}
            required
          >
            <option value="" disabled>
              Select state
            </option>
            {stateOptions.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">City</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            disabled={!form.state}
            required
          >
            <option value="" disabled>
              {form.state ? "Select city" : "Select state first"}
            </option>
            {cityOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Additional Suspect Details (Optional)</span>
          <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          placeholder="Additional suspect details (optional)"
          value={form.suspectDetails}
          onChange={(e) => setForm({ ...form, suspectDetails: e.target.value })}
        />
        </label>

        <div className="rounded-2xl border border-ocean/20 bg-ocean/[0.04] p-4 md:col-span-2">
          <p className="font-semibold text-ocean">Scam-specific details for {crimeTypes.find((t) => t.value === form.crimeType)?.label}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {selectedScamFields.map((field) => (
              <label key={field.key} className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                {field.options ? (
                  field.key === "paymentApp" ? (
                    <div className="relative" ref={paymentAppMenuRef}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                        onClick={() => setIsPaymentAppMenuOpen((prev) => !prev)}
                        aria-haspopup="listbox"
                        aria-expanded={isPaymentAppMenuOpen}
                      >
                        {scamDetails[field.key] ? (
                          <span className="flex items-center gap-2">
                            <PaymentAppIcon appName={scamDetails[field.key]} />
                            <span>{scamDetails[field.key]}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">{field.placeholder || `Select ${field.label}`}</span>
                        )}
                        <FaChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      </button>

                      <input type="hidden" value={scamDetails[field.key] || ""} required />

                      {isPaymentAppMenuOpen && (
                        <div
                          className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                          role="listbox"
                        >
                          {paymentAppOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                              onClick={() => {
                                updateScamField(field.key, option);
                                setIsPaymentAppMenuOpen(false);
                              }}
                              role="option"
                              aria-selected={scamDetails[field.key] === option}
                            >
                              <PaymentAppIcon appName={option} />
                              <span>{option}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                    value={scamDetails[field.key] || ""}
                    onChange={(e) => updateScamField(field.key, e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {field.placeholder || `Select ${field.label}`}
                    </option>
                    {(field.key === "paymentApp" ? paymentAppOptions : field.options).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  )
                ) : (
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                    placeholder={field.placeholder}
                    value={scamDetails[field.key] || ""}
                    onChange={(e) => updateScamField(field.key, e.target.value)}
                    required
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-coral/25 bg-coral/[0.05] p-4 md:col-span-2">
          <p className="font-semibold text-coral">Screenshot Evidence (Required)</p>
          <p className="mt-1 text-sm text-slate-600">Upload a screenshot related to this incident. Accepted: PNG, JPG, WEBP.</p>
          <input
            className="mt-3 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
            required
          />
          {screenshotFile && <p className="mt-2 text-sm">Selected: {screenshotFile.name}</p>}
        </div>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Incident Description</span>
          <textarea
          className="min-h-40 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20 md:col-span-2"
          placeholder="Incident description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        </label>
        <button
          className="w-full rounded-xl bg-coral px-5 py-3 font-semibold text-white shadow-lg shadow-coral/30 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
      {message && <p className="mt-4 rounded-xl border border-sand bg-sand p-3 text-sm text-slate-700">{message}</p>}
    </section>
  );
}

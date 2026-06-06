const { supabaseAdmin } = require("./src/config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Helper to hash files (SHA-256)
function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function seedData() {
  console.log("Starting database seeding of high-fidelity demo cases...");

  try {
    // 1. Fetch or create users
    const { data: adminUser, error: adminErr } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("email", "arjitkuiri@gmail.com")
      .maybeSingle();

    if (adminErr) throw new Error("Error fetching admin: " + adminErr.message);
    if (!adminUser) {
      console.log("Admin user 'arjitkuiri@gmail.com' not found. Please run the server once to bootstrap predefined users.");
      return;
    }
    console.log(`Found Admin User: ${adminUser.name} (${adminUser.email})`);

    // Let's find or create an investigator user by email
    let { data: investigatorUser } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("email", "rajesh.kumar@cybercell.gov.in")
      .maybeSingle();

    if (!investigatorUser) {
      const pwHash = await bcrypt.hash("Investigator@123", 12);
      const { data: newInv, error: invErr } = await supabaseAdmin
        .from("users")
        .insert({
          name: "Inspector Rajesh Kumar",
          email: "rajesh.kumar@cybercell.gov.in",
          password_hash: pwHash,
          role: "investigator"
        })
        .select()
        .single();
      if (invErr) throw new Error("Error creating investigator: " + invErr.message);
      investigatorUser = newInv;
      console.log(`Created Investigator User: ${investigatorUser.name}`);
    } else {
      console.log(`Found Investigator User: ${investigatorUser.name} (${investigatorUser.email})`);
    }

    // Let's find or create a citizen user by email
    let { data: citizenUser } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("email", "sharmarajesh88@gmail.com")
      .maybeSingle();

    if (!citizenUser) {
      const pwHash = await bcrypt.hash("Citizen@123", 12);
      const { data: newCit, error: citErr } = await supabaseAdmin
        .from("users")
        .insert({
          name: "Rajesh Sharma",
          email: "sharmarajesh88@gmail.com",
          password_hash: pwHash,
          role: "citizen"
        })
        .select()
        .single();
      if (citErr) throw new Error("Error creating citizen: " + citErr.message);
      citizenUser = newCit;
      console.log(`Created Citizen User: ${citizenUser.name}`);
    } else {
      console.log(`Found Citizen User: ${citizenUser.name} (${citizenUser.email})`);
    }

    // We will insert the additional Indian cybercrime cases.
    const reportsData = [
      {
        victim_name: "Rohan Mehta",
        email: "rohan.mehta99@gmail.com",
        phone_number: "+91 9922883344",
        crime_type: "Part-Time Job / Telegram Task Scam",
        description: "I was contacted on WhatsApp by a recruiter offering a part-time job liking YouTube videos and rating hotels on Google Maps for quick money. Initially, they paid me ₹150 for doing basic ratings to build trust. Then they migrated me to a Telegram channel named 'VIP Wealth Growth Tasks' run by admin @Nisha_HR_Manager. They asked me to deposit funds for cryptocurrency trade tasks with high payouts. I deposited ₹1,80,000 across four separate UPI payments. When I requested a withdrawal of my returns, they claimed my score was low and demanded an additional deposit of ₹75,000 to clear the withdrawal.",
        incident_datetime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        suspect_details: "Telegram Channel: @VIP_Wealth_Growth\nAdmin Handle: @Nisha_HR_Manager\nSuspect UPI IDs:\n- business-grow@paytm\n- securewealth@icici\nYes Bank Beneficiary Account: 981273982739",
        financial_loss_amount: 180000.00,
        location: "Karnataka",
        status: "Investigation",
        assigned_investigator_id: investigatorUser.id,
        user_id: citizenUser.id
      },
      {
        victim_name: "Suresh Chandra",
        email: "suresh.chandra@outlook.com",
        phone_number: "+91 9810123456",
        crime_type: "Electricity Bill Disconnection Fraud",
        description: "Received an urgent SMS warning that my home electricity connection would be disconnected at 9:30 PM tonight due to non-payment of previous month's dues. The message urged me to call the 'Electricity Officer' Mr. Sharma at +91 9900887766. Upon calling, he instructed me to install a remote desktop application called 'QuickSupport' on my mobile device to verify the bill. Once the remote access was shared, my device was compromised and a sum of ₹75,000 was unauthorizedly debited from my bank app via UPI.",
        incident_datetime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        suspect_details: "SMS Sender: VM-ELCTCTY\nSuspect Mobile Number: +91 9900887766\nQuickSupport Remote ID: 928 381 293\nBeneficiary Account: IndusInd Bank A/C 409283723827 (Deepak Kumar)",
        financial_loss_amount: 75000.00,
        location: "Delhi",
        status: "Under Review",
        assigned_investigator_id: null,
        user_id: citizenUser.id
      },
      {
        victim_name: "Amit Trivedi",
        email: "trivedi.amit@yahoo.in",
        phone_number: "+91 9414099887",
        crime_type: "OLX UPI QR Code Fraud",
        description: "I listed my used refrigerator for sale on OLX for ₹15,000. Within an hour, a buyer named 'Vikram Singh' claiming to be an Indian Army soldier contacted me. He agreed to the price and sent me a WhatsApp message containing a Google Pay QR code. He stated that scanning the QR code and entering my UPI PIN was required for me to 'receive' the advance payment of ₹15,000. Upon scanning and entering my PIN, the sum of ₹15,000 was debited from my account instead of being credited.",
        incident_datetime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        suspect_details: "WhatsApp Contact: +91 91223 34455 (uses army personnel photo)\nQR Code String: upi://pay?pa=army-vikram@okaxis&am=15000\nUPI Ref Number: 610238491823",
        financial_loss_amount: 15000.00,
        location: "Rajasthan",
        status: "Submitted",
        assigned_investigator_id: null,
        user_id: citizenUser.id
      }
    ];

    for (const report of reportsData) {
      console.log(`Inserting report for ${report.victim_name} (${report.crime_type})...`);
      const { data: newReport, error: repErr } = await supabaseAdmin
        .from("reports")
        .insert(report)
        .select()
        .single();

      if (repErr) {
        console.error("Failed to insert report:", repErr.message);
        continue;
      }

      console.log(`Created Report ID: ${newReport.report_id}`);

      // Log timeline event for creation
      await supabaseAdmin.from("case_timeline").insert({
        report_id: newReport.report_id,
        action_type: "REPORT_SUBMITTED",
        actor_id: citizenUser.id,
        actor_role: "citizen",
        metadata: {
          ip_address: "103.112.45.19",
          user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1"
        }
      });

      // Log assigned timeline if assigned
      if (newReport.assigned_investigator_id) {
        await supabaseAdmin.from("case_timeline").insert({
          report_id: newReport.report_id,
          action_type: "INVESTIGATOR_ASSIGNED",
          actor_id: adminUser.id,
          actor_role: "admin",
          metadata: {
            investigator_id: investigatorUser.id,
            investigator_name: investigatorUser.name
          }
        });

        // Insert some realistic investigator notes!
        let noteText = "";
        if (newReport.crime_type.includes("Part-Time")) {
          noteText = "Verified UPI Transaction IDs. Sent notice to Yes Bank Nodal Officer to freeze beneficiary account 981273982739. Telegram details shared with Cyber Cell tech team to locate handler metadata.";
        }

        if (noteText) {
          const { error: noteErr } = await supabaseAdmin.from("case_notes").insert({
            report_id: newReport.report_id,
            investigator_id: investigatorUser.id,
            note_text: noteText
          });
          if (noteErr) console.error("Error creating note:", noteErr.message);
          
          await supabaseAdmin.from("case_timeline").insert({
            report_id: newReport.report_id,
            action_type: "NOTE_ADDED",
            actor_id: investigatorUser.id,
            actor_role: "investigator",
            metadata: {
              note_snippet: noteText.substring(0, 60) + "..."
            }
          });
        }
      }

      // Upload realistic evidence documents
      let fileContent = "";
      let originalName = "";
      let mimeType = "";

      if (newReport.crime_type.includes("Part-Time")) {
        fileContent = `UPI Bank Statement Transfer Logs:\n1. UPI Ref: 611298492001 - ₹30,000 to business-grow@paytm\n2. UPI Ref: 611298501239 - ₹50,000 to securewealth@icici\n3. UPI Ref: 611298604928 - ₹1,00,000 to securewealth@icici`;
        originalName = "Rohan_Mehta_Transaction_Logs.txt";
        mimeType = "text/plain";
      } else if (newReport.crime_type.includes("Electricity")) {
        fileContent = `SMS Alert Received:\n"POWER DISCONNECTION WARNING - Your electricity connection will be disconnected tonight at 21:30 PM. To update bill call Mr. Sharma +919900887766."`;
        originalName = "Electricity_Disconnection_Alert_SMS.txt";
        mimeType = "text/plain";
      } else if (newReport.crime_type.includes("OLX")) {
        fileContent = `WhatsApp QR code invoice details:\nImage containing payment QR code linked to pay address: army-vikram@okaxis.\nScammed amount: ₹15,000.00`;
        originalName = "Scammed_QR_Code_Details.txt";
        mimeType = "text/plain";
      }

      const fileBuffer = Buffer.from(fileContent);
      const fileHash = sha256Buffer(fileBuffer);
      const storagePath = `${newReport.report_id}/${Date.now()}-${originalName}`;

      console.log(`Uploading evidence document: ${originalName} to Supabase storage...`);
      const { error: storageError } = await supabaseAdmin.storage
        .from("evidence-files")
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (storageError) {
        console.error("Storage upload error:", storageError.message);
      } else {
        const { error: evDbErr } = await supabaseAdmin.from("evidence").insert({
          report_id: newReport.report_id,
          file_url: storagePath,
          file_hash: fileHash,
          mime_type: mimeType,
          original_name: originalName
        });
        if (evDbErr) console.error("Error saving evidence meta in DB:", evDbErr.message);

        await supabaseAdmin.from("case_timeline").insert({
          report_id: newReport.report_id,
          action_type: "EVIDENCE_UPLOADED",
          actor_id: citizenUser.id,
          actor_role: "citizen",
          metadata: {
            original_name: originalName,
            mime_type: mimeType,
            file_hash: fileHash
          }
        });
        console.log(`Successfully uploaded & registered evidence file: ${originalName}`);
      }
    }

    console.log("Seeding complete! Additional mock cases successfully inserted.");

  } catch (err) {
    console.error("Critical error seeding data:", err);
  }
}

seedData();

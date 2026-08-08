import os
import smtplib
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import google.generativeai as genai
from bs4 import BeautifulSoup
import requests

# 1. Configuration & API Credentials
# Add your GEMINI_API_KEY, SENDER_EMAIL, and SENDER_PASSWORD (Gmail App Password) to your environment or .env
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "kharapkaratharv@gmail.com")
SENDER_PASSWORD = os.environ.get("SENDER_PASSWORD", "") # Generate Gmail App Password first

# User Profile Details (Hardcoded for Atharv Kharapkar to guarantee accurate context)
ATHARV_RESUME = {
    "name": "Atharv Kharapkar",
    "email": "kharapkaratharv@gmail.com",
    "phone": "+91-9112083787",
    "linkedin": "https://linkedin.com/in/atharv-kharapkar",
    "role": "Business Solutions Engineer / AI Product Engineer / Full Stack React Developer",
    "key_experience": [
        "System Administrator at Pundlik Prashaskiya Mahavidyalay (IT systems, Windows, security backups).",
        "Marketing Data Analyst at TruScholar (reduced manual reporting by 30% using Power BI, Tableau, SQL).",
        "AI Product Engineer at Atharv Kharapkar Software Solutions: Developed and shipped 'Lokmanya Mess' "
        "production app serving 1,000+ active members across 2 branches. Designed offline-first Electron + React "
        "local sync architecture with Firebase, integrated NPCI-compliant UPI payments, and automated WhatsApp "
        "dues reminders (recovered ~80% customer dues)."
    ],
    "skills": ["React", "Electron", "Node.js", "SQL", "Firebase Firestore", "Power BI", "Tableau", "UPI Payment Integration"]
}

# Initialize Gemini Client if API Key is available
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found. Automated personalized cover letters will fall back to template mode.")

def search_jobs(query="React Developer Amravati remote"):
    """
    Search for jobs using job board RSS or web search APIs.
    Fallback to mocked job listings to allow testing.
    """
    print(f"🔍 Searching for jobs matching: '{query}'...")
    # Mocking standard targeted jobs for demo
    mock_jobs = [
        {
            "title": "Junior Full Stack Developer (React / Node.js)",
            "company": "TechVantage Solutions",
            "location": "Remote, India",
            "hr_name": "Neha Sharma (HR Manager)",
            "hr_email": "hr@techvantagesolutions.com",
            "description": "Looking for a React developer with knowledge of Node.js and SQL to build responsive dashboards."
        },
        {
            "title": "Business Solutions Engineer",
            "company": "ScaleGrowth AI",
            "location": "Remote, India",
            "hr_name": "Rohan Deshmukh (Lead Recruiter)",
            "hr_email": "careers@scalegrowth.ai",
            "description": "Build tools and automate workflows using React, Firebase, and AI APIs. Experience with Electron is a plus."
        }
    ]
    return mock_jobs

def generate_personalized_email(job):
    """
    Generate a tailored cold email cover letter using Gemini AI.
    """
    if not GEMINI_API_KEY:
        # Fallback Template
        body = f"""Subject: Job Application - {job['title']} - Atharv Kharapkar

Dear {job['hr_name']},

I hope this email finds you well.

I am writing to express my interest in the {job['title']} position at {job['company']}. 

I recently developed and deployed a production-grade offline-first desktop app ('Lokmanya Mess') using React, Electron, and Firebase that manages 1000+ members and boosted payment recovery by 80% using UPI payment integrations. Additionally, my background as a Marketing Data Analyst at TruScholar has equipped me with strong data analytics and automation skills (Power BI, SQL).

I have attached my resume for your review. I would love the opportunity to discuss how my hands-on product engineering skills can add value to your team at {job['company']}.

Best regards,
Atharv Kharapkar
{ATHARV_RESUME['phone']} | {ATHARV_RESUME['linkedin']}"""
        return body

    # Generate with Gemini
    prompt = f"""
    You are an expert HR recruiter writing a highly personalized cold email from candidate 'Atharv Kharapkar' to '{job['hr_name']}' for the role of '{job['title']}' at '{job['company']}'.
    
    Candidate's Resume Context:
    - Name: Atharv Kharapkar
    - Key Project: 'Lokmanya Mess' desktop app (Electron, React, Firebase, Offline-first, automated WhatsApp reminders, UPI payment engine, serving 1000+ members).
    - Analytics: TruScholar Data Analyst (reduced manual reporting by 30% using Power BI, SQL).
    - Email: kharapkaratharv@gmail.com, Phone: +91-9112083787, LinkedIn: {ATHARV_RESUME['linkedin']}
    
    Job Description:
    {job['description']}
    
    Instructions:
    - Write a short, highly professional, direct cold email (under 150 words).
    - The subject line must be catchy yet professional.
    - Focus heavily on Atharv's real-world product delivery (shipping 'Lokmanya Mess' to paying clients) and data automation.
    - End with a low-friction call to action (e.g., inviting a quick call).
    - Output only the email subject and email body. No extra markdown.
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating email with Gemini: {e}")
        return None

def send_cold_email(recipient_email, subject, body, attachment_path=None):
    """
    Sends the cold email with resume attachment via Gmail SMTP.
    """
    if not SENDER_PASSWORD:
        print("❌ Cannot send email: SENDER_PASSWORD (Gmail App Password) is not configured.")
        return False
        
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body, 'plain'))
    
    if attachment_path and os.path.exists(attachment_path):
        filename = os.path.basename(attachment_path)
        with open(attachment_path, "rb") as attachment:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}",
            )
            msg.attach(part)
            
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, recipient_email, text)
        server.quit()
        print(f"✅ Email sent successfully to {recipient_email}!")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

def run_campaign(resume_pdf_path=None):
    print("🚀 Starting Atharv's Job Scout Campaign...")
    jobs = search_jobs()
    
    for i, job in enumerate(jobs, 1):
        print(f"\n--- Job {i}: {job['title']} at {job['company']} ---")
        email_content = generate_personalized_email(job)
        
        if not email_content:
            continue
            
        print("\n📝 Generated Email Draft:")
        print("----------------------------------------")
        print(email_content)
        print("----------------------------------------")
        
        # Human in the loop confirmation prompt
        choice = input(f"Would you like to send this email to {job['hr_email']}? (yes/no): ").strip().lower()
        if choice in ['yes', 'y']:
            # Try to parse subject from generated content
            lines = email_content.split('\n')
            subject = f"Job Application - {job['title']} - Atharv Kharapkar"
            body = email_content
            for line in lines:
                if line.lower().startswith('subject:'):
                    subject = line.replace('Subject:', '').strip()
                    body = email_content.replace(line, '').strip()
                    break
            
            send_cold_email(job['hr_email'], subject, body, attachment_path=resume_pdf_path)
        else:
            print("Skipped.")

if __name__ == "__main__":
    # If Atharv's resume PDF is placed in the folder, pass the file path here
    # E.g. resume_path = "assets/Atharv_Kharapkar_Resume.pdf"
    run_campaign()

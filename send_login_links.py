
import pandas as pd
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import quote

# --- CONFIGURATION ---
# You need to fill in this section

# 1. SMTP Server Settings (for sending email)
# Ask your email provider (e.g., Gmail, Outlook) for these details.
# For Gmail, you might need to create an "App Password".
SMTP_HOST = 'smtp.office365.com'  # e.g., 'smtp.gmail.com' for Gmail
SMTP_PORT = 587  # e.g., 587 for TLS
SMTP_USERNAME = 'akash@ssfglobal.org'  # Your full email address
SMTP_PASSWORD = 'vjbkrqncgsxfmzcl'    # Your email password or App Password

# 3. Data File and Column Names
DATA_FILE = 'students.csv'
NAME_COLUMN = 'Name'   # Column header for student names
EMAIL_COLUMN = 'Email'  # Column header for student emails

# 4. Moodle Login URL
LMS_LOGIN_URL = 'https://lms.siddhantaknowledge.org/login/index.php'

# 5. HTML Email Template
# You can customize this HTML template as you wish.
HTML_TEMPLATE = """
<p>Hello {user_name},</p><p>Welcome to our LMS platform! We are excited to have you onboard.</p><p>To make your first login easy, please click the link below. It will take you to the login page and pre-fill your email address.</p><p class="ql-align-center"><a href="{login_link}" rel="noopener noreferrer" target="_blank" style="color: white; background-color: rgb(76, 175, 80);"> Go to Login Page </a></p><p>If you have any questions, please don't hesitate to contact our support team.</p><p>Best regards,</p><p>The Admin Team</p>
"""

def send_email(recipient_name, recipient_email, login_link):
    """Sends a single formatted email."""
    msg = MIMEMultipart('alternative')
    msg['From'] = EMAIL_SENDER
    msg['To'] = recipient_email
    msg['Subject'] = EMAIL_SUBJECT

    # Format the HTML template with the user's specific data
    html_body = HTML_TEMPLATE.format(user_name=recipient_name, login_link=login_link)
    msg.attach(MIMEText(html_body, 'html'))

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()  # Secure the connection
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent email to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {recipient_email}. Error: {e}")
        return False

def main():
    """Main function to read data, generate links, and send emails."""
    print("Starting the script...")

    # Check if the user has filled in the credentials
    if SMTP_USERNAME == 'your_email@gmail.com' or SMTP_PASSWORD == 'your_app_password':
        print("\n*** ACTION REQUIRED ***")
        print("Please open the 'send_login_links.py' script and fill in your SMTP server settings (username, password, etc.) in the CONFIGURATION section before running.")
        return

    # --- Get Email Details from User ---
    print("\nPlease provide the details for the emails to be sent.")
    email_sender = input("Enter the sender's name (e.g., 'Your Name LMS Admin'): ")
    email_subject = input("Enter the email subject: ")

    try:
        # Read the student data from the CSV file
        df = pd.read_csv(DATA_FILE)
        print(f"Successfully loaded {len(df)} records from {DATA_FILE}.")
    except FileNotFoundError:
        print(f"Error: The file '{DATA_FILE}' was not found. Please make sure it is in the same directory as the script.")
        return
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    # Loop through each student in the Excel file
    for index, row in df.iterrows():
        user_name = row.get(NAME_COLUMN)
        user_email = row.get(EMAIL_COLUMN)

        if pd.isna(user_name) or pd.isna(user_email):
            print(f"Skipping row {index + 2} due to missing name or email.")
            continue

        # Construct the pre-populating URL
        # The email is URL-encoded to ensure it's safe to pass in a URL
        encoded_email = quote(user_email)
        prepopulating_url = f"{LMS_LOGIN_URL}?username={encoded_email}"

        # Send the email
        send_email(user_name, user_email, prepopulating_url, email_sender, email_subject)

    print("\nScript finished.")

if __name__ == "__main__":
    main()

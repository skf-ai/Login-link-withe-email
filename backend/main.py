from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import io
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from urllib.parse import quote
from typing import Optional, Dict, Any

app = FastAPI()

# Allow local React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- In-memory Storage -----------
store = {
    "students_df": None,
    "email_column_name": None,
}

# ----------- Models -----------
class SendEmailsRequest(BaseModel):
    template: str
    lms_url: str = Field("https://lms.siddhantaknowledge.org/login/index.php", example="https://lms.siddhantaknowledge.org/login/index.php")
    name_column: str = "Name"
    email_column: str = "Email"
    sender: Optional[str] = None      # display name only
    subject: Optional[str] = None

class Template(BaseModel):
    template: str

# ----------- File Storage Configuration -----------
TEMPLATE_FILE = "email_template.txt"

def load_template_from_file() -> str:
    try:
        with open(TEMPLATE_FILE, "r") as f:
            return f.read()
    except FileNotFoundError:
        # Provide a default template if not present
        return """<p>Hello {Name},</p>
<p>Welcome to our LMS platform! We are excited to have you onboard.</p>
<p>To make your first login easy, please click the link below. It will take you to the login page and pre-fill your email address.</p>
<p class="ql-align-center">
  <a href="{login_link}" rel="noopener noreferrer" target="_blank" style="color: white; background-color: rgb(76, 175, 80); padding: 8px 12px; text-decoration:none; border-radius:4px;">Go to Login Page</a>
</p>
<p>If you have any questions, please don't hesitate to contact our support team.</p>
<p>Best regards,</p>
<p>The Admin Team</p>"""

def save_template_to_file(template: str):
    with open(TEMPLATE_FILE, "w") as f:
        f.write(template)

# ----------- Helpers -----------
def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = df.columns.str.strip().str.replace(r"[\s_]+", "", regex=True).str.lower()
    return df

def find_email_column(df: pd.DataFrame) -> str:
    candidates = ["email", "emailid", "mail", "mailid", "e-mail", "e-mailid"]
    for c in candidates:
        if c in df.columns:
            return c
    raise HTTPException(status_code=400, detail="File must have an 'Email' column")

def read_any_table_upload(file: UploadFile) -> pd.DataFrame:
    filename = file.filename or "upload"
    name_lower = filename.lower()
    try:
        content = file.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        bio = io.BytesIO(content)
        if name_lower.endswith(".csv"):
            df = pd.read_csv(bio)
        elif name_lower.endswith((".xls", ".xlsx")):
            df = pd.read_excel(bio)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Upload CSV or Excel.")
        return df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}")

# ----------- Routes -----------
@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    df = read_any_table_upload(file)
    df_norm = normalize_columns(df)
    email_col_norm = find_email_column(df_norm)

    # Map normalized email column back to original
    try:
        email_col_index = list(df_norm.columns).index(email_col_norm)
        original_email_column = df.columns[email_col_index]
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Could not map normalized email column back to original.")

    if df[original_email_column].isna().all():
        raise HTTPException(status_code=400, detail="Email column has no data.")

    store["students_df"] = df
    store["email_column_name"] = original_email_column
    return {"status": "ok", "filename": file.filename, "rows": len(df)}

@app.get("/template")
async def get_template():
    template = load_template_from_file()
    return {"template": template}

@app.post("/template")
async def save_template(template: Template):
    save_template_to_file(template.template)
    return {"status": "ok"}

def get_smtp_config() -> Dict[str, Any]:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_str = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    # Validate presence
    if not all([smtp_host, smtp_port_str, smtp_username, smtp_password]):
        missing = []
        if not smtp_host: missing.append("SMTP_HOST")
        if not smtp_port_str: missing.append("SMTP_PORT")
        if not smtp_username: missing.append("SMTP_USERNAME")
        if not smtp_password: missing.append("SMTP_PASSWORD")
        raise HTTPException(
            status_code=500, 
            detail=f"Missing required SMTP environment variables: {', '.join(missing)}. Please check your .env file."
        )

    return {
        "host": smtp_host,
        "port": int(smtp_port_str),
        "username": smtp_username,
        "password": smtp_password,
    }

@app.post("/send-emails")
async def send_emails(payload: SendEmailsRequest):
    df = store.get("students_df")
    if df is None:
        raise HTTPException(status_code=400, detail="No student data uploaded. Please upload a file first.")

    smtp_config = get_smtp_config()
    results = {"sent": 0, "failed": 0, "errors": []}

    final_sender_name = (payload.sender or os.getenv("SMTP_SENDER_NAME", "LMS Team")).strip()
    final_subject = (payload.subject or os.getenv("SMTP_SUBJECT", "Your Login Link for the LMS Platform")).strip()
    formatted_from = formataddr((final_sender_name, smtp_config["username"]))

    try:
        server = smtplib.SMTP(smtp_config["host"], smtp_config["port"])
        server.starttls()
        server.login(smtp_config["username"], smtp_config["password"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMTP connection failed: {e}")

    email_column = store.get("email_column_name", payload.email_column)

    for _, row in df.iterrows():
        user_email = row.get(email_column)
        if pd.isna(user_email) or not user_email:
            continue

        encoded_email = quote(str(user_email))
        login_link = f"{payload.lms_url}?username={encoded_email}"

        msg = MIMEMultipart('alternative')
        msg['From'] = formatted_from
        msg['To'] = str(user_email)
        msg['Subject'] = final_subject
        # Fill template
        format_data = row.to_dict()
        format_data['login_link'] = login_link
        try:
            html_body = payload.template
            for key, value in format_data.items():
                html_body = html_body.replace(f"{{{key}}}", str(value))
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Failed to format template for {user_email}: {e}")
            continue

        msg.attach(MIMEText(html_body, 'html'))

        try:
            server.sendmail(smtp_config["username"], [str(user_email)], msg.as_string())
            results["sent"] += 1
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Failed to send to {user_email}: {e}")

    server.quit()
    return {"status": "ok", "results": results}

# ----------- Startup Event -----------
@app.on_event("startup")
async def startup_event():
    # No template loaded to store; templates handled via file
    pass

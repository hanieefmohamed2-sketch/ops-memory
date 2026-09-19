import io
import csv
from typing import Dict, Any
import pypdf
import docx


def parse_document(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extracts raw text from uploaded document files (PDF, DOCX, TXT, CSV, LOG, JSON).
    Returns metadata dict containing extracted_text, file_type, character_count, word_count.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded file is empty (0 bytes).")

    file_name_lower = filename.lower()
    extracted_text = ""
    file_type = "txt"

    if file_name_lower.endswith(".pdf"):
        file_type = "pdf"
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text()
                if txt:
                    pages_text.append(txt)
            extracted_text = "\n\n".join(pages_text)
            if not extracted_text.strip():
                raise ValueError("Could not extract readable text from PDF (file may be scanned image or encrypted).")
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    elif file_name_lower.endswith(".docx"):
        file_type = "docx"
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            extracted_text = "\n\n".join(paragraphs)
            if not extracted_text.strip():
                raise ValueError("DOCX document contains no readable paragraph text.")
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX document: {str(e)}")

    elif file_name_lower.endswith(".csv"):
        file_type = "csv"
        try:
            content_str = file_bytes.decode("utf-8", errors="ignore")
            reader = csv.reader(io.StringIO(content_str))
            rows_formatted = []
            for row in reader:
                if row:
                    rows_formatted.append(" | ".join(row))
            extracted_text = "\n".join(rows_formatted)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV document: {str(e)}")

    elif any(file_name_lower.endswith(ext) for ext in [".txt", ".log", ".json", ".md", ".yaml", ".yml"]):
        if file_name_lower.endswith(".log"): file_type = "log"
        elif file_name_lower.endswith(".json"): file_type = "json"
        elif file_name_lower.endswith(".md"): file_type = "md"
        else: file_type = "txt"

        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                extracted_text = file_bytes.decode("latin-1")
            except Exception as e:
                raise ValueError(f"Failed to decode text document encoding: {str(e)}")
    else:
        # Fallback text decoding attempt for unlisted extensions
        try:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
            file_type = filename.split(".")[-1] if "." in filename else "unknown"
        except Exception:
            raise ValueError(f"Unsupported file format '.{filename.split('.')[-1]}'. Supported formats: PDF, DOCX, TXT, CSV, LOG, JSON.")

    extracted_text = extracted_text.strip()
    if not extracted_text:
        raise ValueError("Document appears to be empty after text extraction.")

    return {
        "file_name": filename,
        "file_type": file_type,
        "extracted_text": extracted_text,
        "character_count": len(extracted_text),
        "word_count": len(extracted_text.split())
    }

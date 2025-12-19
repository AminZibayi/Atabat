# In the Name of God, the Creative, the Originator
"""
EasyOCR-based captcha solver for Persian/Arabic 3-digit captchas.
Usage: python ocr_captcha.py <image_path>
Output: JSON with recognized text and confidence: {"text": "123", "confidence": 0.95}
"""

import sys
import json
import easyocr

# Persian numerals to ASCII mapping
PERSIAN_TO_ASCII = {
    '۰': '0', '٠': '0',
    '۱': '1', '١': '1',
    '۲': '2', '٢': '2',
    '۳': '3', '٣': '3',
    '۴': '4', '٤': '4',
    '۵': '5', '٥': '5',
    '۶': '6', '٦': '6',
    '۷': '7', '٧': '7',
    '۸': '8', '٨': '8',
    '۹': '9', '٩': '9',
}


def convert_to_ascii(text: str) -> str:
    """Convert Persian/Arabic numerals to ASCII digits."""
    result = []
    for char in text:
        if char in PERSIAN_TO_ASCII:
            result.append(PERSIAN_TO_ASCII[char])
        elif char.isdigit():
            result.append(char)
    return ''.join(result)


def solve_captcha(image_path: str) -> dict:
    """
    Solve captcha using EasyOCR.
    Returns dict with recognized digits and average confidence.
    """
    # Initialize reader with Persian and Arabic for digit recognition
    # Use GPU if available, otherwise CPU
    reader = easyocr.Reader(['fa', 'ar'], gpu=True, verbose=False)

    # Read text from image with detail for confidence scores
    # detail=1 returns [[bbox, text, confidence], ...]
    results = reader.readtext(image_path, detail=1, paragraph=False)

    if not results:
        return {"text": "", "confidence": 0.0}

    # Combine all detected text and calculate average confidence
    texts = []
    confidences = []

    for (bbox, text, confidence) in results:
        texts.append(text)
        confidences.append(confidence)

    raw_text = ''.join(texts)
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    # Convert to ASCII digits
    digits = convert_to_ascii(raw_text)

    return {
        "text": digits,
        "raw": raw_text,
        "confidence": avg_confidence
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python ocr_captcha.py <image_path>"}), file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        result = solve_captcha(image_path)
        # Print result as JSON to stdout (will be captured by Node.js)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

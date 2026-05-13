import re

_PHONE_RE = re.compile(r'^\+?[\d\s\-().]{7,20}$')


def validate_phone(phone: str) -> str:
    """Normalise and validate a phone number. Returns the stripped value."""
    if not phone:
        return phone
    phone = phone.strip()
    digits = re.sub(r'\D', '', phone)
    if len(digits) < 7 or len(digits) > 15:
        raise ValueError('Введите корректный номер телефона (7–15 цифр)')
    if not _PHONE_RE.match(phone):
        raise ValueError('Введите корректный номер телефона')
    return phone

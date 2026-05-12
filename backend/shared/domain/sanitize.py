import re

ALLOWED_TAGS = frozenset(
    {
        'b',
        'i',
        'u',
        'strong',
        'em',
        'p',
        'br',
        'ol',
        'ul',
        'li',
        'span',
        'div',
    }
)


def sanitize_html(html: str) -> str:
    if not html:
        return ''
    result = re.sub(
        r'<script[^>]*>.*?</script>',
        '',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    result = re.sub(
        r'<style[^>]*>.*?</style>',
        '',
        result,
        flags=re.DOTALL | re.IGNORECASE,
    )
    result = re.sub(r'on\w+\s*=\s*"[^"]*"', '', result, flags=re.IGNORECASE)
    result = re.sub(r"on\w+\s*=\s*'[^']*'", '', result, flags=re.IGNORECASE)
    result = re.sub(r'</?(\w+)(\s[^>]*)?\s*/?>', _replace_tag, result)
    return result.strip()


def _replace_tag(match: re.Match) -> str:
    full = match.group(0)
    tag_name = match.group(1).lower()
    if tag_name in ALLOWED_TAGS:
        if full.startswith('</'):
            return f'</{tag_name}>'
        if tag_name == 'br':
            return '<br>'
        return f'<{tag_name}>'
    return ''
